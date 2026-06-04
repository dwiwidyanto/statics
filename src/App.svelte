<script lang="ts">
  import AppShell from './app/layout/AppShell.svelte';
  import Dashboard from './app/pages/Dashboard.svelte';
  import ConceptPage from './app/pages/ConceptPage.svelte';
  import PracticePage from './app/pages/PracticePage.svelte';
  import GuidedWorkspace from './app/pages/GuidedWorkspace.svelte';

  // Routing State
  let currentPage = 'dashboard';
  let currentPageParams: any = {};

  function navigate(page: string, params: any = {}) {
    currentPage = page;
    currentPageParams = params;
    
    // Smooth scroll to top on navigation
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Parse path out of current page string
  $: isConcept = currentPage.startsWith('concept/');
  $: activeTopicId = isConcept ? currentPage.substring(8) : null;
  $: isGuided = currentPage.startsWith('guided/');
  $: activeGuidedProblemId = isGuided ? currentPage.substring(7) : null;
</script>

<AppShell 
  {currentPage} 
  {currentPageParams}
  onNavigate={navigate}
>
  {#if currentPage === 'dashboard'}
    <Dashboard onNavigate={navigate} />
  {:else}
    {#if isConcept}
      <ConceptPage 
        topicId={activeTopicId || ''} 
        onNavigate={navigate} 
      />
    {:else if currentPage === 'practice'}
      <!-- We load the practice page, optionally passing a problemId parameter if it was sent -->
      <PracticePage 
        initialProblemId={currentPageParams.problemId || null} 
        onNavigate={navigate}
      />
    {:else if isGuided}
      <GuidedWorkspace 
        problemId={activeGuidedProblemId || ''} 
        onNavigate={navigate}
      />
    {:else}
      <Dashboard onNavigate={navigate} />
    {/if}
  {/if}
</AppShell>
