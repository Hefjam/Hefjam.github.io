// Cloudflare Worker — The Taproom Pizza
// Phase A: /api/menu (public) + /api/admin/* (PIN-gated)

const JSON_HEADERS = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };

function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), { status, headers: { ...JSON_HEADERS, ...extra } });
}

// ─── SEED DATA (applied on first KV read if empty) ────────────────────────────
const SEED = {
  version: 1,
  updatedAt: '2026-05-29T00:00:00Z',
  orderingEnabled: true,
  pausedMessage: "Sorry — we've sold out of dough for tonight!",
  items: [
    { id: 'garlic',    name: 'Garlic Bread',             price: 6,  tags: ['v'],  desc: 'Confit garlic & rosemary cream, parsley.',                                                                          eposId: 7664996, type: 'pizza',     available: true, special: false },
    { id: 'marinara',  name: 'Marinara',                 price: 10, tags: ['ve'], desc: 'San Marzano, garlic, oregano, olive oil.',                                                                          eposId: 7665016, type: 'pizza',     available: true, special: false },
    { id: 'margherita',name: 'Margherita',               price: 12, tags: ['v'],  desc: 'San Marzano, fior di latte, basil, olive oil.',                                                                     eposId: 7665039, type: 'pizza',     available: true, special: false },
    { id: 'pepperoni', name: 'Pepperoni',                price: 13, tags: [],     desc: 'San Marzano, fior di latte, pepperoni, oregano.',                                                                   eposId: 7665064, type: 'pizza',     available: true, special: false },
    { id: 'diavola',   name: 'Diavola',                  price: 14, tags: ['🌶'], desc: 'San Marzano, fior di latte, pepperoni, nduja, agrodolce peppers, hot honey, basil.',                               eposId: 7665070, type: 'pizza',     available: true, special: false },
    { id: 'beef',      name: 'Beef Ragu',                price: 15, tags: [],     desc: 'San Marzano, fior di latte, slow-braised beef shin & cheek, Parmesan, basil.',                                     eposId: 7665078, type: 'pizza',     available: true, special: false },
    { id: 'mushroom',  name: 'Mushroom & Taleggio',      price: 14, tags: ['v'],  desc: 'Fior di latte, taleggio, roasted chestnut mushrooms, gorgonzola, Parmesan, sherry vinegar glaze.',                eposId: 7665277, type: 'pizza',     available: true, special: false },
    { id: 'potato',    name: 'Potato & Prosciutto',      price: 14, tags: [],     desc: 'Confit garlic & rosemary cream, thinly sliced potato, guindillas, prosciutto crudo, Parmesan.',                   eposId: 7665308, type: 'pizza',     available: true, special: false },
    { id: 'tenderstem',name: 'Tenderstem & Vegan Nduja', price: 13, tags: ['ve'], desc: 'Pistachio pesto, tenderstem, vegan nduja, artichokes, olives, sun-blushed tomato, rocket.',                       eposId: 7665384, type: 'pizza',     available: true, special: false },
    { id: 'prawn',     name: 'Prawn & Anchovy',          price: 16, tags: [],     desc: 'Olive oil & garlic, fior di latte, prawns, anchovy, salsa verde, lemon.',                                         eposId: 7665403, type: 'pizza',     available: true, special: false },
    { id: 'chilli-oil',    name: 'House Italian Chilli Oil', price: 0.50, tags: [], desc: '', eposId: 7665572, type: 'condiment', available: true, special: false },
    { id: 'garlic-mayo',   name: 'House Garlic Mayo',        price: 0.50, tags: [], desc: '', eposId: 7665597, type: 'condiment', available: true, special: false },
    { id: 'chilli-flakes', name: 'Chilli Flakes',            price: 0,    tags: [], desc: '', eposId: 7665604, type: 'condiment', available: true, special: false },
    { id: 'parmesan',      name: 'Parmesan',                 price: 0.50, tags: [], desc: '', eposId: 7665609, type: 'condiment', available: true, special: false },
  ],
};

// ─── SESSION HMAC ──────────────────────────────────────────────────────────────
async function sign(data, secret) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const buf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifySession(request, env) {
  if (!env.ADMIN_PIN) return false;
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.match(/admin_session=([^;]+)/);
  if (!match) return false;
  let ts, sig;
  try { [ts, sig] = atob(match[1]).split(':'); } catch { return false; }
  if (!ts || !sig) return false;
  if (Date.now() - parseInt(ts, 10) > 8 * 3600 * 1000) return false;
  const expected = await sign(ts, env.ADMIN_PIN);
  return expected === sig;
}

// ─── KV HELPERS ───────────────────────────────────────────────────────────────
async function getMenu(env) {
  const data = await env.MENU.get('menu:current', 'json');
  if (!data) {
    const seeded = { ...SEED, updatedAt: new Date().toISOString() };
    await env.MENU.put('menu:current', JSON.stringify(seeded));
    return seeded;
  }
  return data;
}

// ─── HANDLERS ─────────────────────────────────────────────────────────────────
async function handleMenu(env) {
  const data = await getMenu(env);
  return json({ orderingEnabled: data.orderingEnabled, pausedMessage: data.pausedMessage, version: data.version, items: data.items });
}

async function handleAdminLogin(request, env) {
  if (!env.ADMIN_PIN) return json({ error: 'Admin not configured' }, 503);

  const ip = request.headers.get('cf-connecting-ip') || 'anon';
  const limitKey = `ratelimit:${ip}`;
  const attempts = parseInt(await env.MENU.get(limitKey) || '0', 10);
  if (attempts >= 5) return json({ error: 'Too many attempts. Try again in 15 minutes.' }, 429);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'Bad request' }, 400); }

  if (body.pin !== env.ADMIN_PIN) {
    await env.MENU.put(limitKey, String(attempts + 1), { expirationTtl: 900 });
    return json({ error: 'Wrong PIN' }, 401);
  }
  await env.MENU.delete(limitKey);

  const ts = String(Date.now());
  const sig = await sign(ts, env.ADMIN_PIN);
  const token = btoa(`${ts}:${sig}`);
  const cookieOpts = `HttpOnly; Secure; SameSite=Strict; Max-Age=${8 * 3600}; Path=/`;

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...JSON_HEADERS, 'Set-Cookie': `admin_session=${token}; ${cookieOpts}` },
  });
}

async function handleAdminMenu(request, env) {
  const authed = await verifySession(request, env);
  if (!authed) return json({ error: 'Unauthorized' }, 401);

  if (request.method === 'GET') {
    return json(await getMenu(env));
  }

  if (request.method === 'POST') {
    let incoming;
    try { incoming = await request.json(); } catch { return json({ error: 'Bad request' }, 400); }

    const current = await getMenu(env);
    if (incoming.version !== current.version) {
      return json({ error: 'Conflict: menu was updated elsewhere. Reload and try again.' }, 409);
    }

    const next = { ...incoming, version: current.version + 1, updatedAt: new Date().toISOString() };
    await env.MENU.put('menu:current', JSON.stringify(next));
    return json({ ok: true, version: next.version });
  }

  return json({ error: 'Method not allowed' }, 405);
}

// ─── ENTRY ────────────────────────────────────────────────────────────────────
export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);

    if (pathname === '/api/menu' && request.method === 'GET')       return handleMenu(env);
    if (pathname === '/api/admin/login' && request.method === 'POST') return handleAdminLogin(request, env);
    if (pathname === '/api/admin/menu')                               return handleAdminMenu(request, env);

    return env.ASSETS.fetch(request);
  },
};
