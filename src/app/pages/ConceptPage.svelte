<script lang="ts">
  import { staticsTopics } from '../../content/topics/statics-content';
  import { locale, translations } from '../../lib/utils/i18n';

  export let topicId: string;
  export let onNavigate: (page: string, params?: any) => void;

  $: topic = staticsTopics.find(t => t.id === topicId);
  $: htmlContent = topic 
    ? parseMarkdown($locale === 'id' ? topic.contentMarkdownId || topic.contentMarkdown : topic.contentMarkdown) 
    : '';

  function parseMarkdown(md: string): string {
    const lines = md.split('\n');
    let html = '';
    let inList = false;
    let inAlert = false;
    let alertType = 'note';
    let inTable = false;

    for (let line of lines) {
      const trimmed = line.trim();

      // Heading 3
      if (trimmed.startsWith('###')) {
        if (inList) { html += '</ul>'; inList = false; }
        if (inAlert) { html += '</div>'; inAlert = false; }
        if (inTable) { html += '</tbody></table></div>'; inTable = false; }
        html += `<h3>${trimmed.substring(3).trim()}</h3>`;
        continue;
      }

      // Heading 2
      if (trimmed.startsWith('##')) {
        if (inList) { html += '</ul>'; inList = false; }
        if (inAlert) { html += '</div>'; inAlert = false; }
        if (inTable) { html += '</tbody></table></div>'; inTable = false; }
        html += `<h2>${trimmed.substring(2).trim()}</h2>`;
        continue;
      }

      // Alert box headers
      if (trimmed.startsWith('> [!')) {
        if (inList) { html += '</ul>'; inList = false; }
        if (inTable) { html += '</tbody></table></div>'; inTable = false; }
        if (inAlert) { html += '</div>'; }
        inAlert = true;
        alertType = trimmed.substring(4, trimmed.length - 1).toLowerCase();
        html += `<div class="alert alert-${alertType}">`;
        continue;
      }

      // Alert body lines
      if (trimmed.startsWith('>') && inAlert) {
        const content = trimmed.substring(1).trim();
        html += `<p>${parseInline(content)}</p>`;
        continue;
      }

      // Break alert
      if (!trimmed.startsWith('>') && inAlert) {
        html += '</div>';
        inAlert = false;
      }

      // Bullet lists
      if (trimmed.startsWith('-')) {
        if (inTable) { html += '</tbody></table></div>'; inTable = false; }
        if (!inList) {
          html += '<ul>';
          inList = true;
        }
        html += `<li>${parseInline(trimmed.substring(1).trim())}</li>`;
        continue;
      }

      if (!trimmed.startsWith('-') && inList) {
        html += '</ul>';
        inList = false;
      }

      // Tables
      if (trimmed.startsWith('|')) {
        if (inList) { html += '</ul>'; inList = false; }
        if (trimmed.includes('---')) continue; // Skip separator line
        
        const cells = trimmed.split('|').map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
        
        if (!inTable) {
          html += '<div class="table-wrapper"><table><thead><tr>';
          cells.forEach(c => {
            html += `<th>${parseInline(c)}</th>`;
          });
          html += '</tr></thead><tbody>';
          inTable = true;
        } else {
          html += '<tr>';
          cells.forEach(c => {
            html += `<td>${parseInline(c)}</td>`;
          });
          html += '</tr>';
        }
        continue;
      }

      if (!trimmed.startsWith('|') && inTable) {
        html += '</tbody></table></div>';
        inTable = false;
      }

      if (trimmed === '') {
        continue;
      }

      // Normal paragraph
      html += `<p>${parseInline(trimmed)}</p>`;
    }

    if (inList) html += '</ul>';
    if (inAlert) html += '</div>';
    if (inTable) html += '</tbody></table></div>';

    return html;
  }

  function parseInline(text: string): string {
    let res = text;
    // Bold
    res = res.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Inline code
    res = res.replace(/`(.*?)`/g, '<code>$1</code>');
    // Display Math
    res = res.replace(/\$\$(.*?)\$\$/g, '<div class="math-display">$1</div>');
    // Inline Math
    res = res.replace(/\$(.*?)\$/g, '<span class="math-inline">$1</span>');
    return res;
  }

  // Reactively calculate prev/next IDs when topicId changes
  $: prevId = (() => {
    const idx = staticsTopics.findIndex(t => t.id === topicId);
    return idx > 0 ? staticsTopics[idx - 1].id : null;
  })();

  $: nextId = (() => {
    const idx = staticsTopics.findIndex(t => t.id === topicId);
    return idx < staticsTopics.length - 1 ? staticsTopics[idx + 1].id : null;
  })();
</script>

<div class="concept-container">
  <div class="navigation-crumbs">
    <!-- svelte-ignore a11y-invalid-attribute -->
    <a href="#" on:click|preventDefault={() => onNavigate('dashboard')}>{translations[$locale].dashboard}</a>
    <span class="separator">/</span>
    <span class="current">{translations[$locale].conceptLibrary}</span>
  </div>

  {#if topic}
    <article class="concept-article">
      <h1>{$locale === 'id' ? topic.titleId || topic.title : topic.title}</h1>
      <div class="content-body">
        {@html htmlContent}
      </div>
    </article>

    <footer class="concept-footer">
      {#if prevId}
        <button class="btn btn-secondary" on:click={() => onNavigate(`concept/${prevId}`)}>
          ← {$locale === 'id' ? 'Bagian Sebelumnya' : 'Previous Section'}
        </button>
      {:else}
        <div></div>
      {/if}

      <button class="btn btn-primary" on:click={() => onNavigate('practice')}>
        {$locale === 'id' ? 'Latihan di Sandbox' : 'Practice in Sandbox'}
      </button>

      {#if nextId}
        <button class="btn btn-secondary" on:click={() => onNavigate(`concept/${nextId}`)}>
          {$locale === 'id' ? 'Bagian Selanjutnya' : 'Next Section'} →
        </button>
      {:else}
        <div></div>
      {/if}
    </footer>
  {:else}
    <div class="card error-card">
      <h2>{$locale === 'id' ? 'Halaman Konsep Tidak Ditemukan' : 'Concept Page Not Found'}</h2>
      <p>{$locale === 'id' ? 'Materi topik yang diminta tidak tersedia.' : 'The requested topic section does not exist.'}</p>
      <button class="btn btn-primary" on:click={() => onNavigate('dashboard')}>
        {$locale === 'id' ? 'Kembali ke Dasbor' : 'Return to Dashboard'}
      </button>
    </div>
  {/if}
</div>

<style>
  .concept-container {
    max-width: 800px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .navigation-crumbs {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    color: var(--text-secondary);
    font-weight: 500;
  }

  .navigation-crumbs a {
    color: var(--color-primary);
  }

  .separator {
    color: var(--border-color);
  }

  .concept-article {
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 2.5rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }

  .concept-article h1 {
    font-size: 2rem;
    border-bottom: 2px solid var(--border-color);
    padding-bottom: 0.75rem;
    margin-bottom: 1.5rem;
  }

  .content-body {
    line-height: 1.65;
    font-size: 1.05rem;
    color: var(--text-primary);
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  :global(.content-body h2) {
    font-size: 1.5rem;
    margin-top: 1.5rem;
    margin-bottom: 0.5rem;
    font-weight: 600;
  }

  :global(.content-body h3) {
    font-size: 1.2rem;
    margin-top: 1.25rem;
    margin-bottom: 0.25rem;
    font-weight: 600;
    color: var(--color-primary);
  }

  :global(.content-body p) {
    margin-bottom: 0.5rem;
  }

  :global(.content-body ul) {
    margin-left: 1.5rem;
    margin-bottom: 1rem;
  }

  :global(.content-body li) {
    margin-bottom: 0.4rem;
  }

  :global(.content-body code) {
    font-family: monospace;
    background-color: var(--bg-primary);
    padding: 0.15rem 0.35rem;
    border-radius: 4px;
    font-size: 0.9em;
    border: 1px solid var(--border-color);
  }

  /* Inline and display math styling */
  :global(.math-inline) {
    font-family: 'Times New Roman', Times, serif;
    font-style: italic;
    font-size: 1.1em;
  }

  :global(.math-display) {
    font-family: 'Times New Roman', Times, serif;
    font-style: italic;
    font-size: 1.2em;
    text-align: center;
    background-color: var(--bg-primary);
    padding: 0.75rem;
    border-radius: 6px;
    margin: 1rem 0;
    border: 1px solid var(--border-color);
  }

  /* Alerts inside markdown rendering */
  :global(.alert) {
    padding: 1rem;
    border-radius: 6px;
    margin: 1.25rem 0;
    border-left: 4px solid;
    font-size: 0.95rem;
  }

  :global(.alert p) {
    margin-bottom: 0;
  }

  :global(.alert-important) {
    background-color: rgba(239, 68, 68, 0.04);
    border-left-color: var(--color-error);
    color: var(--text-primary);
  }

  :global(.alert-tip) {
    background-color: rgba(16, 185, 129, 0.04);
    border-left-color: var(--color-success);
    color: var(--text-primary);
  }

  :global(.alert-warning) {
    background-color: rgba(245, 158, 11, 0.04);
    border-left-color: var(--color-warning);
    color: var(--text-primary);
  }

  /* Table styling inside content body */
  :global(.table-wrapper) {
    overflow-x: auto;
    margin: 1rem 0;
  }

  :global(.content-body table) {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
  }

  :global(.content-body th) {
    background-color: var(--bg-primary);
    font-weight: 600;
    border: 1px solid var(--border-color);
    padding: 0.5rem 0.75rem;
  }

  :global(.content-body td) {
    border: 1px solid var(--border-color);
    padding: 0.5rem 0.75rem;
  }

  .concept-footer {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 1rem;
    margin-top: 1.5rem;
  }

  .error-card {
    text-align: center;
    padding: 3rem;
  }
</style>
