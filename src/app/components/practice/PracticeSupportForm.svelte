<script lang="ts">
  import { locale, translations } from '../../../lib/utils/i18n';
  import Button from '../../../lib/ui/Button.svelte';

  export let bodyWidth: number;
  export let suppType: 'pin' | 'roller' | 'fixed';
  export let suppX: number;
  export let suppAngle: number;
  export let suppLabel: string;
  export let onCancel: () => void;
  export let onSave: () => void;
</script>

<h3>{translations[$locale].addSupportConstraint}</h3>
<div class="form-row">
  <div class="form-group">
    <label for="supp-type">{translations[$locale].supportType}</label>
    <select id="supp-type" class="form-control" bind:value={suppType}>
      <option value="pin">{translations[$locale].pinSupport}</option>
      <option value="roller">{translations[$locale].rollerSupport}</option>
      <option value="fixed">{translations[$locale].fixedJoint}</option>
    </select>
  </div>
  <div class="form-group">
    <label for="supp-x">{translations[$locale].positionX} (0 to {bodyWidth}m)</label>
    <input id="supp-x" type="number" min="0" max={bodyWidth} step="0.1" class="form-control" bind:value={suppX} />
  </div>
  <div class="form-group">
    <label for="supp-lbl">{translations[$locale].labelPrefix}</label>
    <input id="supp-lbl" type="text" maxlength="2" class="form-control" bind:value={suppLabel} />
  </div>
  {#if suppType === 'roller'}
    <div class="form-group">
      <label for="supp-ang">{translations[$locale].rollerIncline}</label>
      <input id="supp-ang" type="number" min="0" max="360" step="15" class="form-control" bind:value={suppAngle} />
    </div>
  {/if}
</div>
<div class="form-actions">
  <Button variant="secondary" on:click={onCancel}>{translations[$locale].cancel}</Button>
  <Button variant="primary" on:click={onSave}>{translations[$locale].saveSupport}</Button>
</div>

<style>
  h3 {
    font-size: 1rem;
    margin-bottom: 0.75rem;
    border-bottom: 1px dashed var(--border-color);
    padding-bottom: 0.4rem;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-top: 1rem;
    border-top: 1px solid var(--border-color);
    padding-top: 0.75rem;
  }
</style>
