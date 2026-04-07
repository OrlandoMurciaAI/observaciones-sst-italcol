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
  let showConfirmModal = $state(false);
  let showSuccess = $state(false);
  let validationError = $state<string | null>(null);

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

  const startSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    validationError = null;
    
    const result = formState.isValid();
    if (!result.valid) {
      validationError = result.message;
      // Scroll to error
      const errEl = document.querySelector('.validation-banner');
      errEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    showConfirmModal = true;
  };

  const confirmSubmit = () => {
    isSubmitting = true;
    showConfirmModal = false;

    const observation = {
      ...formState.toJSON(),
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now()
    };

    saveObservationToLocal(observation);
    
    showSuccess = true;
    setTimeout(() => {
      showSuccess = false;
      formState.reset();
      isSubmitting = false;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 2500);
  };
</script>

<form onsubmit={startSubmit} class="observation-form">
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

  {#if validationError}
    <div class="validation-banner flex items-center gap-md">
        <span class="icon">⚠️</span>
        <p>{validationError}</p>
    </div>
  {/if}

  <div class="form-actions flex gap-md">
    <button type="submit" class="btn btn-primary flex-1" disabled={isSubmitting}>
      {isSubmitting ? 'Procesando...' : '💾 GUARDAR OBSERVACIÓN'}
    </button>
  </div>
</form>

<!-- Confirmation Modal -->
{#if showConfirmModal}
    <div class="modal-backdrop">
        <div class="modal-content card shadow-xl">
            <header class="modal-header">
                <div class="alert-icon">📋</div>
                <h3>Resumen de Observación</h3>
                <p>Verifique que la información sea correcta antes de registrarla en el sistema central.</p>
            </header>
            
            <div class="summary-details">
                <div class="summary-row">
                    <span class="label">Tarea:</span>
                    <span class="value">{formState.tarea}</span>
                </div>
                <div class="summary-row">
                    <span class="label">Observador:</span>
                    <span class="value">{formState.observador}</span>
                </div>
                <div class="summary-stats">
                    <div class="stat-pills">
                        <div class="pill secure">
                            <span class="cnt">{formState.stats.seguros}</span>
                            <span class="lbl">Seguros</span>
                        </div>
                        <div class="pill risky">
                            <span class="cnt">{formState.stats.total - formState.stats.seguros}</span>
                            <span class="lbl">Riesgosos</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="modal-buttons flex gap-md">
                <button type="button" class="btn btn-secondary flex-1" onclick={() => showConfirmModal = false}>CORREGIR</button>
                <button type="button" class="btn btn-primary flex-1" onclick={confirmSubmit}>CONFIRMAR Y GUARDAR</button>
            </div>
        </div>
    </div>
{/if}

<!-- Success Overlay -->
{#if showSuccess}
    <div class="success-overlay">
        <div class="success-card shadow-xl">
            <div class="check-circle">✓</div>
            <h2>Reporte Guardado</h2>
            <p>La observación se registró exitosamente. Se sincronizará automáticamente al detectar conexión.</p>
        </div>
    </div>
{/if}

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
    width: 8px;
    height: 8px;
    background: #22c55e;
    border-radius: 50%;
    animation: pulsate 2s infinite;
  }

  @keyframes pulsate {
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.3); opacity: 0.7; }
    100% { transform: scale(1); opacity: 1; }
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

  .validation-banner {
    background-color: #fef2f2;
    border: 1px solid #fee2e2;
    border-left: 4px solid #ef4444;
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1.5rem;
    color: #991b1b;
  }

  .validation-banner p {
    margin: 0;
    font-weight: 600;
    font-size: 0.9rem;
  }

  /* Modal Styles */
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(15, 23, 42, 0.8);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    padding: 1rem;
  }

  .modal-content {
    background: white;
    width: 100%;
    max-width: 500px;
    padding: 2.5rem;
    border-radius: 24px;
    text-align: center;
    animation: slideUp 0.3s ease-out;
  }

  .alert-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  .modal-header h3 {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
    color: #1e293b;
  }

  .modal-header p {
    font-size: 0.9rem;
    color: #64748b;
    margin-bottom: 2rem;
  }

  .summary-details {
    background: #f8fafc;
    border-radius: 16px;
    padding: 1.5rem;
    margin-bottom: 2rem;
    text-align: left;
  }

  .summary-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 0.75rem;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 0.75rem;
    flex-wrap: wrap;
  }

  .summary-row:last-child {
    border-bottom: none;
    margin-bottom: 0;
  }

  .summary-row .label {
    font-weight: 600;
    color: #64748b;
    font-size: 0.85rem;
    white-space: nowrap;
  }

  .summary-row .value {
    font-weight: 700;
    color: #1e293b;
    font-size: 0.9rem;
    text-align: right;
    word-break: break-word;
    flex: 1;
    min-width: 150px;
  }

  .modal-buttons {
    display: flex;
    gap: 1rem;
    margin-top: 2rem;
    flex-wrap: wrap;
    justify-content: center;
  }

  .modal-buttons .btn {
    white-space: normal;
    line-height: 1.2;
    padding: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 50px;
    flex: 1;
    min-width: 140px;
  }

  .stat-pills {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
  }

  .pill {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.75rem;
    border-radius: 12px;
  }

  .pill.secure { background: #dcfce7; color: #166534; }
  .pill.risky { background: #fee2e2; color: #991b1b; }

  .pill .cnt { font-size: 1.25rem; font-weight: 800; }
  .pill .lbl { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; }

  /* Success Overlay */
  .success-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: white;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 3000;
  }

  .success-card {
    text-align: center;
    animation: scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    padding: 2rem;
  }

  .check-circle {
    width: 80px;
    height: 80px;
    background: #22c55e;
    color: white;
    font-size: 3rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    margin: 0 auto 2rem;
    box-shadow: 0 10px 30px rgba(34, 197, 94, 0.4);
  }

  .success-card h2 { font-size: 2rem; font-weight: 800; margin-bottom: 1rem; }
  .success-card p { color: #64748b; font-size: 1.1rem; }

  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  @keyframes scaleIn {
    from { transform: scale(0.8); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }

  @media (max-width: 600px) {
    .row {
      flex-direction: column;
    }
    
    .modal-content {
      padding: 1.5rem;
      max-width: 95vw;
    }

    .modal-buttons {
      flex-direction: column-reverse;
    }

    .summary-row {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.25rem;
    }

    .stat-pills {
      flex-direction: row; /* Keep pills side by side as they are small */
    }

    .success-card h2 {
      font-size: 1.5rem;
    }
  }
</style>
