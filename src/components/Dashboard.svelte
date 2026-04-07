<script lang="ts">
    import { onMount } from 'svelte';
    import { Chart, registerables } from 'chart.js';
    import dayjs from 'dayjs';
    import { ATRIBUTOS_COMPORTAMIENTO } from '../constants/behaviors';
    import { BarChart3, Filter, Download, Users, Factory, ClipboardList, Activity, AlertTriangle, CheckCircle, TrendingUp, Info } from 'lucide-svelte';
    import { exportToCSV } from '../lib/storage';

    Chart.register(...registerables);

    let observations = [];
    let filteredObservations = [];
    let loading = true;

    // Filters
    let filterPlant = '';
    let filterObserver = '';
    let filterTask = '';
    let filterStartDate = dayjs().subtract(1, 'month').format('YYYY-MM-DD');
    let filterEndDate = dayjs().format('YYYY-MM-DD');

    let plants = [];
    let observers = [];
    let tasks = [];

    // Insights State
    let stats = {
        total: 0,
        riskyObs: 0,
        riskyPercent: 0,
        underControl: 0,
        outOfControl: 0,
        controlPercent: 0,
        topRiskyTasks: [],
        topRiskyPlants: [],
        commonReasons: []
    };

    let componentStats = [];

    // Charts
    let timeChart, componentChart, controlChart, plantChart;
    let timeCanvas, componentCanvas, controlCanvas, plantCanvas;

    let expandedComponentId = null;

    onMount(async () => {
        await fetchData();
    });

    async function fetchData() {
        loading = true;
        try {
            const res = await fetch('/api/observations');
            observations = await res.json();
            
            plants = [...new Set(observations.map(o => o.planta))].sort();
            observers = [...new Set(observations.map(o => o.observador))].sort();
            tasks = [...new Set(observations.map(o => o.tarea))].sort();

            applyFilters();
        } catch (e) {
            console.error(e);
        } finally {
            loading = false;
        }
    }

    function applyFilters() {
        filteredObservations = observations.filter(obs => {
            const matchPlant = !filterPlant || obs.planta === filterPlant;
            const matchObserver = !filterObserver || obs.observador === filterObserver;
            const matchTask = !filterTask || obs.tarea === filterTask;
            const matchDate = (!filterStartDate || obs.fecha >= filterStartDate) && 
                              (!filterEndDate || obs.fecha <= filterEndDate);
            return matchPlant && matchObserver && matchTask && matchDate;
        });

        calculateInsights();
        setTimeout(updateCharts, 50);
    }

    function calculateInsights() {
        const total = filteredObservations.length;
        let riskyObsCount = 0;
        let underControlCount = 0;
        let outOfControlCount = 0;
        
        const taskRisk = {};
        const plantRisk = {};
        const reasons = [];

        const compStatsMap = ATRIBUTOS_COMPORTAMIENTO.map(attr => ({
            id: attr.id,
            title: attr.title,
            obs: 0,
            risky: 0,
            safe: 0,
            underControl: 0,
            outOfControl: 0
        }));

        filteredObservations.forEach(obs => {
            let isObsRisky = false;
            let isObsOutOfControl = false;

            Object.entries(obs.respuestas || {}).forEach(([id, r]: [string, any]) => {
                const comp = compStatsMap.find(c => c.id === parseInt(id));
                if (!comp || r.estado === 'no-aplica') return;

                comp.obs++;
                if (r.estado === 'seguro') {
                    comp.safe++;
                } else if (r.estado === 'riesgoso') {
                    comp.risky++;
                    isObsRisky = true;
                    if (r.motivo) reasons.push(r.motivo.toLowerCase());
                    
                    if (r.clasificacion === 'C') {
                        comp.outOfControl++;
                        isObsOutOfControl = true;
                    } else {
                        comp.underControl++;
                    }
                }
            });

            if (isObsRisky) {
                riskyObsCount++;
                taskRisk[obs.tarea] = (taskRisk[obs.tarea] || 0) + 1;
                plantRisk[obs.planta] = (plantRisk[obs.planta] || 0) + 1;
            }

            if (isObsOutOfControl) {
                outOfControlCount++;
            } else if (isObsRisky) {
                underControlCount++;
            }
        });

        stats = {
            total,
            riskyObs: riskyObsCount,
            riskyPercent: total > 0 ? (riskyObsCount / total * 100).toFixed(1) : 0,
            underControl: underControlCount,
            outOfControl: outOfControlCount,
            controlPercent: riskyObsCount > 0 ? (underControlCount / riskyObsCount * 100).toFixed(1) : 100,
            topRiskyTasks: Object.entries(taskRisk).sort((a,b) => b[1] - a[1]).slice(0, 5),
            topRiskyPlants: Object.entries(plantRisk).sort((a,b) => b[1] - a[1]).slice(0, 5),
            commonReasons: extractCommonKeywords(reasons)
        };

        componentStats = compStatsMap.filter(c => c.obs > 0).sort((a,b) => b.risky - a.risky);
    }

    function getComponentComments(compId) {
        const comments = [];
        filteredObservations.forEach(obs => {
            const resp = (obs.respuestas || {})[compId];
            if (resp?.estado === 'riesgoso' && resp?.motivo) {
                comments.push({
                    text: resp.motivo,
                    date: obs.fecha,
                    plant: obs.planta,
                    task: obs.tarea
                });
            }
        });
        return comments.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5); // Ultimos 5
    }

    function toggleExpand(id) {
        expandedComponentId = expandedComponentId === id ? null : id;
    }

    function extractCommonKeywords(textArray) {
        const words = textArray.join(' ').split(/[\s,.\(\)]+/).filter(w => w.length > 5);
        const freq = {};
        const stopWords = [
            'porque', 'cuando', 'sobre', 'donde', 'desde', 'hasta', 'mismo', 'estado', 'debido',
            'durante', 'frente', 'entre', 'hacia', 'estos', 'estas', 'alguno', 'alguna', 'siempre',
            'aunque', 'siendo', 'dentro', 'después', 'antes', 'podría', 'pueden', 'tiene'
        ];
        words.forEach(w => {
            if (!stopWords.includes(w)) {
                freq[w] = (freq[w] || 0) + 1;
            }
        });
        return Object.entries(freq).sort((a,b) => b[1] - a[1]).slice(0, 10);
    }

    function updateCharts() {
        if (!timeCanvas) return;

        [timeChart, componentChart, controlChart, plantChart].forEach(c => c?.destroy());

        const obsByDate = {};
        const riskyByDate = {};
        filteredObservations.forEach(obs => {
            obsByDate[obs.fecha] = (obsByDate[obs.fecha] || 0) + 1;
            const isRisky = Object.values(obs.respuestas || {}).some((r: any) => r.estado === 'riesgoso');
            if (isRisky) riskyByDate[obs.fecha] = (riskyByDate[obs.fecha] || 0) + 1;
        });
        const labels = Object.keys(obsByDate).sort();

        timeChart = new Chart(timeCanvas, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    { label: 'Total', data: labels.map(l => obsByDate[l] || 0), borderColor: '#1e293b', backgroundColor: 'rgba(30, 41, 59, 0.05)', fill: true, tension: 0.3 },
                    { label: 'Riesgosos', data: labels.map(l => riskyByDate[l] || 0), borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.05)', fill: true, tension: 0.3 }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });

        controlChart = new Chart(controlCanvas, {
            type: 'doughnut',
            data: {
                labels: ['Bajo Control', 'Fuera de Control (C)'],
                datasets: [{
                    data: [stats.underControl, stats.outOfControl],
                    backgroundColor: ['#3b82f6', '#f59e0b'],
                    borderWidth: 0
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { position: 'bottom' } } }
        });

        componentChart = new Chart(componentCanvas, {
            type: 'bar',
            data: {
                labels: componentStats.slice(0, 10).map(c => c.title),
                datasets: [
                    { label: '% Riesgo', data: componentStats.slice(0, 10).map(c => (c.risky / c.obs * 100).toFixed(1)), backgroundColor: '#ef4444', borderRadius: 6 }
                ]
            },
            options: { 
                indexAxis: 'y',
                responsive: true, 
                maintainAspectRatio: false,
                scales: { x: { max: 100, grid: { display: false } } },
                plugins: { legend: { display: false } }
            }
        });

        plantChart = new Chart(plantCanvas, {
            type: 'bar',
            data: {
                labels: plants,
                datasets: [{
                    label: 'Registros Riesgosos',
                    data: plants.map(p => filteredObservations.filter(o => o.planta === p && Object.values(o.respuestas || {}).some((r: any) => r.estado === 'riesgoso')).length),
                    backgroundColor: '#ff7a00',
                    borderRadius: 6
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });
    }

    function getRiskColor(percent) {
        // 0% -> 240 (Blue), 100% -> 0 (Red)
        const hue = (1 - percent / 100) * 240;
        return `hsl(${hue}, 80%, 45%)`;
    }

    function handleExport() {
        exportToCSV(filteredObservations);
    }
</script>

<div class="dashboard-container">
    {#if loading}
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Generando Modelo de Riesgo...</p>
        </div>
    {:else}
        <!-- Panel de Filtros -->
        <section class="filters card">
            <div class="section-header">
                <Filter size={18} />
                <h3>Dimensiones de Análisis</h3>
            </div>
            <div class="filter-grid">
                <div class="field">
                    <label>Rango de Tiempo</label>
                    <div class="flex gap-sm">
                        <input type="date" bind:value={filterStartDate} on:change={applyFilters} />
                        <input type="date" bind:value={filterEndDate} on:change={applyFilters} />
                    </div>
                </div>
                <div class="field">
                    <label>Planta</label>
                    <select bind:value={filterPlant} on:change={applyFilters}>
                        <option value="">Todas las plantas</option>
                        {#each plants as plant}<option value={plant}>{plant}</option>{/each}
                    </select>
                </div>
                <div class="field">
                    <label>Tarea Crítica</label>
                    <select bind:value={filterTask} on:change={applyFilters}>
                        <option value="">Todas las tareas</option>
                        {#each tasks as task}<option value={task}>{task}</option>{/each}
                    </select>
                </div>
                <div class="field">
                    <label>Observador</label>
                    <select bind:value={filterObserver} on:change={applyFilters}>
                        <option value="">Todos los registrados</option>
                        {#each observers as obs}<option value={obs}>{obs}</option>{/each}
                    </select>
                </div>
            </div>
        </section>

        <!-- KPIs Estratégicos -->
        <div class="kpi-grid">
            <div class="kpi-card border-left-blue" data-tooltip="Total de observaciones registradas bajo los filtros actuales.">
                <div class="kpi-icon"><ClipboardList /></div>
                <div class="kpi-content">
                    <span class="value">{stats.total}</span>
                    <span class="label">Volumen Total</span>
                </div>
            </div>
            <div class="kpi-card border-left-red" data-tooltip="Porcentaje de observaciones que contienen al menos un comportamiento riesgoso.">
                <div class="kpi-icon danger"><AlertTriangle /></div>
                <div class="kpi-content">
                    <span class="value">{stats.riskyObs} <small>{stats.riskyPercent}%</small></span>
                    <span class="label">Puntos de Riesgo</span>
                </div>
            </div>
            <div class="kpi-card border-left-green" data-tooltip="Capacidad de mitigar el riesgo en el sitio vs. dejarlo fuera de control.">
                <div class="kpi-icon success"><CheckCircle /></div>
                <div class="kpi-content">
                    <span class="value">{stats.controlPercent}%</span>
                    <span class="label">Eficiencia de Control</span>
                </div>
            </div>
            <div class="kpi-card border-left-orange" data-tooltip="Situaciones donde el trabajador no tiene el control para actuar de forma segura (Diseño, Herramientas, Métodos).">
                <div class="kpi-icon barrier"><TrendingUp /></div>
                <div class="kpi-content">
                    <span class="value">{stats.outOfControl}</span>
                    <span class="label">Incapacidad de Control (C)</span>
                </div>
            </div>
        </div>

        <!-- Grilla de Análisis Principal -->
        <div class="dashboard-layout">
            <div class="main-stats">
                <div class="chart-card card" data-tooltip="Representa el volumen histórico de reportes, comparando la actividad preventiva general contra la detección de desviaciones críticas.">
                    <div class="chart-header">
                        <h3>Tendencia Dinámica de Seguridad <Info size={14} style="display:inline; opacity:0.5;" /></h3>
                        <p>Evolución de observaciones seguras vs riesgosas</p>
                    </div>
                    <div class="chart-box main-chart">
                        <canvas bind:this={timeCanvas}></canvas>
                    </div>
                </div>

                <div class="stats-row">
                    <div class="chart-card card" data-tooltip="Análisis de la gestión inmediata: ¿Qué porcentaje de riesgos se resolvieron en el acto vs. los que requieren intervención de la empresa?">
                        <div class="chart-header">
                            <h3>Gestión del Riesgo <Info size={14} style="display:inline; opacity:0.5;" /></h3>
                            <p>Mitigación vs Barreras</p>
                        </div>
                        <div class="chart-box donut-box">
                            <canvas bind:this={controlCanvas}></canvas>
                        </div>
                    </div>
                    <div class="chart-card card" data-tooltip="Comparativa entre sedes o unidades operativas para identificar focos de atención geográfica.">
                        <div class="chart-header">
                            <h3>Riesgo por Unidad <Info size={14} style="display:inline; opacity:0.5;" /></h3>
                            <p>Distribución por planta</p>
                        </div>
                        <div class="chart-box">
                            <canvas bind:this={plantCanvas}></canvas>
                        </div>
                    </div>
                </div>

                <div class="chart-card card" data-tooltip="Priorización de recursos: Identifica específicamente qué categorías de comportamiento presentan mayor vulnerabilidad estadística.">
                    <div class="chart-header">
                        <h3>Vulnerabilidad por Componente <Info size={14} style="display:inline; opacity:0.5;" /></h3>
                        <p>% de Actos Riesgosos por categoría</p>
                    </div>
                    <div class="chart-box bar-scroll">
                        <canvas bind:this={componentCanvas}></canvas>
                    </div>
                </div>
            </div>

            <!-- Panel de Inteligencia de Texto e Insights -->
            <div class="side-insights">
                <div class="insight-block card" data-tooltip="Algoritmo de procesamiento de lenguaje natural que identifica las palabras más repetidas en los reportes de riesgo para detectar fallas comunes.">
                    <div class="title-row">
                        <Info size={18} />
                        <h3>Causas Raíz Detectadas</h3>
                    </div>
                    <div class="word-cloud">
                        {#each stats.commonReasons as [word, count]}
                            <span class="keyword" style="font-size: {Math.min(1.2, 0.7 + count/10)}rem">
                                {word} <span class="badge">{count}</span>
                            </span>
                        {/each}
                    </div>
                </div>

                <div class="insight-block card">
                    <div class="title-row">
                        <Activity size={18} />
                        <h3>Tareas Críticas (Top Riesgo)</h3>
                    </div>
                    <div class="ranking">
                        {#each stats.topRiskyTasks as [task, count]}
                            <div class="ranking-row">
                                <span class="name">{task}</span>
                                <span class="count">{count}</span>
                            </div>
                        {/each}
                    </div>
                </div>

                <div class="insight-block card component-analysis">
                    <h3>Análisis Detallado de Componentes</h3>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Comp.</th>
                                    <th>% Riesgo</th>
                                    <th>Ctrl</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each componentStats as comp}
                                    <tr class="clickable" on:click={() => toggleExpand(comp.id)}>
                                        <td>{comp.title}</td>
                                        <td class="risk-val" style="color: {getRiskColor(comp.risky/comp.obs*100)}">
                                            <b>{(comp.risky/comp.obs*100).toFixed(0)}%</b>
                                        </td>
                                        <td>
                                            {#if comp.outOfControl > 0} ❌ {:else} ✅ {/if}
                                        </td>
                                    </tr>
                                    {#if expandedComponentId === comp.id}
                                        <tr class="expanded-row">
                                            <td colspan="3">
                                                <div class="comments-list">
                                                    <strong>Hallazgos recientes:</strong>
                                                    {#each getComponentComments(comp.id) as comment}
                                                        <div class="comment-item">
                                                            <p>"{comment.text}"</p>
                                                            <small>{comment.date} - {comment.planta} ({comment.task})</small>
                                                        </div>
                                                    {:else}
                                                        <p class="no-data">No hay comentarios registrados.</p>
                                                    {/each}
                                                </div>
                                            </td>
                                        </tr>
                                    {/if}
                                {/each}
                            </tbody>
                        </table>
                    </div>
                </div>

                <button class="export-btn" on:click={handleExport}>
                    <Download size={18} /> Exportar Reporte CSV
                </button>
            </div>
        </div>
    {/if}
</div>

<style>
    .dashboard-container {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        padding-bottom: 3rem;
    }

    .loading-state {
        height: 60vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        color: var(--color-secondary);
    }

    .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid var(--color-cta);
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

    .filters { padding: 1.5rem; overflow: visible; }
    .section-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem; color: var(--color-primary); }
    .section-header h3 { font-size: 1rem; margin: 0; }
    .filter-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr)); gap: 1.5rem; }
    .filter-grid .field { display: flex; flex-direction: column; gap: 0.5rem; min-width: 0; }
    .filter-grid .field .flex { flex-wrap: wrap; }
    .filter-grid .field input, .filter-grid .field select { width: 100%; min-width: 0; }
    
    /* Tooltips */
    [data-tooltip] {
        position: relative;
        cursor: help;
    }
    [data-tooltip]::after {
        content: attr(data-tooltip);
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%) translateY(-8px);
        background: #1e293b;
        color: white;
        padding: 0.6rem 0.8rem;
        border-radius: 0.5rem;
        font-size: 0.75rem;
        font-weight: 500;
        width: 200px;
        text-align: center;
        opacity: 0;
        visibility: hidden;
        transition: all 0.2s ease;
        box-shadow: var(--shadow-md);
        z-index: 100;
        pointer-events: none;
    }
    [data-tooltip]:hover::after {
        opacity: 1;
        visibility: visible;
        transform: translateX(-50%) translateY(-12px);
    }

    /* KPIs */
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem; }
    .kpi-card { 
        background: white; 
        padding: 1.25rem; 
        border-radius: 1rem; 
        display: flex; 
        align-items: center; 
        gap: 1rem; 
        box-shadow: var(--shadow-sm);
        border: 1px solid var(--color-border);
    }
    .kpi-card.border-left-blue { border-left: 5px solid #3b82f6; }
    .kpi-card.border-left-red { border-left: 5px solid #ef4444; }
    .kpi-card.border-left-green { border-left: 5px solid #22c55e; }
    .kpi-card.border-left-orange { border-left: 5px solid #ff7a00; }
    
    .kpi-icon { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; color: #64748b; }
    .kpi-icon.danger { color: #ef4444; }
    .kpi-icon.success { color: #22c55e; }
    .kpi-icon.barrier { color: #ff7a00; }
    
    .kpi-content .value { display: block; font-size: 1.5rem; font-weight: 800; color: var(--color-primary); line-height: 1; }
    .kpi-content .value small { font-size: 0.8rem; font-weight: 600; color: var(--color-secondary); }
    .kpi-content .label { font-size: 0.7rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }

    /* Layout */
    .dashboard-layout { display: grid; grid-template-columns: 1fr 320px; gap: 1.5rem; }
    .main-stats { display: flex; flex-direction: column; gap: 1.5rem; }
    .stats-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }

    .chart-card { padding: 1.5rem; }
    .chart-header { margin-bottom: 1.5rem; }
    .chart-header h3 { font-size: 1rem; margin: 0; color: var(--color-primary); }
    .chart-header p { font-size: 0.8rem; color: var(--color-secondary); margin: 0.25rem 0 0; }
    .chart-box { height: 260px; width: 100%; position: relative; }
    .main-chart { height: 320px; }

    /* Side Panel */
    .side-insights { display: flex; flex-direction: column; gap: 1.5rem; }
    .insight-block { padding: 1.5rem; }
    .title-row { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; color: var(--color-primary); }
    .title-row h3 { font-size: 0.95rem; margin: 0; }

    .word-cloud { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .keyword { background: #f1f5f9; padding: 0.35rem 0.6rem; border-radius: 20px; font-weight: 600; color: #475569; display: flex; align-items: center; gap: 0.4rem; }
    .keyword .badge { background: #cbd5e1; font-size: 0.7rem; padding: 1px 6px; border-radius: 10px; }

    .ranking { display: flex; flex-direction: column; gap: 0.75rem; }
    .ranking-row { display: flex; justify-content: space-between; align-items: center; padding-bottom: 0.5rem; border-bottom: 1px solid #f1f5f9; }
    .ranking-row .name { font-size: 0.85rem; font-weight: 600; color: #475569; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 200px; }
    .ranking-row .count { background: #fee2e2; color: #ef4444; font-weight: 800; font-size: 0.85rem; padding: 2px 8px; border-radius: 6px; }

    .component-analysis .table-container { max-height: 500px; overflow-y: auto; margin-top: 1rem; }
    table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
    th { text-align: left; padding: 0.5rem; color: #94a3b8; font-weight: 700; text-transform: uppercase; }
    td { padding: 0.8rem 0.5rem; border-bottom: 1px solid #f1f5f9; }
    .clickable { cursor: pointer; transition: background 0.2s; }
    .clickable:hover { background: #f8fafc; }
    .risk-val { font-weight: 800; }

    .expanded-row { background: #f8fafc; }
    .comments-list { padding: 0.5rem; display: flex; flex-direction: column; gap: 0.75rem; border-left: 3px solid var(--color-cta); margin-left: 0.5rem; }
    .comments-list strong { font-size: 0.75rem; color: var(--color-secondary); }
    .comment-item { border-bottom: 1px solid #e2e8f0; padding-bottom: 0.5rem; }
    .comment-item:last-child { border-bottom: none; }
    .comment-item p { margin: 0 0 0.25rem; font-style: italic; color: #334155; }
    .comment-item small { color: #94a3b8; font-size: 0.7rem; }
    .no-data { color: #94a3b8; font-size: 0.75rem; font-style: italic; }

    .export-btn { 
        background: var(--color-cta); 
        color: white; 
        border: none; 
        padding: 1rem; 
        border-radius: 0.75rem; 
        font-weight: 700; 
        cursor: pointer; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        gap: 0.75rem;
        transition: transform 0.2s;
    }
    .export-btn:hover { transform: translateY(-2px); filter: brightness(1.1); }

    @media (max-width: 1024px) {
        .dashboard-layout { grid-template-columns: 1fr; }
        .side-insights { display: grid; grid-template-columns: 1fr 1fr; }
        .export-btn { grid-column: span 2; }
    }

    @media (max-width: 768px) {
        .stats-row { grid-template-columns: 1fr; }
        .side-insights { grid-template-columns: 1fr; }
        .export-btn { grid-column: auto; }
        .kpi-grid { grid-template-columns: 1fr 1fr; }
    }
</style>
