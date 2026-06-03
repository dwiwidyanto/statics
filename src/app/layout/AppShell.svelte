<script lang="ts">
  import { staticsTopics } from '../../content/topics/statics-content';
  export let currentPage: string;
  export let currentPageParams: any = {};
  export let onNavigate: (page: string, params?: any) => void;

  let isDarkMode = false;

  function toggleTheme() {
    isDarkMode = !isDarkMode;
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }

  // Set initial theme on mount
  import { onMount as svelteOnMount } from 'svelte';
  svelteOnMount(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      isDarkMode = true;
      document.documentElement.classList.add('dark');
    } else {
      isDarkMode = false;
      document.documentElement.classList.remove('dark');
    }
  });
</script>

<div class="app-layout">
  <!-- Sidebar -->
  <aside class="sidebar">
    <div class="sidebar-header">
      <span class="logo-icon">🏗️</span>
      <div class="logo-text">
        <h2>StaticsLab</h2>
        <span class="version-tag">MVP v1.0</span>
      </div>
    </div>

    <nav class="sidebar-nav">
      <div class="nav-section-title">Workspace</div>
      
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <div 
        class="nav-item {currentPage === 'dashboard' ? 'active' : ''}"
        on:click={() => onNavigate('dashboard')}
      >
        <span class="nav-icon">🏠</span>
        <span>Dashboard</span>
      </div>

      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <div 
        class="nav-item {currentPage === 'practice' ? 'active' : ''}"
        on:click={() => onNavigate('practice')}
      >
        <span class="nav-icon">📐</span>
        <span>FBD Sandbox</span>
      </div>

      <div class="nav-section-title">Concept Library</div>
      {#each staticsTopics as topic}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div 
          class="nav-item concept-nav-item {currentPage.startsWith('concept/') && currentPageParams.topicId === topic.id ? 'active' : ''}"
          on:click={() => onNavigate(`concept/${topic.id}`)}
        >
          <span class="nav-icon">📖</span>
          <span class="truncate">{topic.title.substring(3)}</span>
        </div>
      {/each}

      <div class="nav-section-title">Future Expansion</div>
      <div class="nav-item disabled">
        <span class="nav-icon">🕸️</span>
        <span>Truss Solver <small class="coming-soon">Stage 2</small></span>
      </div>
      <div class="nav-item disabled">
        <span class="nav-icon">📈</span>
        <span>Shear & Moment <small class="coming-soon">Stage 2</small></span>
      </div>
    </nav>

    <div class="sidebar-footer">
      <button class="btn btn-secondary theme-toggle" on:click={toggleTheme}>
        {#if isDarkMode}
          ☀️ Light Mode
        {:else}
          🌙 Dark Mode
        {/if}
      </button>
      <div class="footer-credit">
        © 2026 StaticsLab MVP
      </div>
    </div>
  </aside>

  <!-- Main Body Content Area -->
  <main class="main-viewport">
    <div class="viewport-content">
      <slot />
    </div>
  </main>
</div>

<style>
  .app-layout {
    display: flex;
    height: 100vh;
    width: 100vw;
    overflow: hidden;
  }

  .sidebar {
    width: 260px;
    background-color: var(--bg-secondary);
    border-right: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    height: 100%;
    flex-shrink: 0;
  }

  .sidebar-header {
    padding: 1.5rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    border-bottom: 1px solid var(--border-color);
  }

  .logo-icon {
    font-size: 1.75rem;
  }

  .logo-text h2 {
    font-size: 1.15rem;
    margin-bottom: 0;
    line-height: 1.1;
    font-weight: 800;
    letter-spacing: -0.02em;
  }

  .version-tag {
    font-size: 0.65rem;
    font-weight: 700;
    background-color: rgba(37, 99, 235, 0.1);
    color: var(--color-primary);
    padding: 0.1rem 0.35rem;
    border-radius: 4px;
  }

  .sidebar-nav {
    flex: 1;
    overflow-y: auto;
    padding: 1.25rem 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .nav-section-title {
    font-size: 0.68rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-weight: 700;
    color: var(--text-secondary);
    margin-top: 1rem;
    margin-bottom: 0.35rem;
    padding-left: 0.75rem;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.6rem 0.75rem;
    border-radius: 6px;
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s;
  }

  .nav-item:hover:not(.disabled) {
    background-color: var(--bg-primary);
    color: var(--text-primary);
  }

  .nav-item.active {
    background-color: rgba(37, 99, 235, 0.08);
    color: var(--color-primary);
    font-weight: 600;
  }

  .nav-item.disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .nav-icon {
    font-size: 1.1rem;
  }

  .truncate {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .coming-soon {
    font-size: 0.6rem;
    background-color: var(--bg-primary);
    border: 1px solid var(--border-color);
    padding: 0.05rem 0.25rem;
    border-radius: 3px;
    font-weight: 700;
  }

  .sidebar-footer {
    padding: 1rem 1.25rem;
    border-top: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .theme-toggle {
    width: 100%;
    font-size: 0.8rem;
    padding: 0.45rem;
  }

  .footer-credit {
    font-size: 0.7rem;
    text-align: center;
    color: var(--text-secondary);
  }

  .main-viewport {
    flex: 1;
    overflow-y: auto;
    background-color: var(--bg-primary);
    height: 100%;
  }

  .viewport-content {
    padding: 2rem;
  }

  @media (max-width: 768px) {
    .app-layout {
      flex-direction: column;
    }
    
    .sidebar {
      width: 100%;
      height: auto;
      border-right: none;
      border-bottom: 1px solid var(--border-color);
    }
    
    .sidebar-nav {
      flex-direction: row;
      overflow-x: auto;
      padding: 0.5rem;
      gap: 0.5rem;
    }
    
    .nav-section-title, .sidebar-footer {
      display: none;
    }
    
    .nav-item {
      padding: 0.4rem 0.6rem;
      white-space: nowrap;
    }
  }
</style>
