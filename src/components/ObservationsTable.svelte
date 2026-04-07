<script lang="ts">
    import { onMount, tick } from 'svelte';
    import dayjs from 'dayjs';
    import { 
        Trash2, Edit3, Save, X, Search, Filter, 
        AlertTriangle, Calendar, ChevronDown, ChevronUp,
        CheckCircle2, AlertCircle, Info, RefreshCw
    } from 'lucide-svelte';
    import { ATRIBUTOS_COMPORTAMIENTO } from '../constants/behaviors';

    let observations = $state([]);
    let loading = $state(true);
    let error = $state(null);
    let searchTerm = $state('');
    
    // Filters
    let startDate = $state(dayjs().format('YYYY-MM-DD'));
    let endDate = $state(dayjs().format('YYYY-MM-DD'));
    
    // UI State
    let editingObs = $state(null);
    let isModalOpen = $state(false);
    let saving = $state(false);

    // Fetch observations
    async function loadObservations() {
        loading = true;
        error = null;
        try {
            const url = new URL('/api/observations', window.location.origin);
            url.searchParams.append('from', startDate);
            url.searchParams.append('to', endDate);
            
            const res = await fetch(url.toString());
            if (!res.ok) throw new Error('Error al conectar con el servidor');
            observations = await res.json();
        } catch (e: any) {
            error = e.message;
        } finally {
            loading = false;
        }
    }

    onMount(loadObservations);

    // Reactive fetch when dates change
    $effect(() => {
        if (startDate && endDate) {
            // We call it via a timeout or just once to avoid infinite loops if loadObservations updates something reactive
            // But here it should be fine as it only updates 'observations' and 'loading'
            loadObservations();
        }
    });

    // Filtered list (client-side search)
    let filteredObservations = $derived(
        observations.filter(obs => 
            obs.plant?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            obs.observer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            obs.task?.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    // Actions
    async function deleteObservation(id) {
        if (!confirm('¿Estás seguro de eliminar este reporte de forma permanente?')) return;
        
        try {
            const res = await fetch('/api/observations', {
                method: 'DELETE',
                body: JSON.stringify({ id }),
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (res.ok) {
                observations = observations.filter(obs => obs._id !== id);
                alert('Observación eliminada con éxito');
            }
        } catch (e) {
            alert('Error al eliminar');
        }
    }

    function openEditModal(obs) {
        editingObs = JSON.parse(JSON.stringify(obs)); // Deep clone
        isModalOpen = true;
    }

    function closeModal() {
        isModalOpen = false;
        editingObs = null;
    }

    async function saveChanges() {
        if (!editingObs) return;
        saving = true;
        try {
            const res = await fetch('/api/observations', {
                method: 'PATCH',
                body: JSON.stringify({ id: editingObs._id, ...editingObs }),
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (res.ok) {
                const index = observations.findIndex(o => o._id === editingObs._id);
                if (index !== -1) {
                    observations[index] = { ...editingObs, updatedAt: new Date().toISOString() };
                }
                closeModal();
                alert('Cambios guardados exitosamente');
            } else {
                const err = await res.json();
                throw new Error(err.error || 'Error al guardar');
            }
        } catch (e: any) {
            alert(e.message);
        } finally {
            saving = false;
        }
    }

    function getRiskLevel(responses) {
        if (!responses) return 'safe';
        const hasRisk = Object.values(responses).some((cat: any) => cat.estado === 'riesgoso');
        return hasRisk ? 'risk' : 'safe';
    }

    function toggleResponse(behaviorId, state) {
        if (!editingObs.responses[behaviorId]) {
            editingObs.responses[behaviorId] = { estado: 'no-aplica' };
        }
        editingObs.responses[behaviorId].estado = state;
        if (state !== 'riesgoso') {
            delete editingObs.responses[behaviorId].motivo;
            delete editingObs.responses[behaviorId].clasificacion;
        } else if (!editingObs.responses[behaviorId].clasificacion) {
            editingObs.responses[behaviorId].clasificacion = 'A';
        }
    }
</script>

<div class="table-container">
    <!-- Filter Bar -->
    <div class="controls-wrapper">
        <div class="filter-header flex justify-between items-center">
            <h3>Panel de Filtros - Gestión SST</h3>
            <button class="refresh-btn-large flex items-center gap-sm" onclick={loadObservations} disabled={loading}>
                <RefreshCw size={18} class={loading ? 'spin' : ''} />
                <span>Actualizar Datos</span>
            </button>
        </div>
        
        <div class="filters-grid">
            <div class="filter-field">
                <label><Calendar size={14} /> Fecha Inicio</label>
                <input type="date" bind:value={startDate} />
            </div>
            <div class="filter-field">
                <label><Calendar size={14} /> Fecha Fin</label>
                <input type="date" bind:value={endDate} />
            </div>
            <div class="filter-field search-box">
                <label><Search size={14} /> Búsqueda Rápida</label>
                <div class="search-input-wrapper">
                    <input 
                        type="text" 
                        placeholder="Planta, observador o tarea..." 
                        bind:value={searchTerm}
                    />
                </div>
            </div>
        </div>
    </div>

    {#if loading && observations.length === 0}
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Consultando base de datos industrial...</p>
        </div>
    {:else if error}
        <div class="error-state">
            <AlertCircle size={48} color="#ef4444" />
            <p>{error}</p>
            <button class="btn btn-primary mt-md" onclick={loadObservations}>Reintentar consulta</button>
        </div>
    {:else if observations.length === 0}
        <div class="empty-state text-center">
            <Info size={48} class="mx-auto mb-md opacity-20" />
            <p>No se encontraron registros para el <b>{dayjs(startDate).format('DD/MM/YYYY')}</b>.</p>
            <p class="text-xs mt-sm">Intenta ampliar el rango de fechas para ver más información.</p>
        </div>
    {:else}
        <!-- Desktop Table View -->
        <div class="desktop-view">
            <table>
                <thead>
                    <tr>
                        <th>Fecha y Hora</th>
                        <th>Planta / Bodega</th>
                        <th>Personal Observador</th>
                        <th>Tarea Crítica</th>
                        <th>Nivel de Riesgo</th>
                        <th class="text-right">Gestión</th>
                    </tr>
                </thead>
                <tbody>
                    {#each filteredObservations as obs}
                        <tr class="hover-row">
                            <td>
                                <div class="date-cell">
                                    <span class="main-date">{dayjs(obs.timestamp).format('DD/MM/YYYY')}</span>
                                    <span class="sub-date">{dayjs(obs.timestamp).format('HH:mm:ss')}</span>
                                </div>
                            </td>
                            <td class="font-semibold">{obs.plant}</td>
                            <td>{obs.observer}</td>
                            <td class="task-cell" title={obs.task}>{obs.task}</td>
                            <td>
                                <span class="badge {getRiskLevel(obs.responses)}">
                                    {getRiskLevel(obs.responses) === 'risk' ? '⚠️ Riesgo' : '✅ Seguro'}
                                </span>
                            </td>
                            <td class="actions text-right">
                                <button class="btn-action edit" onclick={() => openEditModal(obs)} title="Editar reporte completo">
                                    <Edit3 size={16}/>
                                </button>
                                <button class="btn-action delete" onclick={() => deleteObservation(obs._id)} title="Eliminar registro">
                                    <Trash2 size={16}/>
                                </button>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>

        <!-- Mobile Card View -->
        <div class="mobile-view">
            {#each filteredObservations as obs}
                <div class="mobile-card {getRiskLevel(obs.responses)} shadow-sm">
                    <div class="card-top flex justify-between">
                        <span class="tag">{dayjs(obs.timestamp).format('DD MMM, HH:mm')}</span>
                        <span class="status-pill {getRiskLevel(obs.responses)}">
                            {getRiskLevel(obs.responses) === 'risk' ? 'Riesgo' : 'Seguro'}
                        </span>
                    </div>
                    <div class="card-mid">
                        <h4 class="m-0">{obs.plant}</h4>
                        <div class="details-list mt-sm">
                            <div class="detail-item"><strong>Observador:</strong> {obs.observer}</div>
                            <div class="detail-item"><strong>Tarea:</strong> {obs.task}</div>
                        </div>
                    </div>
                    <div class="card-bottom flex gap-sm mt-md">
                        <button class="btn-card flex-1 edit" onclick={() => openEditModal(obs)}>
                            <Edit3 size={14}/> Editar
                        </button>
                        <button class="btn-card flex-1 delete" onclick={() => deleteObservation(obs._id)}>
                            <Trash2 size={14}/> Borrar
                        </button>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>

<!-- Expanded Edit Modal -->
{#if isModalOpen && editingObs}
    <div class="modal-root">
        <div class="modal-overlay" onclick={closeModal}></div>
        <div class="modal-container shadow-2xl">
            <div class="modal-header">
                <div class="header-left">
                    <div class="icon-box"><Edit3 size={20}/></div>
                    <div>
                        <h2>Editor de Observación</h2>
                        <p class="meta">ID Seguimiento: {editingObs._id}</p>
                    </div>
                </div>
                <button class="btn-close" onclick={closeModal}><X size={20}/></button>
            </div>

            <div class="modal-content-scroller">
                <!-- 1. Basic Information -->
                <div class="edit-group">
                    <h3 class="group-title">Información del Evento</h3>
                    <div class="grid-layout">
                        <div class="input-field">
                            <label>Planta / Instalación</label>
                            <input type="text" bind:value={editingObs.plant} />
                        </div>
                        <div class="input-field">
                            <label>Fecha del Reporte</label>
                            <input type="date" bind:value={editingObs.fecha} />
                        </div>
                        <div class="input-field">
                            <label>Nombre del Observador</label>
                            <input type="text" bind:value={editingObs.observer} />
                        </div>
                        <div class="input-field">
                            <label>Actividad Realizada</label>
                            <input type="text" bind:value={editingObs.task} />
                        </div>
                    </div>
                </div>

                <!-- 2. Behavioral Grid -->
                <div class="edit-group">
                    <h3 class="group-title">Evaluación de Comportamientos</h3>
                    <div class="behavior-editor-grid">
                        {#each ATRIBUTOS_COMPORTAMIENTO as behavior}
                            {@const resp = editingObs.responses[behavior.id] || { estado: 'no-aplica' }}
                            <div class="behavior-card" class:has-risk={resp.estado === 'riesgoso'}>
                                <div class="behavior-header flex justify-between items-start">
                                    <div class="bh-info">
                                        <span class="bh-id">#{behavior.id}</span>
                                        <h5>{behavior.title}</h5>
                                    </div>
                                    <div class="bh-toggles">
                                        <button class="tgl secure" class:active={resp.estado === 'seguro'} onclick={() => toggleResponse(behavior.id, 'seguro')}>S</button>
                                        <button class="tgl risky" class:active={resp.estado === 'riesgoso'} onclick={() => toggleResponse(behavior.id, 'riesgoso')}>R</button>
                                        <button class="tgl na" class:active={resp.estado === 'no-aplica'} onclick={() => toggleResponse(behavior.id, 'no-aplica')}>N/A</button>
                                    </div>
                                </div>
                                
                                {#if resp.estado === 'riesgoso'}
                                    <div class="risk-expansion">
                                        <label>Motivo de Desviación:</label>
                                        <textarea bind:value={editingObs.responses[behavior.id].motivo} placeholder="¿Qué se observó específicamente?"></textarea>
                                        
                                        <div class="control-class">
                                            <label>Grado de Control (Tipo):</label>
                                            <div class="class-selector flex gap-xs">
                                                {#each ['A', 'B', 'C'] as cls}
                                                    <button 
                                                        class="cls-btn" 
                                                        class:active={resp.clasificacion === cls}
                                                        onclick={() => editingObs.responses[behavior.id].clasificacion = cls}
                                                    >{cls}</button>
                                                {/each}
                                            </div>
                                        </div>
                                    </div>
                                {/if}
                            </div>
                        {/each}
                    </div>
                </div>

                <!-- 3. Observations & Follow-up -->
                <div class="edit-group">
                    <h3 class="group-title">Observaciones Finales</h3>
                    <div class="text-fields-grid">
                        <div class="input-field full">
                            <label>Barreras Sistémicas Detectadas (Fuera de Control)</label>
                            <textarea bind:value={editingObs.barrerasC} rows="3" placeholder="Indique si hay factores externos que impiden el trabajo seguro..."></textarea>
                        </div>
                        <div class="input-field full">
                            <label>Seguimiento / Acciones de Retroalimentación</label>
                            <textarea bind:value={editingObs.seguimiento} rows="3" placeholder="¿Qué se hizo en el momento para corregir?"></textarea>
                        </div>
                    </div>
                </div>
            </div>

            <div class="modal-actions">
                <button class="btn btn-ghost" onclick={closeModal} disabled={saving}>Descartar</button>
                <button class="btn btn-primary" onclick={saveChanges} disabled={saving}>
                    {#if saving}
                        <RefreshCw size={16} class="spin" /> Guardando...
                    {:else}
                        <Save size={16}/> Confirmar Edición
                    {/if}
                </button>
            </div>
        </div>
    </div>
{/if}

<style>
    :root {
        --sst-accent: #ff7a00;
        --sst-danger: #ef4444;
        --sst-safe: #22c55e;
        --sst-text: #1e293b;
        --sst-text-light: #64748b;
        --sst-bg: #f8fafc;
        --sst-border: #e2e8f0;
    }

    .table-container {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    /* Filters Section */
    .controls-wrapper {
        background: white;
        padding: 1.75rem;
        border-radius: 16px;
        box-shadow: 0 4px 20px -5px rgba(0,0,0,0.05);
        border: 1px solid var(--sst-border);
    }

    .filter-header h3 {
        margin: 0;
        font-size: 0.9rem;
        color: var(--sst-text-light);
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 1px;
    }

    .filters-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 1.25rem;
        margin-top: 1.5rem;
    }

    .filter-field label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.7rem;
        font-weight: 800;
        color: var(--sst-text-light);
        margin-bottom: 0.5rem;
        text-transform: uppercase;
    }

    .filter-field input {
        width: 100%;
        padding: 0.75rem 1rem;
        border: 1.5px solid var(--sst-border);
        border-radius: 10px;
        font-size: 0.9rem;
        transition: border-color 0.2s, box-shadow 0.2s;
        font-family: inherit;
    }
    
    .filter-field input:focus {
        border-color: var(--sst-accent);
        outline: none;
        box-shadow: 0 0 0 3px rgba(255, 122, 0, 0.1);
    }

    .search-input-wrapper { position: relative; }

    /* Table Styles */
    .desktop-view {
        background: white;
        border-radius: 16px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.02);
        border: 1px solid var(--sst-border);
        overflow: hidden;
    }

    table { width: 100%; border-collapse: collapse; }
    
    th {
        background: #f1f5f9;
        padding: 1.25rem 1rem;
        text-align: left;
        font-size: 0.7rem;
        font-weight: 800;
        color: var(--sst-text-light);
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    td {
        padding: 1.25rem 1rem;
        border-bottom: 1px solid #f1f5f9;
        vertical-align: middle;
    }

    .hover-row:hover { background-color: #fcfcfc; }

    .date-cell .main-date { display: block; font-weight: 700; color: var(--sst-text); }
    .date-cell .sub-date { font-size: 0.75rem; color: var(--sst-text-light); }
    
    .task-cell {
        max-width: 220px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: 0.85rem;
        color: var(--sst-text-light);
    }

    .badge {
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 800;
        display: inline-flex;
        align-items: center;
        gap: 4px;
    }
    .badge.risk { background: #fee2e2; color: var(--sst-danger); }
    .badge.safe { background: #dcfce7; color: var(--sst-safe); }

    .btn-action {
        width: 34px; height: 34px;
        border-radius: 8px;
        border: none;
        cursor: pointer;
        transition: all 0.2s;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin-left: 4px;
    }
    .btn-action.edit { background: #eff6ff; color: #3b82f6; }
    .btn-action.delete { background: #fff1f2; color: var(--sst-danger); }
    .btn-action:hover { transform: translateY(-2px); }

    /* Modal v2 Styles */
    .modal-root {
        position: fixed;
        top: 0; left: 0;
        width: 100vw; height: 100vh;
        z-index: 5000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1.5rem;
    }

    .modal-overlay {
        position: absolute;
        top:0; left:0; width: 100%; height: 100%;
        background: rgba(15, 23, 42, 0.7);
        backdrop-filter: blur(8px);
    }

    .modal-container {
        position: relative;
        background: white;
        width: 100%;
        max-width: 960px;
        max-height: 90vh;
        border-radius: 24px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        animation: modalIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes modalIn {
        from { opacity: 0; transform: scale(0.95) translateY(10px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
    }

    .modal-header {
        padding: 1.5rem 2rem;
        background: white;
        border-bottom: 1px solid var(--sst-border);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .header-left { display: flex; align-items: center; gap: 1.25rem; }
    .icon-box { background: var(--sst-accent); color: white; padding: 10px; border-radius: 12px; }
    .modal-header h2 { margin: 0; font-size: 1.4rem; font-weight: 900; }
    .modal-header .meta { margin: 0; font-size: 0.75rem; color: var(--sst-text-light); }

    .modal-content-scroller {
        padding: 2rem;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 2.5rem;
        background: #fafafa;
    }

    .group-title {
        font-size: 0.85rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: var(--sst-accent);
        margin-bottom: 1.5rem;
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
    .group-title::after { content: ''; flex: 1; height: 1px; background: var(--sst-border); }

    .grid-layout {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1.25rem;
    }

    .input-field label {
        display: block;
        font-size: 0.75rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
        color: var(--sst-text-light);
    }

    .input-field input, .input-field textarea {
        width: 100%;
        padding: 0.85rem 1rem;
        border: 1px solid var(--sst-border);
        border-radius: 12px;
        background: white;
        font-family: inherit;
        font-size: 0.95rem;
    }

    .behavior-editor-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1rem;
    }

    .behavior-card {
        background: white;
        border: 1px solid var(--sst-border);
        border-radius: 16px;
        padding: 1.25rem;
        transition: all 0.3s;
    }
    .behavior-card.has-risk { border-color: #fee2e2; background: #fffcfc; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.05); }

    .bh-id { font-size: 0.75rem; font-weight: 900; color: var(--sst-text-light); }
    .bh-info h5 { margin: 0; font-size: 1rem; line-height: 1.2; }

    .bh-toggles { display: flex; gap: 4px; background: #f1f5f9; padding: 4px; border-radius: 8px; }
    .tgl {
        width: 32px; height: 32px; border-radius: 6px; border: none; font-size: 0.75rem; font-weight: 800; cursor: pointer; transition: all 0.2s;
    }
    .tgl.secure.active { background: var(--sst-safe); color: white; }
    .tgl.risky.active { background: var(--sst-danger); color: white; }
    .tgl.na.active { background: var(--sst-text-light); color: white; }

    .risk-expansion { margin-top: 1.25rem; border-top: 1px dashed var(--sst-border); pt: 1rem; }
    .risk-expansion textarea { height: 80px; margin-top: 0.5rem; font-size: 0.85rem; }
    
    .cls-btn {
        flex: 1; padding: 6px; font-size: 0.75rem; font-weight: 800; background: white; border: 1px solid var(--sst-border); border-radius: 6px; cursor: pointer;
    }
    .cls-btn.active { background: var(--sst-text); color: white; border-color: var(--sst-text); }

    .modal-actions {
        padding: 1.5rem 2rem;
        background: white;
        border-top: 1px solid var(--sst-border);
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
    }

    .btn {
        padding: 0.85rem 1.75rem;
        border-radius: 12px;
        font-weight: 700;
        cursor: pointer;
        font-family: inherit;
        display: inline-flex;
        align-items: center;
        gap: 0.75rem;
        font-size: 0.95rem;
        transition: all 0.2s;
        border: 2px solid transparent;
    }
    .btn-primary { background: var(--sst-accent); color: white; }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 4px 15px rgba(255, 122, 0, 0.3); }
    .btn-ghost { background: transparent; border-color: var(--sst-border); color: var(--sst-text-light); }
    .btn-ghost:hover { background: #f8fafc; color: var(--sst-text); }

    /* Mobile View Extras */
    .mobile-card {
        background: white;
        margin-bottom: 1.25rem;
        border-radius: 18px;
        padding: 1.25rem;
        border-left: 6px solid var(--sst-border);
    }
    .mobile-card.risk { border-left-color: var(--sst-danger); }
    .mobile-card.safe { border-left-color: var(--sst-safe); }

    .tag { font-size: 0.7rem; font-weight: 800; color: var(--sst-text-light); background: #f1f5f9; padding: 2px 8px; border-radius: 6px; }
    .status-pill { font-size: 0.7rem; font-weight: 900; padding: 2px 10px; border-radius: 20px; }
    .status-pill.risk { background: #fee2e2; color: var(--sst-danger); }
    .status-pill.safe { background: #dcfce7; color: var(--sst-safe); }

    .btn-card {
        padding: 0.75rem; border-radius: 10px; border: none; font-size: 0.8rem; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 0.5rem; cursor: pointer;
    }
    .btn-card.edit { background: #f1f5f9; color: var(--sst-text); }
    .btn-card.delete { background: #fff1f2; color: var(--sst-danger); }

    .spin { animation: rotate 1.5s linear infinite; }
    @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

    .placeholder { padding: 4rem; text-align: center; color: var(--sst-text-light); }

    .spinner {
        width: 40px; height: 40px; border: 4px solid #f1f5f9; border-top-color: var(--sst-accent); border-radius: 50%; animation: rotate 1s linear infinite; margin: 0 auto 1.5rem;
    }
</style>
