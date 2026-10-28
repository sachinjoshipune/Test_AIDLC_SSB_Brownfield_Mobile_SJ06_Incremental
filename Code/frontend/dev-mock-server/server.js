/**
 * Dev-preview-only mock backend (NOT part of the production app).
 *
 * The real SB360 Backend API (Specifications/currentspec.md Section 5,
 * API-001..API-006) is an external, undocumented system out of scope for
 * this codebase. Without it, the app's resilience/error-handling behavior
 * (US-006/007/008) correctly surfaces "Something went wrong" for every
 * screen, since there is nothing to fetch and no cached data on first run.
 *
 * This script stands up a minimal, dependency-free HTTP server implementing
 * the exact API-001..API-006 contracts (shapes per Spec Section 5) purely so
 * that `expo start --web` has something real to talk to for local/dev
 * preview — e.g. in CI, in a browser Live Preview, or for manual QA of the
 * UI without standing up the real backend. It is intentionally permissive
 * (no auth enforcement) since its only purpose is exercising the UI.
 *
 * Usage: `node dev-mock-server/server.js [port]` (default port 8090).
 * Then point the web preview at it, e.g.:
 *   EXPO_PUBLIC_API_BASE_URL=http://localhost:8090 npx expo start --web
 */
const http = require('http');
const {URL} = require('url');

const PORT = Number(process.argv[2]) || 8090;

const NAV_ITEMS = {
  en: [
    {id: 'explore', label: 'Explore', icon: 'icon_explore', route: 'ExploreScreen', order: 1},
    {id: 'map', label: 'Map', icon: 'icon_map', route: 'MapScreen', order: 2},
    {id: 'plan', label: 'Plan', icon: 'icon_plan', route: 'PlanScreen', order: 3},
    {id: 'profile', label: 'My Profile', icon: 'icon_profile', route: 'ProfileScreen', order: 4},
  ],
  ar: [
    {id: 'explore', label: 'استكشاف', icon: 'icon_explore', route: 'ExploreScreen', order: 1},
    {id: 'map', label: 'الخريطة', icon: 'icon_map', route: 'MapScreen', order: 2},
    {id: 'plan', label: 'خطة', icon: 'icon_plan', route: 'PlanScreen', order: 3},
    {id: 'profile', label: 'الملف الشخصي', icon: 'icon_profile', route: 'ProfileScreen', order: 4},
  ],
};

// FR-001/API-005: Structured Explore content (replaces the former
// {headline, body} placeholder for sectionId:'explore' only). `map`/`plan`
// below are intentionally left as the original {headline, body} shape per
// FR-001's "no other mock handlers altered" requirement.
//
// `status` values other than 'open' are included here deliberately (e.g.
// 'closed') so the sequence/status handling below (AC-002) is exercised by
// real dev-preview data rather than a dataset that already satisfies the
// filter trivially. Image fields are registry keys resolved on the frontend
// via `assets/imageRegistry.ts`'s `resolveExploreImage()`, not raw URLs.
const EXPLORE_RAW_CONTENT = {
  heroBanner: {image: 'hero-explore-sports-boulevard'},
  featuredDestinations: [
    {
      name: 'Sports Boulevard',
      image: 'featured-destinations-card',
      shortDescription: 'A 135km active-lifestyle destination through the heart of Riyadh.',
      status: 'open',
      favourite: false,
      sequence: 1,
    },
    {
      name: 'King Abdullah Park',
      image: 'featured-destinations-card',
      shortDescription: 'Green open spaces with trails, picnic areas, and family zones.',
      status: 'open',
      favourite: true,
      sequence: 2,
    },
    {
      name: 'Wadi Hanifah Trail',
      image: 'featured-destinations-card',
      shortDescription: 'Seasonal walking and cycling trail along the historic wadi.',
      status: 'closed',
      favourite: false,
      sequence: 3,
    },
    {
      name: 'Equestrian Field',
      image: 'featured-destinations-card',
      shortDescription: 'Open-air equestrian field with scheduled public sessions.',
      status: 'open',
      favourite: false,
      sequence: 4,
    },
  ],
  thingsToDo: [
    {
      name: 'Cycling Track',
      image: 'things-to-do-card',
      destination: 'Sports Boulevard',
      category: 'sports',
      favourite: false,
      sequence: 1,
    },
    {
      name: 'Running Route',
      image: 'things-to-do-card',
      destination: 'Sports Boulevard',
      category: 'sports',
      favourite: true,
      sequence: 2,
    },
    {
      name: 'Picnic Area',
      image: 'things-to-do-card',
      destination: 'King Abdullah Park',
      category: 'leisure',
      favourite: false,
      sequence: 3,
    },
  ],
  mapEntry: {
    image: 'map-entry-card',
    label: 'Find it on the map',
  },
};

/**
 * AC-002: featuredDestinations is filtered to status === 'open' and both
 * featuredDestinations/thingsToDo are sorted ascending by sequence. Applied
 * at request time (rather than pre-sorted in the static data above) so the
 * contract is verifiably enforced by the server, not just coincidentally
 * true of the fixture ordering.
 */
function buildExploreContent() {
  const featuredDestinations = EXPLORE_RAW_CONTENT.featuredDestinations
    .filter(d => d.status === 'open')
    .slice()
    .sort((a, b) => a.sequence - b.sequence);

  const thingsToDo = EXPLORE_RAW_CONTENT.thingsToDo
    .slice()
    .sort((a, b) => a.sequence - b.sequence);

  return {
    heroBanner: EXPLORE_RAW_CONTENT.heroBanner,
    featuredDestinations,
    thingsToDo,
    mapEntry: EXPLORE_RAW_CONTENT.mapEntry,
  };
}

const SECTION_CONTENT = {
  map: {headline: 'Map', body: 'Interactive map placeholder content.'},
  plan: {headline: 'Plan', body: 'Your saved itinerary placeholder content.'},
};

function send(res, status, body) {
  const json = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,PUT,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  });
  res.end(json);
}

function readBody(req) {
  return new Promise(resolve => {
    let data = '';
    req.on('data', chunk => (data += chunk));
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        resolve({});
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,PUT,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    });
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  console.log(`[mock-backend] ${req.method} ${path}${url.search}`);

  // API-001
  if (req.method === 'GET' && path === '/api/v1/navigation/config') {
    const locale = url.searchParams.get('locale') === 'ar' ? 'ar' : 'en';
    send(res, 200, {items: NAV_ITEMS[locale]});
    return;
  }

  // API-005
  const sectionMatch = path.match(/^\/api\/v1\/sections\/(explore|map|plan)\/content$/);
  if (req.method === 'GET' && sectionMatch) {
    const sectionId = sectionMatch[1];
    // FR-001: 'explore' now returns the structured payload (heroBanner,
    // featuredDestinations[], thingsToDo[], mapEntry); 'map'/'plan' are
    // untouched and keep returning the original {headline, body} shape.
    const content =
      sectionId === 'explore' ? buildExploreContent() : SECTION_CONTENT[sectionId];
    send(res, 200, {sectionId, content});
    return;
  }

  // API-004
  if (req.method === 'GET' && path === '/api/v1/profile/me') {
    send(res, 200, {
      userId: 'preview-user-1',
      displayName: 'Preview Visitor',
      language: 'en',
      email: 'preview.visitor@example.invalid',
    });
    return;
  }

  // API-003
  if (req.method === 'PUT' && path === '/api/v1/profile/language') {
    const body = await readBody(req);
    send(res, 200, {
      userId: body.userId || 'preview-user-1',
      language: body.language === 'ar' ? 'ar' : 'en',
      updatedAt: new Date().toISOString(),
    });
    return;
  }

  // API-006
  if (req.method === 'GET' && path === '/api/v1/health') {
    send(res, 200, {status: 'ok', timestamp: new Date().toISOString()});
    return;
  }

  send(res, 404, {error: 'not_found', path});
});

server.listen(PORT, () => {
  console.log(`[mock-backend] Dev-preview-only mock SB360 API listening on http://localhost:${PORT}`);
});

// Generated by ATOS AI-DLC | Execution: c1c24aec-5f54-4519-8380-9378663984a1 | 2026-10-24T05:13:59.721Z