<script lang="ts">
  import { formState } from '../stores/formState.svelte';
  import type { Behavior } from '../constants/behaviors';

  const { behavior } = $props<{ behavior: Behavior }>();

  // Ensure answer exists in state
  if (!formState.responses[behavior.id]) {
    formState.responses[behavior.id] = { estado: 'no-aplica' };
  }

  const respuesta = $derived(formState.responses[behavior.id]);

  const setEstado = (estado: 'seguro' | 'riesgoso' | 'no-aplica') => {
    formState.responses[behavior.id].estado = estado;
  };

  const setClasificacion = (clasificacion: 'A' | 'B' | 'C') => {
    formState.responses[behavior.id].clasificacion = clasificacion;
  };
</script>

<div class="behavior-item card" class:riesgoso={respuesta.estado === 'riesgoso'}>
  <div class="header">
    <span class="id">#{behavior.id}</span>
    <h3>{behavior.title}</h3>
  </div>
  <p class="description">{behavior.description}</p>

  <div class="actions flex gap-sm">
    <button 
      type="button"
      class="btn btn-sm btn-safe" 
      class:active={respuesta.estado === 'seguro'} 
      onclick={() => setEstado('seguro')}
    >
      Seguro
    </button>
    <button 
      type="button"
      class="btn btn-sm btn-danger" 
      class:active={respuesta.estado === 'riesgoso'} 
      onclick={() => setEstado('riesgoso')}
    >
      Riesgoso
    </button>
    <button 
      type="button"
      class="btn btn-sm btn-secondary" 
      class:active={respuesta.estado === 'no-aplica'} 
      onclick={() => setEstado('no-aplica')}
    >
      N/A
    </button>
  </div>

  {#if respuesta.estado === 'riesgoso'}
    <div class="details grid gap-sm">
      <label for="motivo-{behavior.id}">Motivo del comportamiento riesgoso:</label>
      <textarea 
        id="motivo-{behavior.id}" 
        placeholder="Describa el motivo..." 
        bind:value={formState.responses[behavior.id].motivo}
      ></textarea>

      <label>Clasificación del Grado de Control:</label>
      <div class="clasificacion-group flex gap-sm">
        <button 
          type="button"
          class="btn btn-sm btn-opt" 
          class:active={respuesta.clasificacion === 'A'} 
          onclick={() => setClasificacion('A')}
        >
          A: Bajo su control
        </button>
        <button 
          type="button"
          class="btn btn-sm btn-opt" 
          class:active={respuesta.clasificacion === 'B'} 
          onclick={() => setClasificacion('B')}
        >
          B: Difícil control
        </button>
        <button 
          type="button"
          class="btn btn-sm btn-opt" 
          class:active={respuesta.clasificacion === 'C'} 
          onclick={() => setClasificacion('C')}
        >
          C: Fuera de su control
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .behavior-item {
    margin-bottom: var(--space-md);
    border-left: 6px solid var(--color-secondary);
    transition: all 0.3s ease;
  }

  .behavior-item.riesgoso {
    border-left-color: var(--color-danger);
    background-color: #fffafa;
  }

  .header {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    margin-bottom: var(--space-xs);
  }

  .id {
    background: var(--color-primary);
    color: white;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: 700;
  }

  h3 {
    margin: 0;
    font-size: 1.1rem;
    color: var(--color-primary);
  }

  .description {
    font-size: 0.9rem;
    color: var(--color-secondary);
    margin-bottom: var(--space-md);
  }

  .actions {
    margin-bottom: var(--space-md);
  }

  .btn-sm {
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
    flex: 1;
    opacity: 0.7;
  }

  .btn-sm:hover, .btn-sm.active {
    opacity: 1;
  }

  .btn-safe.active {
    background-color: var(--color-safe);
    color: white;
    box-shadow: 0 4px 10px rgba(16, 185, 129, 0.3);
  }

  .btn-danger.active {
    background-color: var(--color-danger);
    color: white;
    box-shadow: 0 4px 10px rgba(239, 68, 68, 0.3);
  }

  .btn-secondary.active {
    background-color: var(--color-primary);
    color: white;
  }

  .details {
    margin-top: var(--space-md);
    padding-top: var(--space-md);
    border-top: 1px dashed var(--color-border);
    animation: fadeIn 0.3s ease;
  }

  .btn-opt {
    background-color: var(--color-white);
    border: 1px solid var(--color-border);
    color: var(--color-primary);
    font-size: 0.75rem;
    flex: 1;
  }

  .btn-opt.active {
    background-color: var(--color-primary);
    color: white;
    border-color: var(--color-primary);
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(5px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>
