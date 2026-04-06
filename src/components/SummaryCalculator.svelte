<script lang="ts">
  import { formState } from '../stores/formState.svelte';

  const stats = $derived(formState.stats);
  const porcentaje = $derived(stats.porcentaje);
  const seguros = $derived(stats.seguros);
  const total = $derived(stats.total);
</script>

<div class="summary-card flex items-center justify-between">
  <div class="stat">
    <span class="label">Comportamientos Evaluados:</span>
    <span class="value">{total}</span>
  </div>
  <div class="stat">
    <span class="label">Seguros:</span>
    <span class="value safe">{seguros}</span>
  </div>
  <div class="percentage-container">
    <div class="progress-bar">
      <div class="progress" style="width: {porcentaje}%" class:danger={porcentaje < 80} class:warning={porcentaje >= 80 && porcentaje < 95} class:safe={porcentaje >= 95}></div>
    </div>
    <span class="percentage" class:danger={porcentaje < 80} class:warning={porcentaje >= 80 && porcentaje < 95} class:safe={porcentaje >= 95}>{porcentaje}% SEGURO</span>
  </div>
</div>

<style>
  .summary-card {
    background: white;
    padding: var(--space-md) var(--space-lg);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-lg);
    border: 2px solid var(--color-primary);
    position: sticky;
    top: var(--space-md);
    z-index: 100;
    margin-bottom: var(--space-xl);
  }

  .stat {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .stat .label {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--color-secondary);
    text-transform: uppercase;
  }

  .stat .value {
    font-size: 1.25rem;
    font-weight: 800;
    color: var(--color-primary);
  }

  .stat .value.safe {
    color: var(--color-safe);
  }

  .percentage-container {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: var(--space-xs);
    min-width: 150px;
  }

  .progress-bar {
    width: 100%;
    height: 8px;
    background: var(--color-border);
    border-radius: 4px;
    overflow: hidden;
  }

  .progress {
    height: 100%;
    transition: width 0.5s ease;
  }

  .progress.safe { background-color: var(--color-safe); }
  .progress.warning { background-color: var(--color-warning); }
  .progress.danger { background-color: var(--color-danger); }

  .percentage {
    font-size: 1.1rem;
    font-weight: 900;
    letter-spacing: -1px;
  }

  .percentage.safe { color: var(--color-safe); }
  .percentage.warning { color: var(--color-warning); }
  .percentage.danger { color: var(--color-danger); }

  @media (max-width: 600px) {
    .summary-card {
      flex-direction: column;
      gap: var(--space-md);
      align-items: stretch;
    }
    .percentage-container {
      align-items: center;
    }
  }
</style>
