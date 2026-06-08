<script lang="ts">
  import { locale } from '../../../lib/utils/i18n';
</script>

<header class="progress-header">
  <div class="header-text">
    <span class="subheading">{$locale === 'id' ? 'Pelacakan Kemajuan' : 'Progress Tracking'}</span>
    <h1>{$locale === 'id' ? 'Progres Belajar Anda' : 'Your Learning Progress'}</h1>
    <p class="description">
      {$locale === 'id'
        ? 'Pantau kemajuan Anda dalam menyelesaikan soal-soal statika. Data disimpan secara lokal di browser Anda.'
        : 'Track your progress through the statics problem sets. Data is stored locally in your browser.'}
    </p>
  </div>
</header>

<style>
  .progress-header {
    background: linear-gradient(135deg, #0f766e 0%, #134e4a 100%);
    color: white;
    padding: 2rem 2.5rem;
    border-radius: 12px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  :global(html.dark) .progress-header {
    background: linear-gradient(135deg, #115e59 0%, #042f2e 100%);
    border: 1px solid var(--border-color);
  }

  .subheading {
    text-transform: uppercase;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    color: #99f6e4;
  }

  .progress-header h1 {
    color: white;
    font-size: 2rem;
    margin-top: 0.25rem;
    margin-bottom: 0.5rem;
  }

  .description {
    color: #ccfbf1;
    font-size: 0.95rem;
    line-height: 1.5;
  }
</style>
