import { json, generateId, getSetting, requireAuth, escapeHtml } from './lib.js';

export async function routePizza(path, method, request, env, url) {
  if (path === '/menu' && method === 'GET') return handleGetMenu(env);
  if (path === '/orders' && method === 'POST') return handleCreateOrder(request, env);

  // Staff-only routes
  const authErr = await requireAuth(request, env);
  if (authErr) return authErr;

  if (path === '/orders' && method === 'GET') return handleListOrders(request, env, url);

  const idMatch = path.match(/^\/orders\/([a-zA-Z0-9]+)$/);
  if (idMatch && method === 'PATCH') return handleUpdateOrder(request, env, idMatch[1]);

  return null;
}

// ── Menu ──────────────────────────────────────────────────────────────────────

async function handleGetMenu(env) {
  const [itemsRes, condimentsRes] = await Promise.all([
    env.DB.prepare('SELECT * FROM menu_items WHERE active = 1 ORDER BY sort_order ASC').all(),
    env.DB.prepare('SELECT * FROM condiments WHERE active = 1 ORDER BY sort_order ASC').all(),
  ]);

  const items = itemsRes.results.map(r => ({
    ...r,
    tags: JSON.parse(r.tags ?? '[]'),
    price: parseFloat(r.price),
  }));

  const condiments = condimentsRes.results.map(r => ({
    ...r,
    price: parseFloat(r.price),
  }));

  return json({ items, condiments });
}

// ── Orders ────────────────────────────────────────────────────────────────────

async function handleCreateOrder(request, env) {
  const body = await request.json().catch(() => ({}));
  const { tableNumber, items, tipPct, payMethod, customerEmail, marketingOptIn } = body;

  if (!tableNumber || !items || !Array.isArray(items) || items.length === 0) {
    return json({ error: 'tableNumber and items are required' }, 400);
  }

  const tableNum = parseInt(tableNumber);
  if (isNaN(tableNum) || tableNum < 1 || tableNum > 100) {
    return json({ error: 'Invalid table number' }, 400);
  }

  // Resolve prices from DB (never trust client-sent prices)
  const menuItems = await env.DB.prepare('SELECT * FROM menu_items WHERE active = 1').all();
  const condimentsDb = await env.DB.prepare('SELECT * FROM condiments WHERE active = 1').all();

  const menuMap = Object.fromEntries(menuItems.results.map(r => [r.id, r]));
  const condMap = Object.fromEntries(condimentsDb.results.map(r => [r.id, r]));

  let subtotal = 0;
  const resolvedItems = [];

  for (const line of items) {
    const menuItem = menuMap[line.itemId];
    if (!menuItem) return json({ error: `Unknown item: ${line.itemId}` }, 400);

    const itemPrice = parseFloat(menuItem.price);
    let lineCondiments = [];
    let condTotal = 0;

    for (const condId of (line.condiments ?? [])) {
      const cond = condMap[condId];
      if (!cond) continue;
      condTotal += parseFloat(cond.price);
      lineCondiments.push({ id: cond.id, name: cond.name, price: parseFloat(cond.price), eposId: cond.epos_id });
    }

    subtotal += itemPrice + condTotal;
    resolvedItems.push({
      itemId: menuItem.id,
      name: menuItem.name,
      price: itemPrice,
      eposId: menuItem.epos_id ?? null,
      condiments: lineCondiments,
    });
  }

  const tipAmount = parseFloat(((subtotal * (parseInt(tipPct ?? 0) / 100)).toFixed(2)));
  const total = parseFloat((subtotal + tipAmount).toFixed(2));

  const id = generateId();
  const orderNumber = String(100 + Math.floor(Math.random() * 800));
  const createdAt = new Date().toISOString();
  const cleanEmail = String(customerEmail ?? '').trim().slice(0, 200);
  const cleanPayMethod = String(payMethod ?? 'card').trim().slice(0, 30);

  await env.DB.prepare(
    `INSERT INTO orders
      (id, order_number, table_number, items, subtotal, tip_amount, total,
       pay_method, customer_email, marketing_opt_in, epos_ref, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id, orderNumber, tableNum, JSON.stringify(resolvedItems),
    subtotal, tipAmount, total, cleanPayMethod, cleanEmail,
    marketingOptIn ? 1 : 0, '', 'received', createdAt
  ).run();

  // Send to EposNow (non-blocking)
  sendToEposNow(env, { id, orderNumber, tableNum, resolvedItems }).catch(() => {});

  // Send email receipt (non-blocking)
  if (cleanEmail) {
    const restaurantName = (await getSetting(env, 'restaurant_name')) ?? 'The Taproom';
    sendOrderEmail(env, { id, orderNumber, tableNum, resolvedItems, subtotal, tipAmount, total, cleanEmail }, restaurantName).catch(() => {});
  }

  return json({ ok: true, orderId: id, orderNumber, total });
}

async function handleListOrders(request, env, url) {
  const date = url.searchParams.get('date');
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return json({ error: 'Valid date required' }, 400);

  const { results } = await env.DB.prepare(
    "SELECT * FROM orders WHERE date(created_at) = ? ORDER BY created_at DESC"
  ).bind(date).all();

  return json({
    orders: results.map(r => ({ ...r, items: JSON.parse(r.items) })),
  });
}

async function handleUpdateOrder(request, env, id) {
  const body = await request.json().catch(() => ({}));
  const validStatuses = ['received', 'preparing', 'ready', 'served', 'cancelled'];
  if (!body.status || !validStatuses.includes(body.status)) {
    return json({ error: 'Invalid status' }, 400);
  }
  await env.DB.prepare('UPDATE orders SET status = ? WHERE id = ?').bind(body.status, id).run();
  return json({ ok: true });
}

// ── EposNow integration ───────────────────────────────────────────────────────

async function sendToEposNow(env, { id, orderNumber, tableNum, resolvedItems }) {
  if (!env.EPOSNOW_API_KEY) return;

  // Build EposNow transaction lines
  // Items without an eposId are sent by name as a note line
  const transactionLines = [];
  for (const line of resolvedItems) {
    if (line.eposId) {
      transactionLines.push({
        ProductId: line.eposId,
        UnitPrice: line.price,
        Quantity: 1,
        Note: line.condiments.length
          ? line.condiments.map(c => c.name).join(', ')
          : undefined,
      });
    } else {
      // No eposId — send as a note/text line so kitchen still sees it
      transactionLines.push({
        ProductId: null,
        UnitPrice: line.price,
        Quantity: 1,
        Note: line.name + (line.condiments.length ? ': ' + line.condiments.map(c => c.name).join(', ') : ''),
      });
    }

    // Priced condiments as separate lines (they have their own eposIds)
    for (const cond of line.condiments) {
      if (cond.price > 0 && cond.eposId) {
        transactionLines.push({ ProductId: cond.eposId, UnitPrice: cond.price, Quantity: 1 });
      }
    }
  }

  const payload = {
    TransactionLines: transactionLines,
    Note: `Table ${tableNum} — Order #${orderNumber}`,
    ExternalRef: id,
  };

  const res = await fetch('https://api.eposnowhq.com/api/v4/Transaction', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(env.EPOSNOW_API_KEY + ':')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (res.ok) {
    const data = await res.json();
    const eposRef = String(data?.Id ?? '');
    await env.DB.prepare("UPDATE orders SET epos_ref = ?, status = 'sent' WHERE id = ?")
      .bind(eposRef, id).run();
  } else {
    await env.DB.prepare("UPDATE orders SET status = 'epos_failed' WHERE id = ?").bind(id).run();
    console.error('EposNow error:', res.status, await res.text());
  }
}

// ── Email receipt ─────────────────────────────────────────────────────────────

async function sendOrderEmail(env, { id, orderNumber, tableNum, resolvedItems, subtotal, tipAmount, total, cleanEmail }, restaurantName) {
  if (!env.RESEND_API_KEY) return;
  const fromEmail = (await getSetting(env, 'booking_email')) || null;

  const lineRows = resolvedItems.map(line => {
    const condStr = line.condiments.length
      ? `<div style="padding-left:16px;color:#888;font-size:13px;">${line.condiments.map(c => escapeHtml(c.name)).join(', ')}</div>`
      : '';
    return `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee;">${escapeHtml(line.name)}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">£${line.price.toFixed(2)}</td>
      </tr>
      ${condStr ? `<tr><td colspan="2" style="border-bottom:1px solid #eee;">${condStr}</td></tr>` : ''}`;
  }).join('');

  const html = `
<div style="font-family:-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:32px 16px;background:#f5f0e8;">
  <div style="background:#fff;border-radius:12px;padding:28px;">
    <h2 style="color:#3a1408;margin:0 0 4px;">Your receipt</h2>
    <p style="color:#888;margin:0 0 20px;font-size:14px;">Table ${tableNum} · Order #${orderNumber} · ${escapeHtml(restaurantName)}</p>
    <table style="width:100%;border-collapse:collapse;">${lineRows}</table>
    <table style="width:100%;border-collapse:collapse;margin-top:12px;">
      ${tipAmount > 0 ? `<tr><td style="padding:6px 0;color:#888;">Subtotal</td><td style="padding:6px 0;text-align:right;">£${subtotal.toFixed(2)}</td></tr>
      <tr><td style="padding:6px 0;color:#888;">Tip</td><td style="padding:6px 0;text-align:right;">£${tipAmount.toFixed(2)}</td></tr>` : ''}
      <tr><td style="padding:8px 0;font-weight:700;font-size:16px;">Total</td><td style="padding:8px 0;font-weight:700;font-size:16px;text-align:right;">£${total.toFixed(2)}</td></tr>
    </table>
    <p style="margin:20px 0 0;font-size:11px;color:#aaa;">Ref: ${id}</p>
  </div>
</div>`;

  const from = fromEmail ?? `orders@${restaurantName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from, to: cleanEmail,
      subject: `Your receipt from ${restaurantName} — Table ${tableNum}`,
      html,
    }),
  });
}
