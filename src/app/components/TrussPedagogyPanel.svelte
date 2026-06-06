<script lang="ts">
  import { locale } from '../../lib/utils/i18n';
</script>

<div class="pedagogy-panel">
  <h3>{$locale === 'id' ? 'Tinjauan Konsep Rangka Batang' : 'Truss Concept Reference'}</h3>

  <div class="concept-content">
    <!-- Section 1: Determinacy -->
    <div class="concept-item">
      <h4 class="concept-title">
        <span class="icon">🔍</span>
        {$locale === 'id' ? 'Uji Stabilitas & Determinasi' : 'Determinacy & Stability Check'}
      </h4>
      <p>
        {$locale === 'id' 
          ? 'Gunakan hubungan berikut antara jumlah batang (m), reaksi tumpuan (r), dan titik hubung (j):'
          : 'Check stability and determinacy using the number of members (m), reactions (r), and joints (j):'}
      </p>
      <div class="formula">
        <strong>m + r = 2j</strong>
      </div>
      <ul class="concept-list">
        <li>
          {$locale === 'id'
            ? 'm + r < 2j: Rangka batang tidak stabil (mekanisme).'
            : 'm + r < 2j: Unstable structure (mechanism).'}
        </li>
        <li>
          {$locale === 'id'
            ? 'm + r = 2j: Rangka batang statis tertentu (jika susunan batangnya benar).'
            : 'm + r = 2j: Statically determinate (if geometrically stable).'}
        </li>
        <li>
          {$locale === 'id'
            ? 'm + r > 2j: Rangka batang statis tak tentu.'
            : 'm + r > 2j: Statically indeterminate.'}
        </li>
      </ul>
    </div>

    <!-- Section 2: Global Equilibrium -->
    <div class="concept-item">
      <h4 class="concept-title">
        <span class="icon">⚖️</span>
        {$locale === 'id' ? 'Kesetimbangan Global' : 'Global Equilibrium'}
      </h4>
      <p>
        {$locale === 'id'
          ? 'Sebelum menganalisis masing-masing batang, hitung reaksi tumpuan luar dengan menganggap seluruh rangka batang sebagai satu benda tegar tunggal:'
          : 'Before resolving member forces, solve for external support reactions by treating the entire truss as a single rigid body:'}
      </p>
      <div class="equations-block">
        <code>ΣFx = 0</code> &nbsp;|&nbsp; <code>ΣFy = 0</code> &nbsp;|&nbsp; <code>ΣM_pivot = 0</code>
      </div>
    </div>

    <!-- Section 3: Method of Joints -->
    <div class="concept-item">
      <h4 class="concept-title">
        <span class="icon">📌</span>
        {$locale === 'id' ? 'Metode Titik Hubung' : 'Method of Joints'}
      </h4>
      <p>
        {$locale === 'id'
          ? 'Isolasi setiap titik hubung (pin) dan terapkan kesetimbangan gaya partikel. Mulailah dari titik hubung yang memiliki maksimal 2 gaya batang yang tidak diketahui:'
          : 'Isolate each joint (pin) and apply particle equilibrium. Solve joints with at most two unknown member forces:'}
      </p>
      <div class="equations-block">
        <code>ΣFx = 0</code> &nbsp;&amp;&nbsp; <code>ΣFy = 0</code>
      </div>
      <p class="sign-convention-tip">
        💡 <strong>{$locale === 'id' ? 'Konvensi Tanda:' : 'Sign Convention:'}</strong>
        {$locale === 'id'
          ? 'Gaya batang positif selalu diasumsikan sebagai Tarik (menjauhi titik hubung). Hasil akhir negatif menunjukkan batang mengalami Tekan (menuju titik hubung).'
          : 'Positive forces are assumed to be in Tension (pulling away from the joint). A negative result indicates Compression (pushing towards the joint).'}
      </p>
    </div>

    <!-- Section 4: Zero-Force Members -->
    <div class="concept-item">
      <h4 class="concept-title">
        <span class="icon">⭕</span>
        {$locale === 'id' ? 'Batang Berdaya Nol (Zero-Force)' : 'Zero-Force Members (ZFMs)'}
      </h4>
      <p>
        {$locale === 'id'
          ? 'Identifikasi batang berdaya nol secara langsung tanpa perhitungan menggunakan dua aturan praktis berikut:'
          : 'Identify members carrying zero load by visual inspection using these two rules:'}
      </p>
      <ul class="concept-list">
        <li>
          <strong>{$locale === 'id' ? 'Aturan 1:' : 'Rule 1:'}</strong>
          {$locale === 'id'
            ? 'Jika dua batang non-kolinear (tidak segaris) bertemu pada titik hubung tanpa tumpuan dan tanpa beban luar, maka kedua batang tersebut adalah batang nol.'
            : 'If only two non-collinear members meet at an unloaded, unsupported joint, both are zero-force members.'}
        </li>
        <li>
          <strong>{$locale === 'id' ? 'Aturan 2:' : 'Rule 2:'}</strong>
          {$locale === 'id'
            ? 'Jika tiga batang bertemu pada titik hubung tanpa tumpuan dan tanpa beban luar di mana dua batang di antaranya segaris (kolinear), maka batang ketiga adalah batang nol.'
            : 'If three members meet at an unloaded, unsupported joint where two are collinear, the third (non-collinear) member is a zero-force member.'}
        </li>
      </ul>
    </div>
  </div>
</div>

<style>
  .pedagogy-panel {
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .pedagogy-panel h3 {
    font-size: 1.05rem;
    font-weight: 700;
    margin: 0;
    color: var(--text-primary);
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 0.5rem;
  }

  .concept-content {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .concept-item {
    font-size: 0.82rem;
    color: var(--text-secondary);
    line-height: 1.4;
  }

  .concept-item p {
    margin: 0.25rem 0;
  }

  .concept-title {
    font-size: 0.88rem;
    font-weight: 700;
    margin: 0 0 0.35rem 0;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }

  .formula {
    background-color: var(--bg-primary);
    border: 1px solid var(--border-color);
    padding: 0.35rem;
    border-radius: 4px;
    text-align: center;
    font-size: 1rem;
    color: var(--text-primary);
    margin: 0.5rem 0;
  }

  .equations-block {
    background-color: var(--bg-primary);
    border: 1px dashed var(--border-color);
    padding: 0.4rem;
    border-radius: 4px;
    text-align: center;
    font-family: monospace;
    font-size: 0.85rem;
    color: var(--text-primary);
    margin: 0.5rem 0;
  }

  .concept-list {
    margin: 0.35rem 0;
    padding-left: 1.2rem;
  }

  .concept-list li {
    margin-bottom: 0.25rem;
  }

  .sign-convention-tip {
    border-left: 3px solid var(--color-primary, #2563eb);
    padding-left: 0.5rem;
    background-color: var(--bg-primary);
    padding-top: 0.25rem;
    padding-bottom: 0.25rem;
    margin-top: 0.5rem;
  }
</style>
