// sw.js
// Intercepts GET requests to /api/stories and responds with mock JSON.
// Place this file at your site root for scope '/'

const MOCK_STORIES = [
  {
    title: "Chester’s Thick Sandwich",
    body: "Chester made a thick sandwich with crunchy chips. When he took a whiff, he shouted, “What a chewy, chunky lunch!” Then he shared with Theo on the white bench."
  },
  {
    title: "Whitney and the Shiny Shell",
    body: "Whitney found a shiny shell that whispered wishes. She chose to thank her friends with warm hot chocolate, while they chatted by the wharf at twilight."
  }
];

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only handle same-origin GET /api/stories
  if (event.request.method === 'GET' &&
      url.origin === self.location.origin &&
      url.pathname === '/api/stories') {

    const payload = JSON.stringify({ stories: MOCK_STORIES });
    const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
    event.respondWith(new Response(payload, { headers, status: 200 }));
    return;
  }
  // Otherwise: pass through to network
});
