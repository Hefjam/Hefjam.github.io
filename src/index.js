const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }

    if (url.pathname.startsWith('/api/')) {
      try {
        const res = await route(request, env, url);
        const h = new Headers(res.headers);
        for (const [k, v] of Object.entries(CORS)) h.set(k, v);
        return new Response(res.body, { status: res.status, headers: h });
      } catch (err) {
        console.error(err);
        return json({ error: 'Internal server error' }, 500);
      }
    }

    return env.ASSETS.fetch(request);
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

async function sha256hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function getSetting(env, key) {
  const row = await env.DB.prepare('SELECT value FROM settings WHERE key = ?').bind(key).first();
  return row?.value ?? null;
}

async function getAllSettings(env) {
  const { results } = await env.DB.prepare('SELECT key, value FROM settings').all();
  return Object.fromEntries(results.map(r => [r.key, r.value]));
}

function generateId() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 12);
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── Router ──────────────────────────────────────────────────────────────────

async function route(request, env, url) {
  const path = url.pathname.slice(4); // strip /api
  const method = request.method;

  if (path === '/auth' && method === 'POST') return handleAuth(request, env);
  if (path === '/availability' && method === 'GET') return handleAvailability(request, env, url);
  if (path === '/bookings' && method === 'POST') return handleCreateBooking(request, env);

  // Everything below requires staff auth
  const authErr = await requireAuth(request, env);
  if (authErr) return authErr;

  if (path === '/bookings' && method === 'GET') return handleListBookings(request, env, url);
  if (path === '/settings' && method === 'GET') return handleGetSettings(env);
  if (path === '/settings' && method === 'PUT') return handleUpdateSettings(request, env);

  const idMatch = path.match(/^\/bookings\/([a-zA-Z0-9]+)$/);
  if (idMatch) {
    const id = idMatch[1];
    if (method === 'PATCH') return handleUpdateBooking(request, env, id);
    if (method === 'DELETE') return handleCancelBooking(env, id);
  }

  return json({ error: 'Not found' }, 404);
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

async function getPinHash(env) {
  const stored = await getSetting(env, 'staff_pin_hash');
  return stored ?? (await sha256hex('1234'));
}

async function handleAuth(request, env) {
  const body = await request.json().catch(() => ({}));
  if (!body.pin) return json({ error: 'PIN required' }, 400);
  const pinHash = await getPinHash(env);
  if (body.pin !== pinHash) return json({ error: 'Invalid PIN' }, 401);
  return json({ token: pinHash, ok: true });
}

async function requireAuth(request, env) {
  const auth = request.headers.get('Authorization') ?? '';
  if (!auth.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);
  const token = auth.slice(7);
  const pinHash = await getPinHash(env);
  if (token !== pinHash) return json({ error: 'Unauthorized' }, 401);
  return null;
}

// ─── Settings ─────────────────────────────────────────────────────────────────

async function handleGetSettings(env) {
  const s = await getAllSettings(env);
  delete s.staff_pin_hash;
  return json(s);
}

async function handleUpdateSettings(request, env) {
  const body = await request.json().catch(() => ({}));
  const allowed = [
    'opening_time', 'closing_time', 'slot_interval_mins',
    'max_covers_per_slot', 'restaurant_name', 'booking_email', 'staff_pin_hash',
  ];
  const stmts = [];
  for (const [key, value] of Object.entries(body)) {
    if (!allowed.includes(key)) continue;
    stmts.push(
      env.DB.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').bind(key, String(value))
    );
  }
  if (stmts.length) await env.DB.batch(stmts);
  return json({ ok: true });
}

// ─── Availability ─────────────────────────────────────────────────────────────

async function handleAvailability(request, env, url) {
  const date = url.searchParams.get('date') ?? '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return json({ error: 'Invalid date' }, 400);

  const s = await getAllSettings(env);
  const openingTime = s.opening_time ?? '11:00';
  const closingTime = s.closing_time ?? '22:00';
  const slotInterval = parseInt(s.slot_interval_mins ?? '30');
  const maxCovers = parseInt(s.max_covers_per_slot ?? '20');

  const { results } = await env.DB.prepare(
    "SELECT time_slot, SUM(covers) AS booked FROM bookings WHERE date = ? AND status != 'cancelled' GROUP BY time_slot"
  ).bind(date).all();

  const bookedBySlot = Object.fromEntries(results.map(r => [r.time_slot, parseInt(r.booked)]));

  const [oh, om] = openingTime.split(':').map(Number);
  const [ch, cm] = closingTime.split(':').map(Number);
  const openMins = oh * 60 + om;
  const closeMins = ch * 60 + cm;

  // For today: only show future slots (with 15-min buffer)
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const nowMins = date === todayStr ? now.getHours() * 60 + now.getMinutes() + 15 : 0;

  const slots = [];
  for (let m = openMins; m < closeMins; m += slotInterval) {
    if (m < nowMins) continue;
    const h = Math.floor(m / 60);
    const min = m % 60;
    const time = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    const booked = bookedBySlot[time] ?? 0;
    slots.push({ time, available: Math.max(0, maxCovers - booked), booked, maxCovers });
  }

  return json({ date, slots });
}

// ─── Bookings ─────────────────────────────────────────────────────────────────

async function handleCreateBooking(request, env) {
  const body = await request.json().catch(() => ({}));
  const { date, time_slot, covers, name, phone, email, notes } = body;

  if (!date || !time_slot || !covers || !name || !phone) {
    return json({ error: 'Missing required fields' }, 400);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return json({ error: 'Invalid date' }, 400);
  if (!/^\d{2}:\d{2}$/.test(time_slot)) return json({ error: 'Invalid time format' }, 400);

  const coversNum = parseInt(covers);
  if (isNaN(coversNum) || coversNum < 1 || coversNum > 200) {
    return json({ error: 'Invalid covers count' }, 400);
  }

  // Validate email format if provided
  if (email && !email.includes('@')) return json({ error: 'Invalid email address' }, 400);

  // Check slot availability
  const maxCovers = parseInt((await getSetting(env, 'max_covers_per_slot')) ?? '20');
  const row = await env.DB.prepare(
    "SELECT COALESCE(SUM(covers), 0) AS booked FROM bookings WHERE date = ? AND time_slot = ? AND status != 'cancelled'"
  ).bind(date, time_slot).first();
  const alreadyBooked = parseInt(row?.booked ?? 0);

  if (alreadyBooked + coversNum > maxCovers) {
    return json({ error: 'Not enough availability for this slot' }, 409);
  }

  const id = generateId();
  const createdAt = new Date().toISOString();
  const cleanNotes = String(notes ?? '').trim().slice(0, 500);
  const cleanName = String(name).trim().slice(0, 100);
  const cleanPhone = String(phone).trim().slice(0, 30);
  const cleanEmail = String(email ?? '').trim().slice(0, 200);

  await env.DB.prepare(
    'INSERT INTO bookings (id, date, time_slot, covers, name, phone, email, notes, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, date, time_slot, coversNum, cleanName, cleanPhone, cleanEmail, cleanNotes, 'confirmed', createdAt).run();

  const booking = { id, date, time_slot, covers: coversNum, name: cleanName, phone: cleanPhone, email: cleanEmail, notes: cleanNotes, status: 'confirmed', created_at: createdAt };

  if (cleanEmail) {
    const restaurantName = (await getSetting(env, 'restaurant_name')) ?? 'The Taproom';
    const fromEmail = (await getSetting(env, 'booking_email')) ?? null;
    sendConfirmationEmail(env, booking, restaurantName, fromEmail).catch(() => {});
  }

  return json({ ok: true, booking });
}

async function handleListBookings(request, env, url) {
  const date = url.searchParams.get('date');
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return json({ error: 'Valid date required' }, 400);
  const { results } = await env.DB.prepare(
    'SELECT * FROM bookings WHERE date = ? ORDER BY time_slot ASC, created_at ASC'
  ).bind(date).all();
  return json({ bookings: results });
}

async function handleUpdateBooking(request, env, id) {
  const body = await request.json().catch(() => ({}));
  const allowed = ['status', 'covers', 'name', 'phone', 'email', 'notes', 'time_slot', 'date'];
  const validStatuses = ['confirmed', 'arrived', 'no_show', 'cancelled'];

  const updates = [];
  const values = [];
  for (const key of allowed) {
    if (body[key] === undefined) continue;
    if (key === 'status' && !validStatuses.includes(body[key])) continue;
    updates.push(`${key} = ?`);
    values.push(body[key]);
  }
  if (!updates.length) return json({ error: 'No valid fields to update' }, 400);

  values.push(id);
  await env.DB.prepare(`UPDATE bookings SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run();
  return json({ ok: true });
}

async function handleCancelBooking(env, id) {
  await env.DB.prepare("UPDATE bookings SET status = 'cancelled' WHERE id = ?").bind(id).run();
  return json({ ok: true });
}

// ─── Email ────────────────────────────────────────────────────────────────────

async function sendConfirmationEmail(env, booking, restaurantName, fromEmail) {
  if (!env.RESEND_API_KEY) return;

  const dateLabel = new Date(booking.date + 'T12:00:00').toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const html = `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:500px;margin:0 auto;padding:32px 24px;background:#f5f0e8;">
  <div style="background:#fff;border-radius:12px;padding:32px;">
    <h2 style="color:#3a1408;margin:0 0 8px;">Booking Confirmed</h2>
    <p style="color:#666;margin:0 0 24px;">Hi ${escapeHtml(booking.name)}, you're booked at <strong>${escapeHtml(restaurantName)}</strong>.</p>
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:10px 0;color:#888;border-bottom:1px solid #eee;width:40%;">Date</td><td style="padding:10px 0;font-weight:600;border-bottom:1px solid #eee;">${dateLabel}</td></tr>
      <tr><td style="padding:10px 0;color:#888;border-bottom:1px solid #eee;">Time</td><td style="padding:10px 0;font-weight:600;border-bottom:1px solid #eee;">${booking.time_slot}</td></tr>
      <tr><td style="padding:10px 0;color:#888;border-bottom:1px solid #eee;">Party size</td><td style="padding:10px 0;font-weight:600;border-bottom:1px solid #eee;">${booking.covers} ${booking.covers === 1 ? 'guest' : 'guests'}</td></tr>
      ${booking.notes ? `<tr><td style="padding:10px 0;color:#888;">Notes</td><td style="padding:10px 0;">${escapeHtml(booking.notes)}</td></tr>` : ''}
    </table>
    <p style="margin:24px 0 0;font-size:12px;color:#aaa;">Reference: ${booking.id}</p>
  </div>
</div>`;

  const from = fromEmail ?? `bookings@${restaurantName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: booking.email,
      subject: `Booking confirmed — ${booking.time_slot} on ${dateLabel} at ${restaurantName}`,
      html,
    }),
  });
}
