<script lang="ts">
  import { formState } from '../stores/formState.svelte';
  import { ATRIBUTOS_COMPORTAMIENTO } from '../constants/behaviors';
  import BehaviorItem from './BehaviorItem.svelte';
  import SummaryCalculator from './SummaryCalculator.svelte';
  import { saveObservationToLocal, exportToCSV, getObservationsFromLocal, getMetadataSuggestions } from '../lib/storage';
  import SmartInput from './SmartInput.svelte';

  let isSubmitting = $state(false);
  let savedCount = $state(0);
  let suggestions = $state<{ observers: string[], tasks: string[] }>({ observers: [], tasks: [] });

  // Initialize count and listeners
  $effect(() => {
    const updateCount = () => {
      savedCount = getObservationsFromLocal().length;
    };
    updateCount();
    window.addEventListener('sst-synced', updateCount);
    return () => window.removeEventListener('sst-synced', updateCount);
  });

  // Fetch suggestions when plant changes
  $effect(() => {
    const fetchSuggestions = async () => {
        if (formState.planta) {
            const data = await getMetadataSuggestions(formState.planta);
            if (data) suggestions = data;
        }
    };
    fetchSuggestions();
  });

  const handleSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    isSubmitting = true;

    // Build unique ID
    const observation = {
      ...formState,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now()
    };

    saveObservationToLocal(observation);
    
    // No alert, just feedback via reset and count
    formState.reset();
    isSubmitting = false;
  };

  const handleExport = () => {
    const data = getObservationsFromLocal();
    if (data.length === 0) {
      alert('No hay observaciones guardadas para exportar.');
      return;
    }
    exportToCSV(data);
  };
</script>

<form onsubmit={handleSubmit} class="observation-form">
  <!-- Session Status -->
  <div class="session-status flex items-center gap-sm">
    <div class="save-dot"></div>
    <span>Progreso guardado automáticamente en este dispositivo</span>
  </div>

  <!-- Header Info -->
  <section class="section card header-info grid gap-md">
    <div class="row flex gap-md wrap">
      <div class="field flex-1">
        <label for="planta">Planta / Bodega:</label>
        <select id="planta" bind:value={formState.planta} required>
            <option value="" disabled selected>Seleccione planta...</option>
            <option value="Planta Palermo">Planta Palermo</option>
            <option value="Planta Sabaneta">Planta Sabaneta</option>
            <option value="Planta Itagüí">Planta Itagüí</option>
            <option value="Planta Buca">Planta Bucaramanga</option>
        </select>
      </div>
      <div class="field flex-1">
        <label for="fecha">Fecha:</label>
        <input type="date" id="fecha" bind:value={formState.fecha} required />
      </div>
    </div>
    
    <div class="row flex gap-md wrap">
      <div class="field flex-1">
        <label for="observador">Observador:</label>
        <SmartInput id="observador" placeholder="Nombre completo" bind:value={formState.observador} options={suggestions.observers} />
      </div>
      <div class="field flex-1">
        <label for="tarea">Tarea Observada:</label>
        <SmartInput id="tarea" placeholder="Ej: Cargue de bultos" bind:value={formState.tarea} options={suggestions.tasks} />
      </div>
    </div>
  </section>

  <!-- Real-time Stats -->
  <SummaryCalculator />

  <!-- Behavior List -->
  <section class="section behavior-list">
    <h2 class="section-title">Comportamientos Evaluados</h2>
    {#each ATRIBUTOS_COMPORTAMIENTO as behavior}
      <BehaviorItem {behavior} />
    {/each}
  </section>

  <!-- Footer Info -->
  <section class="section card footer-info grid gap-md">
    <div class="field">
      <label for="barreras">Barreras Identificadas (Tipo C):</label>
      <textarea id="barreras" placeholder="Indique si hay barreras fuera de control del trabajador" bind:value={formState.barrerasC} rows="3"></textarea>
    </div>
    <div class="field">
      <label for="seguimiento">Seguimiento Realizado:</label>
      <textarea id="seguimiento" placeholder="Acciones inmediatas tomadas" bind:value={formState.seguimiento} rows="2"></textarea>
    </div>
  </section>

  <div class="form-actions flex gap-md">
    <button type="submit" class="btn btn-primary flex-1" disabled={isSubmitting}>
      {isSubmitting ? 'Guardando...' : 'GUARDAR OBSERVACIÓN'}
    </button>
    <button type="button" class="btn btn-secondary flex-1" onclick={handleExport}>
      EXPORTAR CSV ({savedCount})
    </button>
  </div>
</form>

<style>
  .observation-form {
    max-width: 800px;
    margin: 0 auto;
    padding-bottom: 4rem;
  }

  .session-status {
    background: #f0fdf4;
    color: #166534;
    padding: 0.75rem 1rem;
    border-radius: var(--radius-md);
    font-size: 0.8rem;
    font-weight: 700;
    margin-bottom: var(--space-md);
    border: 1px solid #dcfce7;
  }

  .save-dot {
    width: 6px;
    height: 6px;
    background: #22c55e;
    border-radius: 50%;
  }

  .section {
    margin-bottom: var(--space-xl);
  }

  .section-title {
    margin-bottom: var(--space-lg);
    border-bottom: 2px solid var(--color-cta);
    display: inline-block;
    padding-bottom: 2px;
  }

  .header-info {
    border-top: 8px solid var(--color-cta);
  }

  .wrap {
    flex-wrap: wrap;
  }

  .flex-1 {
    flex: 1;
    min-width: 250px;
  }

  .form-actions {
    position: sticky;
    bottom: var(--space-md);
    background: rgba(248, 250, 252, 0.9);
    backdrop-filter: blur(8px);
    padding: var(--space-md);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-xl);
    z-index: 1000;
  }

  @media (max-width: 600px) {
    .row {
      flex-direction: column;
    }
  }
</style>
