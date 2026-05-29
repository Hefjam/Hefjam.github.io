// Cloudflare Worker entry point
// Phase 0: pass all requests to static assets (built by Vite into dist/)
// Phase A will add /api/* routes here before falling through to assets.

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Phase A: /api/* routes will go here
    // if (url.pathname.startsWith('/api/')) { ... }

    // Fall through to static assets
    return env.ASSETS.fetch(request);
  },
};
