<script lang="ts">
  import { locale } from '../../lib/utils/i18n';
  import type { TrussMember } from '../../lib/domain/truss/types';

  export let m: number;
  export let r: number;
  export let j: number;
  export let determinacy: string;
  export let stability: string;
  export let reactions: Record<string, number> = {};
  export let memberForces: Record<string, number> = {};
  export let members: TrussMember[] = [];
  export let zeroForceMembers: string[] = [];
</script>

<div class="results-grid">
  <!-- Determinacy Card -->
  <div class="panel-card">
    <h3>{$locale === 'id' ? 'Determinasi & Stabilitas' : 'Determinacy & Stability'}</h3>
    <div class="math-box">
      <p class="formula">m + r = 2j</p>
      <p class="math-eval">
        {m} (batang/members) + {r} (reaksi/reactions) = {m + r}
      </p>
      <p class="math-eval">
        2 × {j} (titik/joints) = {2 * j}
      </p>
      <p class="math-result">
        {m + r} {m + r === 2 * j ? '=' : m + r < 2 * j ? '<' : '>'} {2 * j}
      </p>
    </div>
    <div class="status-box">
      <div class="status-row">
        <span>{$locale === 'id' ? 'Klasifikasi:' : 'Classification:'}</span>
        <span class="badge badge-determinate">
          {#if determinacy === 'statically_determinate'}
            {$locale === 'id' ? 'Statis Tertentu' : 'Statically Determinate'}
          {:else if determinacy === 'statically_indeterminate'}
            {$locale === 'id' ? 'Statis Tak Tentu' : 'Statically Indeterminate'}
          {:else}
            {$locale === 'id' ? 'Labil' : 'Unstable'}
          {/if}
        </span>
      </div>
      <div class="status-row">
        <span>{$locale === 'id' ? 'Stabilitas:' : 'Stability:'}</span>
        <span class="badge badge-stable {stability === 'stable' ? 'stable' : 'unstable'}">
          {stability === 'stable' ? ($locale === 'id' ? 'STABIL' : 'STABLE') : ($locale === 'id' ? 'LABIL' : 'UNSTABLE')}
        </span>
      </div>
    </div>
  </div>

  <!-- Support Reactions Card -->
  <div class="panel-card">
    <h3>{$locale === 'id' ? 'Reaksi Tumpuan' : 'Support Reactions'}</h3>
    {#if Object.keys(reactions).length > 0}
      <div class="reactions-list">
        {#each Object.entries(reactions) as [symbol, value]}
          <div class="reaction-item">
            <span class="symbol">{symbol}</span>
            <span class="value">{value} N</span>
          </div>
        {/each}
      </div>
    {:else}
      <p class="empty-msg">{$locale === 'id' ? 'Belum terhitung' : 'No reactions calculated'}</p>
    {/if}
  </div>

  <!-- Zero-Force Members Card -->
  <div class="panel-card">
    <h3>{$locale === 'id' ? 'Batang Gaya Nol' : 'Zero-Force Members'}</h3>
    {#if zeroForceMembers.length > 0}
      <div class="zero-force-list">
        {#each zeroForceMembers as mId}
          {@const member = members.find(mem => mem.id === mId)}
          {#if member}
            <span class="zero-badge">{member.label}</span>
          {/if}
        {/each}
      </div>
      <p class="tip-text">
        {$locale === 'id'
          ? 'Gaya batang ini adalah nol karena memenuhi aturan joint tanpa beban/tumpuan.'
          : 'These members carry zero force under this specific loading configuration.'}
      </p>
    {:else}
      <p class="empty-msg">
        {$locale === 'id' ? 'Tidak ada batang gaya nol.' : 'No zero-force members detected.'}
      </p>
    {/if}
  </div>
</div>

<!-- Member Forces Table -->
<div class="panel-card table-card">
  <h3>{$locale === 'id' ? 'Gaya Aksial Batang' : 'Member Axial Forces'}</h3>
  <div class="table-responsive">
    <table class="member-table">
      <thead>
        <tr>
          <th>{$locale === 'id' ? 'Batang' : 'Member'}</th>
          <th>{$locale === 'id' ? 'Besar Gaya' : 'Force Magnitude'}</th>
          <th>{$locale === 'id' ? 'Keadaan' : 'State'}</th>
        </tr>
      </thead>
      <tbody>
        {#each members as m}
          {@const force = memberForces[m.id]}
          <tr>
            <td><strong>{m.label}</strong></td>
            <td>
              {force !== undefined ? `${Math.abs(force).toFixed(1)} N` : '-'}
            </td>
            <td>
              {#if force === undefined}
                <span class="state-label unsolved">-</span>
              {:else if Math.abs(force) < 1e-2}
                <span class="state-label zero">Gaya Nol / Zero</span>
              {:else if force > 0}
                <span class="state-label tension">{$locale === 'id' ? 'Tarik (T)' : 'Tension (T)'}</span>
              {:else}
                <span class="state-label compression">{$locale === 'id' ? 'Tekan (C)' : 'Compression (C)'}</span>
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

<style>
  .results-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1.25rem;
    margin-bottom: 1.5rem;
  }

  .panel-card {
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 1.25rem;
  }

  .table-card {
    margin-bottom: 1.5rem;
  }

  h3 {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--text-primary);
    margin-top: 0;
    margin-bottom: 1rem;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 0.5rem;
  }

  .math-box {
    text-align: center;
    background-color: var(--bg-primary);
    border-radius: 6px;
    padding: 0.75rem;
    margin-bottom: 1rem;
    border: 1px solid var(--border-color);
  }

  .formula {
    font-family: 'Courier New', Courier, monospace;
    font-weight: 700;
    font-size: 1.1rem;
    color: var(--color-primary, #2563eb);
    margin: 0 0 0.5rem 0;
  }

  .math-eval {
    font-size: 0.8rem;
    color: var(--text-secondary);
    margin: 0.2rem 0;
  }

  .math-result {
    font-size: 1.1rem;
    font-weight: 800;
    color: var(--text-primary);
    margin: 0.5rem 0 0 0;
  }

  .status-box {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .status-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.85rem;
    color: var(--text-secondary);
  }

  .badge {
    font-size: 0.75rem;
    font-weight: 700;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
  }

  .badge-determinate {
    background-color: rgba(13, 148, 136, 0.1);
    color: #0d9488;
  }

  .badge-stable {
    background-color: rgba(37, 99, 235, 0.1);
    color: #2563eb;
  }

  .badge-stable.unstable {
    background-color: rgba(220, 38, 38, 0.1);
    color: #dc2626;
  }

  .reactions-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .reaction-item {
    display: flex;
    justify-content: space-between;
    padding: 0.4rem 0.5rem;
    background-color: var(--bg-primary);
    border-radius: 4px;
    border: 1px solid var(--border-color);
    font-size: 0.85rem;
  }

  .reaction-item .symbol {
    font-weight: 700;
    color: var(--text-primary);
  }

  .reaction-item .value {
    color: #2563eb;
    font-weight: 700;
  }

  .zero-force-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-bottom: 0.75rem;
  }

  .zero-badge {
    background-color: rgba(156, 163, 175, 0.15);
    color: #4b5563;
    font-size: 0.75rem;
    font-weight: 700;
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
    border: 1px solid rgba(156, 163, 175, 0.3);
  }

  .tip-text {
    font-size: 0.72rem;
    color: var(--text-secondary);
    margin: 0;
    line-height: 1.3;
  }

  .empty-msg {
    font-size: 0.85rem;
    color: var(--text-secondary);
    text-align: center;
    margin: 1.5rem 0;
  }

  /* Member Table styling */
  .table-responsive {
    overflow-x: auto;
  }

  .member-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;
  }

  .member-table th,
  .member-table td {
    padding: 0.6rem 0.75rem;
    text-align: left;
    border-bottom: 1px solid var(--border-color);
  }

  .member-table th {
    font-weight: 700;
    color: var(--text-secondary);
    background-color: var(--bg-primary);
  }

  .member-table tr:hover {
    background-color: var(--bg-primary);
  }

  .state-label {
    font-size: 0.75rem;
    font-weight: 700;
    padding: 0.15rem 0.45rem;
    border-radius: 4px;
    display: inline-block;
  }

  .state-label.tension {
    background-color: rgba(13, 148, 136, 0.1);
    color: #0d9488;
  }

  .state-label.compression {
    background-color: rgba(234, 88, 12, 0.1);
    color: #ea580c;
  }

  .state-label.zero {
    background-color: rgba(156, 163, 175, 0.15);
    color: #4b5563;
  }

  .state-label.unsolved {
    background-color: transparent;
    color: var(--text-secondary);
  }
</style>
