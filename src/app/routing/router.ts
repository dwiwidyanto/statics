/**
 * Hash-based SPA router for StaticsLab.
 *
 * Uses window.location.hash so the app works with any static file server
 * without server-side catch-all configuration.
 *
 * Route patterns:
 *   #/                       → dashboard
 *   #/practice               → practice sandbox
 *   #/practice/:problemId    → practice with preloaded problem
 *   #/guided/:problemId      → guided beam workspace
 *   #/concept/:topicId       → concept page
 *   #/progress               → progress dashboard
 *   #/trusses                → truss workspace
 *   #/trusses/:problemId     → truss workspace with preloaded problem
 *   (anything else)          → dashboard (fallback)
 */

import { writable } from 'svelte/store';

// ---------------------------------------------------------------------------
// Route types
// ---------------------------------------------------------------------------

export type Route =
  | { page: 'dashboard' }
  | { page: 'practice'; problemId?: string }
  | { page: 'guided'; problemId: string }
  | { page: 'concept'; topicId: string }
  | { page: 'progress' }
  | { page: 'trusses'; problemId?: string };

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

/** Parse a hash string (e.g. "#/guided/beam-1") into a Route object. */
export function parseRoute(hash: string): Route {
  // Strip leading "#" and optional leading "/"
  const raw = (hash || '').replace(/^#\/?/, '');
  const segments = raw.split('/').filter(Boolean);

  if (segments.length === 0) {
    return { page: 'dashboard' };
  }

  switch (segments[0]) {
    case 'practice':
      return segments.length > 1
        ? { page: 'practice', problemId: segments.slice(1).join('/') }
        : { page: 'practice' };

    case 'guided':
      if (segments.length > 1) {
        return { page: 'guided', problemId: segments.slice(1).join('/') };
      }
      return { page: 'dashboard' };

    case 'concept':
      if (segments.length > 1) {
        return { page: 'concept', topicId: segments.slice(1).join('/') };
      }
      return { page: 'dashboard' };

    case 'progress':
      return { page: 'progress' };

    case 'trusses':
      return segments.length > 1
        ? { page: 'trusses', problemId: segments.slice(1).join('/') }
        : { page: 'trusses' };

    default:
      return { page: 'dashboard' };
  }
}

// ---------------------------------------------------------------------------
// Building
// ---------------------------------------------------------------------------

/** Build a hash string from a Route object. */
export function buildHash(route: Route): string {
  switch (route.page) {
    case 'dashboard':
      return '#/';
    case 'practice':
      return route.problemId ? `#/practice/${route.problemId}` : '#/practice';
    case 'guided':
      return `#/guided/${route.problemId}`;
    case 'concept':
      return `#/concept/${route.topicId}`;
    case 'progress':
      return '#/progress';
    case 'trusses':
      return route.problemId ? `#/trusses/${route.problemId}` : '#/trusses';
  }
}

// ---------------------------------------------------------------------------
// Svelte store
// ---------------------------------------------------------------------------

function createRouterStore() {
  const initial = typeof window !== 'undefined'
    ? parseRoute(window.location.hash)
    : { page: 'dashboard' as const };

  const { subscribe, set } = writable<Route>(initial);

  if (typeof window !== 'undefined') {
    const onHashChange = () => {
      set(parseRoute(window.location.hash));
    };
    window.addEventListener('hashchange', onHashChange);
  }

  return { subscribe };
}

export const currentRoute = createRouterStore();

// ---------------------------------------------------------------------------
// Navigation helper
// ---------------------------------------------------------------------------

/**
 * Navigate to a route. Updates location.hash which triggers the store update.
 * Optionally replaces history instead of pushing.
 */
export function navigateTo(route: Route, replace = false): void {
  const hash = buildHash(route);
  if (replace) {
    window.location.replace(hash);
  } else {
    window.location.hash = hash;
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ---------------------------------------------------------------------------
// Legacy bridge
// ---------------------------------------------------------------------------

/**
 * Convert a legacy page string (e.g. "guided/beam-1", "dashboard", "practice")
 * and optional params into a Route object for backward compatibility.
 */
export function legacyToRoute(page: string, params?: { problemId?: string }): Route {
  if (page === 'dashboard') return { page: 'dashboard' };
  if (page === 'progress') return { page: 'progress' };
  if (page === 'practice') return { page: 'practice', problemId: params?.problemId };
  if (page === 'trusses') return { page: 'trusses', problemId: params?.problemId };
  if (page.startsWith('guided/')) return { page: 'guided', problemId: page.substring(7) };
  if (page.startsWith('concept/')) return { page: 'concept', topicId: page.substring(8) };
  if (page.startsWith('trusses/')) return { page: 'trusses', problemId: page.substring(8) };
  return { page: 'dashboard' };
}

/**
 * Determines the target route for a saved attempt based on the problem ID and list of all problems.
 */
export function getRouteForAttempt(
  problemId: string,
  allProblems: { id: string; topic: string }[]
): Route {
  const problem = allProblems.find(p => p.id === problemId);
  if (problem) {
    if (problem.topic === 'trusses') {
      return { page: 'trusses', problemId };
    } else if (problem.topic === 'beam-internal-forces') {
      return { page: 'guided', problemId };
    } else {
      return { page: 'practice', problemId };
    }
  }

  // Fallbacks based on string prefixes/contents
  if (problemId.startsWith('truss-')) {
    return { page: 'trusses', problemId };
  } else if (problemId.includes('beam') || problemId.startsWith('guided-')) {
    return { page: 'guided', problemId };
  }
  return { page: 'practice', problemId };
}

