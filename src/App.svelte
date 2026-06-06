<script lang="ts">
  import AppShell from './app/layout/AppShell.svelte';
  import Dashboard from './app/pages/Dashboard.svelte';
  import ConceptPage from './app/pages/ConceptPage.svelte';
  import PracticePage from './app/pages/PracticePage.svelte';
  import GuidedWorkspace from './app/pages/GuidedWorkspace.svelte';
  import ProgressPage from './app/pages/ProgressPage.svelte';
  import { currentRoute, navigateTo, legacyToRoute } from './app/routing/router';
  import type { Route } from './app/routing/router';

  // Subscribe to the router store
  let route: Route = { page: 'dashboard' };
  currentRoute.subscribe(r => { route = r; });

  /**
   * Legacy-compatible navigate function.
   * All existing components call onNavigate(page, params).
   * This bridges to the new hash-based router.
   */
  function navigate(page: string, params: any = {}) {
    navigateTo(legacyToRoute(page, params));
  }

  // Derived route info for template conditionals
  $: currentPage = (() => {
    switch (route.page) {
      case 'dashboard': return 'dashboard';
      case 'practice': return 'practice';
      case 'guided': return `guided/${route.problemId}`;
      case 'concept': return `concept/${route.topicId}`;
      case 'progress': return 'progress';
      default: return 'dashboard';
    }
  })();
</script>

<AppShell 
  {currentPage} 
  onNavigate={navigate}
>
  {#if route.page === 'dashboard'}
    <Dashboard onNavigate={navigate} />
  {:else if route.page === 'concept'}
    <ConceptPage 
      topicId={route.topicId} 
      onNavigate={navigate} 
    />
  {:else if route.page === 'practice'}
    <PracticePage 
      initialProblemId={route.problemId || null} 
      onNavigate={navigate}
    />
  {:else if route.page === 'guided'}
    <GuidedWorkspace 
      problemId={route.problemId} 
      onNavigate={navigate}
    />
  {:else if route.page === 'progress'}
    <ProgressPage onNavigate={navigate} />
  {:else}
    <Dashboard onNavigate={navigate} />
  {/if}
</AppShell>
