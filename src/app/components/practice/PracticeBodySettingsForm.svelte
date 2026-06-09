<script lang="ts">
  import { locale, translations } from '../../../lib/utils/i18n';
  import type { RigidBody } from '../../../lib/domain/models/types';
  import Button from '../../../lib/ui/Button.svelte';

  export let body: RigidBody;
  export let onBodyChange: (body: RigidBody) => void;
  export let onClose: () => void;

  function updateBody(patch: Partial<RigidBody>) {
    onBodyChange({ ...body, ...patch });
  }
</script>

<h3>{translations[$locale].editBodyDimensions}</h3>
<div class="form-row">
  <div class="form-group">
    <label for="body-type">{translations[$locale].bodyType}</label>
    <select id="body-type" class="form-control" value={body.type} on:change={(event) => updateBody({ type: (event.currentTarget as HTMLSelectElement).value as RigidBody['type'] })}>
      <option value="beam">{translations[$locale].beamLinear}</option>
      <option value="block">{translations[$locale].blockPlanar}</option>
    </select>
  </div>
  <div class="form-group">
    <label for="body-w">{translations[$locale].widthLength}</label>
    <input id="body-w" type="number" min="1" max="15" step="0.5" class="form-control" value={body.width} on:input={(event) => updateBody({ width: (event.currentTarget as HTMLInputElement).valueAsNumber })} />
  </div>
  <div class="form-group">
    <label for="body-h">{translations[$locale].height}</label>
    <input id="body-h" type="number" min="0.1" max="5" step="0.1" class="form-control" value={body.height} on:input={(event) => updateBody({ height: (event.currentTarget as HTMLInputElement).valueAsNumber })} />
  </div>
  <div class="form-group">
    <label for="body-wt">{translations[$locale].selfWeight}</label>
    <input id="body-wt" type="number" min="0" max="1000" step="10" class="form-control" value={body.weight} on:input={(event) => updateBody({ weight: (event.currentTarget as HTMLInputElement).valueAsNumber })} />
  </div>
</div>
<div class="form-actions">
  <Button variant="secondary" on:click={onClose}>{translations[$locale].close}</Button>
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
