import { CORS, json } from './lib.js';
import { routeBooking } from './booking.js';
import { routePizza } from './pizza.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }

    if (url.pathname.startsWith('/api/')) {
      try {
        const path = url.pathname.slice(4); // strip /api
        const method = request.method;

        const res =
          (await routeBooking(path, method, request, env, url)) ??
          (await routePizza(path, method, request, env, url)) ??
          json({ error: 'Not found' }, 404);

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
