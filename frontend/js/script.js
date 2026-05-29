// frontend/js/script.js — VERSÃO INTEGRADA COM A API

// ── Configuração global (carregada uma vez do backend) ──────
const _cfg = { itensPorPagina: 20 };

// Estados de paginação por página
const _pag = {
    produtos: 1, fornecedores: 1, categorias: 1,
    setores: 1, funcionarios: 1, entradas: 1,
    saidas: 1, historico: 1,
};

// Cache de dados completos (antes da paginação)
const _dados = {};

// Dados filtrados (resultado da busca/filtros)
const _visivel = {};

// Estado dos filtros por página
const _filtros = {
    produtos:     { busca: '', categoria: '', status: '' },
    fornecedores: { busca: '' },
    categorias:   { busca: '' },
    setores:      { busca: '' },
    funcionarios: { busca: '', setor: '' },
    entradas:     { busca: '' },
    saidas:       { busca: '' },
    historico:    { busca: '', tipo: '' },
};

// ── Helpers de filtro ─────────────────────────────────────────

// Filtra por texto em vários campos
function filtrarBusca(dados, busca, campos) {
    if (!busca || !busca.trim()) return dados;
    const q = busca.toLowerCase().trim();
    return dados.filter(item =>
        campos.some(c => String(item[c] ?? '').toLowerCase().includes(q))
    );
}

// Filtra por valor exato de um campo (select)
function filtrarSelect(dados, campo, valor) {
    if (!valor || valor === '' || valor === 'todos') return dados;
    return dados.filter(item =>
        String(item[campo] ?? '').toLowerCase() === valor.toLowerCase()
    );
}

// Aplica todos os filtros de uma seção e atualiza _visivel
function aplicarFiltros(secao, pipeline) {
    let resultado = [...(_dados[secao] || [])];
    pipeline.forEach(fn => { resultado = fn(resultado); });
    _visivel[secao] = resultado;
    _pag[secao] = 1; // Volta para página 1 ao filtrar
}

// ── Item 6: Debounce — evita re-render a cada tecla ─────────
function debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

// Registra eventos em input/select de filtro (com debounce nos inputs de texto)
function wiredFiltro(seletor, handler) {
    const el = document.querySelector(seletor);
    if (!el) return;
    // Texto: debounce de 300ms | Selects: imediato
    const fn = el.tagName === 'SELECT' ? handler : debounce(handler, 300);
    el.addEventListener('input',  fn);
    el.addEventListener('change', fn);
}

// ── Carrega configurações do backend uma vez ─────────────────
async function carregarConfigGlobal() {
    try {
        const cfg = await api.get('/configuracoes');
        _cfg.itensPorPagina      = parseInt(cfg.sistema_itens_pagina)   || 20;
        _cfg.estoqueMinimoPadrao = parseInt(cfg.sistema_estoque_minimo) || 20;
    } catch (e) { /* usa padrão 20 */ }
}

// ════════════════════════════════════════════════════════════
// SISTEMA DE NOTIFICAÇÕES — Polling + Dropdown de alertas
// ════════════════════════════════════════════════════════════

let _notificacaoCountAnterior = -1;
let _alertasCache           = [];
let _pollingInterval        = null;
let _dropdownAberto         = false;

// Gerencia lista local de alertas marcadas como lidas (persistida no localStorage)
function getReadAlertIds() {
    try {
        const raw = localStorage.getItem('cac_alertas_lidas');
        return raw ? JSON.parse(raw) : [];
    } catch (_){ return []; }
}

function marcarAlertaComoLido(id) {
    try {
        const ids = new Set(getReadAlertIds().map(String));
        ids.add(String(id));
        localStorage.setItem('cac_alertas_lidas', JSON.stringify(Array.from(ids)));
    } catch (_) {}

    const readIds = getReadAlertIds();
    const unread = (_alertasCache || [])
        .map(a => String(a.id_produto))
        .filter(id => !readIds.includes(id)).length;
    atualizarBadgeSino(unread);

    if (document.getElementById('notif-dropdown') && _dropdownAberto) {
        criarDropdownNotificacoes();
        abrirDropdown();
    }
    if (document.getElementById('alertas-lista')) carregarAlertas();
}

// Marca todas as alertas atuais como lidas (cliente-local)
function marcarTodosComoLidos() {    try {
        const ids = new Set(getReadAlertIds().map(String));
        (_alertasCache || []).forEach(a => ids.add(String(a.id_produto)));

        localStorage.setItem('cac_alertas_lidas', JSON.stringify(Array.from(ids)));
    } catch (_) {}

    // Atualiza badge e fecha dropdown
    const unread = (_alertasCache || [])
        .map(a => String(a.id_produto))
        .filter(id => !getReadAlertIds().includes(id)).length;
    atualizarBadgeSino(unread);
    if (document.getElementById('notif-dropdown') && _dropdownAberto) {
        criarDropdownNotificacoes();
        fecharDropdown();
    }

    if (document.getElementById('alertas-lista')) carregarAlertas();
}

// ── Cria o dropdown de notificações (injetado uma vez no DOM) ─
function criarDropdownNotificacoes() {
    if (document.getElementById('notif-dropdown')) return;

    const dropdown = document.createElement('div');
    dropdown.id    = 'notif-dropdown';
    Object.assign(dropdown.style, {
        position:     'fixed',
        top:          '70px',
        right:        '16px',
        width:        '360px',
        background:   'white',
        borderRadius: '14px',
        boxShadow:    '0 8px 30px rgba(0,0,0,0.18)',
        zIndex:       '1200',
        border:       '1px solid #e2e8f0',
        display:      'none',
        fontFamily:   'Poppins, sans-serif',
        overflow:     'hidden',
        animation:    'slideDown .2s ease',
    });

    // Adiciona keyframe de animação uma única vez
    if (!document.getElementById('notif-style')) {
        const style = document.createElement('style');
        style.id = 'notif-style';
        style.textContent = `
            @keyframes slideDown {
                from { opacity: 0; transform: translateY(-10px); }
                to   { opacity: 1; transform: translateY(0); }
            }
            .notif-item { display:flex; align-items:flex-start; gap:12px; padding:12px 16px; border-bottom:1px solid #f1f5f9; cursor:default; transition:background .15s; }
            .notif-item:hover { background:#f8fafc; }
            .notif-item:last-child { border-bottom: none; }
            .notif-icone { width:36px; height:36px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:15px; }
            .notif-icone.critico { background:#fee2e2; color:#ef4444; }
            .notif-icone.atencao { background:#fef3c7; color:#f59e0b; }
            .notif-corpo { flex:1; min-width:0; }
            .notif-corpo strong { display:block; font-size:13px; color:#1e293b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
            .notif-corpo small  { font-size:11px; color:#94a3b8; margin-top:2px; display:block; }
            .notif-action { display:flex; flex-direction:column; align-items:center; gap:6px; margin-left:8px; }
            .notif-mark-read { background:none; border:none; color:#10b981; cursor:pointer; font-size:13px; padding:6px 8px; border-radius:6px; }
            .notif-mark-read:hover { background:#ecfdf5; }
            .notif-mark-all { background:#2563eb; color:white; border:none; cursor:pointer; font-size:13px; padding:6px 10px; border-radius:8px; }
            .notif-mark-all:hover { filter:brightness(.98); }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(dropdown);

    // Fecha ao clicar fora
    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target) && !e.target.closest('.topbar-btn')) {
            fecharDropdown();
        }
    });
}

// ── Renderiza o conteúdo do dropdown ─────────────────────────
function renderizarDropdown(dados, isNovo = false) {
    const dropdown = document.getElementById('notif-dropdown');
    if (!dropdown) return;

    const alertas = dados?.alertas || [];
    const historico = dados?.historico || [];
    const readIds = new Set(getReadAlertIds().map(String));

    const unreadStock = (alertas || []).filter(a => !readIds.has(String(a.id_produto))).map(a => ({
        ...a,
        type: 'stock',
        id: String(a.id_produto),
        title: a.nome,
        subtitle: a.nome_categoria ? `Categoria: ${a.nome_categoria}` : '',
        detail: a.quantidade_estoque === 0
            ? 'Sem estoque — reposição urgente!'
            : `Estoque: ${a.quantidade_estoque} un. (mín: ${a.estoque_minimo})`,
        targetPage: 'alertas.html',
    }));

    const unreadHistory = (historico || []).filter(h => !readIds.has(`hist_${h.id_log}`)).map(h => ({
        ...h,
        type: 'history',
        id: `hist_${h.id_log}`,
        title: `${h.acao} em ${h.nome_tabela}`,
        subtitle: `Registro #${h.id_registro_afetado}`,
        detail: `${h.usuario_exibicao} em ${h.data_formatada} ${h.hora_formatada}`,
        targetPage: 'historico.html',
    }));

    const unread = [...unreadHistory, ...unreadStock];
    if (!unread.length) {
        dropdown.innerHTML = `
            <div style="padding:20px;text-align:center;color:#64748b;">
                <i class="fas fa-check-circle" style="font-size:28px;color:#10b981;display:block;margin-bottom:8px;"></i>
                <strong style="font-size:14px;">Nenhuma notificação nova</strong>
                <p style="font-size:12px;margin:4px 0 0;">Todas as notificações foram marcadas como lidas.</p>
                <div style="margin-top:12px;"><a href="alertas.html" style="color:#2563eb;font-weight:600;text-decoration:none;">Ver todos os alertas</a></div>
            </div>`;
        return;
    }

    const top5 = unread.slice(0, 5);
    const resto = unread.length - top5.length;

    dropdown.innerHTML = `
        <div style="padding:14px 16px;border-bottom:1px solid #f1f5f9;display:flex;justify-content:space-between;align-items:center;background:${isNovo ? '#fff7ed' : '#f8fafc'};">
            <div>
                <strong style="font-size:14px;color:#1e293b;">
                    ${isNovo ? '🔔 Novas notificações' : '🔔 Notificações recentes'}
                </strong>
                <p style="font-size:12px;color:#94a3b8;margin:2px 0 0;">${unread.length} notificação(ões) não-lida(s)</p>
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
                ${unread.length ? `<button class="notif-mark-all" onclick="(function(e){e.stopPropagation(); marcarTodosComoLidos();})(event)">Marcar todos</button>` : ''}
                <button onclick="fecharDropdown()" style="background:none;border:none;color:#94a3b8;cursor:pointer;font-size:16px;padding:4px;">✕</button>
            </div>
        </div>

        ${top5.map(item => `
            <div class="notif-item" onclick="window.location.href='${item.targetPage}'">
                <div class="notif-icone ${item.type === 'stock' ? item.severidade : 'atencao'}">
                    <i class="fas ${item.type === 'stock'
                        ? item.severidade === 'critico' ? 'fa-times-circle' : 'fa-exclamation-triangle'
                        : 'fa-history'}"></i>
                </div>
                <div class="notif-corpo">
                    <strong>${item.title}</strong>
                    <small>${item.subtitle}</small>
                    <small>${item.detail}</small>
                </div>
                <div class="notif-action">
                    <button class="notif-mark-read" title="Marcar como lido" onclick="(function(e){e.stopPropagation(); marcarAlertaComoLido('${item.id}');})(event)">✓ Marcar</button>
                    <span style="color:#2563eb;font-size:18px;align-self:center;">›</span>
                </div>
            </div>
        `).join('')}

        ${resto > 0 ? `
            <div style="padding:10px 16px;text-align:center;background:#f8fafc;border-top:1px solid #f1f5f9;">
                <span style="font-size:12px;color:#64748b;">+${resto} outras notificações</span>
            </div>
        ` : ''}

        <div style="padding:12px 16px;border-top:1px solid #e2e8f0;text-align:center;">
            <a href="alertas.html" style="font-size:13px;font-weight:600;color:#2563eb;text-decoration:none;display:flex;align-items:center;justify-content:center;gap:6px;">
                <i class="fas fa-bell"></i> Ver todos os alertas
            </a>
        </div>`;
}

// ── Abre / fecha o dropdown ───────────────────────────────────
function abrirDropdown(isNovo = false) {
    const dropdown = document.getElementById('notif-dropdown');
    if (!dropdown) return;
    renderizarDropdown({ alertas: _alertasCache, historico: [] }, isNovo);
    dropdown.style.display = 'block';
    dropdown.style.animation = 'none';
    dropdown.offsetHeight; // reflow
    dropdown.style.animation = 'slideDown .2s ease';
    _dropdownAberto = true;
}

function fecharDropdown() {
    const dropdown = document.getElementById('notif-dropdown');
    if (dropdown) dropdown.style.display = 'none';
    _dropdownAberto = false;
}

function toggleDropdown() {
    _dropdownAberto ? fecharDropdown() : abrirDropdown();
}

// ── Atualiza badge no sino ────────────────────────────────────
function atualizarBadgeSino(total) {
    document.querySelectorAll('.badge-alerta-sino').forEach(b => b.remove());

    document.querySelectorAll('.topbar-btn').forEach(btn => {
        if (!btn.querySelector('.fa-bell')) return;
        btn.style.position = 'relative';
        btn.title   = total > 0 ? `${total} produto(s) com estoque baixo — clique para ver` : 'Notificações';
        btn.onclick = (e) => { e.stopPropagation(); toggleDropdown(); };

        if (total === 0) return;
        const badge = document.createElement('span');
        badge.className = 'badge-alerta-sino';
        badge.textContent = total > 99 ? '99+' : total;
        Object.assign(badge.style, {
            position: 'absolute', top: '4px', right: '4px',
            background: '#ef4444', color: 'white',
            fontSize: '9px', fontWeight: '700',
            minWidth: '16px', height: '16px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none', padding: '0 3px',
            boxShadow: '0 0 0 2px white',
        });
        btn.appendChild(badge);
    });
}

// ── Polling principal ─────────────────────────────────────────
async function verificarAlertasEstoque() {
    try {
        const dados = await api.get('/alertas');

        _alertasCache = dados.alertas || [];

        // Badge usa o TOTAL real de produtos em alerta (independente de lidos)
        const totalAlertas = _alertasCache.length;

        // Popup só abre quando o número de alertas AUMENTA (novo produto entrou em alerta)
        const isNovo = _notificacaoCountAnterior >= 0 && totalAlertas > _notificacaoCountAnterior;

        if (isNovo) {
            const novos = totalAlertas - _notificacaoCountAnterior;
            criarDropdownNotificacoes();
            abrirDropdown(true);
            toast(`⚠️ ${novos} produto(s) atingiram o estoque mínimo!`, 'warning');
        }

        _notificacaoCountAnterior = totalAlertas;
        atualizarBadgeSino(totalAlertas);
        criarDropdownNotificacoes();

    } catch (e) {
        console.warn('[Alertas] Falha ao verificar:', e.message);
    }
}

function iniciarPollingAlertas() {
    // Tenta imediatamente, e depois com delays crescentes como fallback
    verificarAlertasEstoque();
    setTimeout(verificarAlertasEstoque, 1500);
    setTimeout(verificarAlertasEstoque, 4000);
    if (_pollingInterval) return;
    _pollingInterval = setInterval(verificarAlertasEstoque, 15_000);
}

document.addEventListener('DOMContentLoaded', async () => {
    await carregarConfigGlobal();
    iniciarPollingAlertas(); // polling em todas as páginas

    // ── Sidebar toggle ───────────────────────────────────────
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar    = document.getElementById('sidebar');
    const topbar     = document.querySelector('.topbar');
    const main       = document.querySelector('.main');

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            sidebar?.classList.toggle('hidden');
            topbar?.classList.toggle('expanded');
            main?.classList.toggle('expanded');
        });
    }

    // ── Roteamento por página ────────────────────────────────
    if (document.getElementById('card-entradas'))       initDashboard();
    if (document.getElementById('tabela-produtos-body')) initProdutos();
    if (document.getElementById('tabela-fornecedores-body')) initFornecedores();
    if (document.getElementById('tabela-categorias-body'))   initCategorias();
    if (document.getElementById('tabela-setores-body'))      initSetores();
    if (document.getElementById('tabela-funcionarios-body')) initFuncionarios();
    if (document.getElementById('tabela-entradas-body'))     initEntradas();
    if (document.getElementById('tabela-saidas-body'))       initSaidas();
    if (document.getElementById('tabela-historico-body'))    initHistorico();
});

// ════════════════════════════════════════════════════════════
// UTILITÁRIOS
// ════════════════════════════════════════════════════════════

function toast(msg, tipo = 'success') {
    const cores = { success: '#10b981', error: '#ef4444', warning: '#f59e0b' };
    const el = document.createElement('div');
    el.textContent = msg;
    Object.assign(el.style, {
        position: 'fixed', bottom: '30px', right: '30px',
        background: cores[tipo], color: 'white',
        padding: '14px 22px', borderRadius: '10px',
        fontFamily: 'Poppins, sans-serif', fontSize: '14px',
        fontWeight: '600', zIndex: '9999',
        boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
        transition: 'opacity 0.4s',
    });
    document.body.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 400); }, 3000);
}

function _parseUtc(iso) {
    // SQL Server retorna sem 'Z', JS interpreta como local — força UTC
    if (!iso) return null;
    const s = String(iso);
    return new Date(s.endsWith('Z') || s.includes('+') ? s : s + 'Z');
}

function formatarData(isoString) {
    if (!isoString) return '—';
    return _parseUtc(isoString).toLocaleDateString('pt-BR');
}

function formatarMoeda(valor) {
    return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ════════════════════════════════════════════════════════════
// PAGINAÇÃO — sistema central aplicado em todas as tabelas
// ════════════════════════════════════════════════════════════

// Retorna a fatia de dados para a página atual
function paginar(dados, pagina, limite) {
    const inicio = (pagina - 1) * limite;
    return dados.slice(inicio, inicio + limite);
}

// Renderiza os botões de paginação em qualquer container
function renderPaginacao(containerId, total, paginaAtual, limite, aoMudarPagina) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    const totalPaginas = Math.ceil(total / limite);
    if (totalPaginas <= 1) {
        // Mesmo com 1 página mostra o contador de registros
        if (total > 0) {
            const info = document.createElement('small');
            info.style.cssText = 'display:block;text-align:center;color:#94a3b8;font-size:12px;margin-top:8px;';
            info.textContent = `${total} registro(s)`;
            container.appendChild(info);
        }
        return;
    }

    // Calcula intervalo de páginas visíveis (máx 5)
    let inicio = Math.max(1, paginaAtual - 2);
    let fim    = Math.min(totalPaginas, inicio + 4);
    if (fim - inicio < 4) inicio = Math.max(1, fim - 4);

    // ── Botão Anterior ────────────────────────────────────────
    const btnPrev = document.createElement('button');
    btnPrev.type      = 'button';
    btnPrev.className = 'pag-btn';
    btnPrev.innerHTML = '<i class="fas fa-chevron-left"></i>';
    if (paginaAtual === 1) {
        btnPrev.disabled = true;
        btnPrev.style.opacity = '0.4';
        btnPrev.style.cursor  = 'not-allowed';
    } else {
        btnPrev.addEventListener('click', () => aoMudarPagina(paginaAtual - 1));
    }
    container.appendChild(btnPrev);

    // ── Botões numéricos ──────────────────────────────────────
    for (let p = inicio; p <= fim; p++) {
        const btn = document.createElement('button');
        btn.type      = 'button';
        btn.className = 'pag-btn' + (p === paginaAtual ? ' ativo' : '');
        btn.textContent = p;
        const num = p; // captura correta no closure
        btn.addEventListener('click', () => aoMudarPagina(num));
        container.appendChild(btn);
    }

    // ── Botão Próximo ─────────────────────────────────────────
    const btnNext = document.createElement('button');
    btnNext.type      = 'button';
    btnNext.className = 'pag-btn';
    btnNext.innerHTML = '<i class="fas fa-chevron-right"></i>';
    if (paginaAtual === totalPaginas) {
        btnNext.disabled = true;
        btnNext.style.opacity = '0.4';
        btnNext.style.cursor  = 'not-allowed';
    } else {
        btnNext.addEventListener('click', () => aoMudarPagina(paginaAtual + 1));
    }
    container.appendChild(btnNext);

    // ── Info de registros ─────────────────────────────────────
    const inicio2 = (paginaAtual - 1) * limite + 1;
    const fim2    = Math.min(paginaAtual * limite, total);
    const info    = document.createElement('small');
    info.style.cssText = 'display:block;text-align:center;color:#94a3b8;font-size:12px;margin-top:8px;';
    info.textContent   = `Mostrando ${inicio2}–${fim2} de ${total} registros`;
    container.appendChild(info);
}

function formatarDataHora(iso) {
    if (!iso) return '—';
    return _parseUtc(iso).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

// Modal genérico de confirmação de exclusão
let _onConfirmarExclusao = null;

function confirmarExclusao(nomeProduto, callback) {
    const modal = document.getElementById('modal-aviso-exclusao');
    if (!modal) {
        if (confirm(`Excluir "${nomeProduto}"?`)) callback();
        return;
    }
    document.getElementById('excluir-mensagem').textContent =
        `Tem certeza que deseja excluir "${nomeProduto}"? Esta ação é irreversível.`;
    modal.style.display = 'flex';
    modal.classList.add('show');
    _onConfirmarExclusao = callback;
}

document.addEventListener('click', (e) => {
    if (e.target.id === 'btn-modal-excluir-confirmar' || e.target.closest('#btn-modal-excluir-confirmar')) {
        const _m = document.getElementById('modal-aviso-exclusao');
        _m.style.display = 'none';
        _m.classList.remove('show');
        if (_onConfirmarExclusao) { _onConfirmarExclusao(); _onConfirmarExclusao = null; }
    }
    if (e.target.id === 'btn-modal-excluir-cancelar' || e.target.closest('#btn-modal-excluir-cancelar')) {
        document.getElementById('modal-aviso-exclusao').classList.remove('show');
        _onConfirmarExclusao = null;
    }
});


// ════════════════════════════════════════════════════════════
// DASHBOARD
// ════════════════════════════════════════════════════════════

async function initDashboard() {
    try {
        const [metricas, resumo] = await Promise.all([
            api.get('/dashboard/metricas'),
            api.get('/dashboard/resumo'),
        ]);

        // ── Cards principais ──────────────────────────────────
        document.getElementById('card-entradas').textContent = metricas.entradasMes.toLocaleString('pt-BR');
        document.getElementById('card-saidas').textContent   = metricas.saidasMes.toLocaleString('pt-BR');
        document.getElementById('card-alertas').textContent  = metricas.alertasMinimos.toLocaleString('pt-BR');
        document.getElementById('card-estoque').textContent  = metricas.totalEstoque.toLocaleString('pt-BR');

        // ── Resumo rápido — usa IDs diretos (sem índice) ──────
        const set = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val ?? '—';
        };
        set('res-fornecedores', resumo.totalFornecedores);
        set('res-funcionarios', resumo.totalFuncionarios);
        set('res-setores',      resumo.totalSetores);
        set('res-categorias',   resumo.totalCategorias);
        set('res-alertas',      metricas.alertasMinimos);

        // ── Últimas 5 atividades ──────────────────────────────
        const lista = document.getElementById('lista-atividades');
        if (!lista) return;

        if (!metricas.atividadesRecentes?.length) {
            lista.innerHTML = `
                <div class="atividade">
                    <i class="fas fa-inbox" style="color:#94a3b8;"></i>
                    <p style="color:#94a3b8;">Nenhuma atividade registrada ainda.</p>
                    <span></span>
                </div>`;
            return;
        }

        const iconMap  = { INSERT: 'fa-plus-circle', UPDATE: 'fa-edit', DELETE: 'fa-trash' };
        const colorMap = { INSERT: '#10b981',         UPDATE: '#2563eb', DELETE: '#ef4444' };
        const labelMap = { INSERT: 'Cadastro',        UPDATE: 'Edição',  DELETE: 'Exclusão' };

        const tabelaLabel = {
            Produto: 'Produto', Fornecedor: 'Fornecedor', Categoria: 'Categoria',
            Setor: 'Setor', Funcionario: 'Funcionário', Entrada: 'Entrada',
            Saida: 'Saída', Usuarios: 'Usuário',
        };

        lista.innerHTML = metricas.atividadesRecentes.map(log => {
            const icon  = iconMap[log.acao]  || 'fa-circle';
            const color = colorMap[log.acao] || '#64748b';
            const label = labelMap[log.acao] || log.acao;
            const tabela = tabelaLabel[log.nome_tabela] || log.nome_tabela;

            return `
                <div class="atividade">
                    <i class="fas ${icon}" style="color:${color};font-size:16px;"></i>
                    <p><strong>${label}</strong> em <strong>${tabela}</strong> — registro #${log.id_registro_afetado}</p>
                    <span>${formatarDataHora(log.data_hora)}</span>
                </div>`;
        }).join('');

    } catch (err) {
        console.error('Erro no dashboard:', err.message);
        const lista = document.getElementById('lista-atividades');
        if (lista) lista.innerHTML = `
            <div class="atividade">
                <i class="fas fa-exclamation-circle" style="color:#ef4444;"></i>
                <p style="color:#ef4444;">Erro ao carregar atividades.</p>
                <span></span>
            </div>`;
    }
}


// ════════════════════════════════════════════════════════════
// PRODUTOS
// ════════════════════════════════════════════════════════════

let _produtoEditandoId = null;

async function initProdutos() {
    await carregarProdutos();

    // ── Item 7: Carrega categorias dinamicamente no select ──────
    try {
        const cats = await api.get('/categorias');
        const selCat  = document.getElementById('select-filtro-categoria');
        const selMod  = document.getElementById('modal-prod-categoria');
        const optCats = cats.map(c => `<option value="${c.id_categoria}">${c.nome_categoria}</option>`).join('');
        if (selCat)  selCat.innerHTML  = '<option value="">Todas as Categorias</option>' + optCats;
        if (selMod)  selMod.innerHTML  = optCats;
    } catch (_) {}

    // ── Filtros em tempo real ─────────────────────────────────
    wiredFiltro('#input-busca-produto', (e) => {
        _filtros.produtos.busca = e.target.value;
        _pag.produtos = 1;
        renderizarProdutos();
    });
    wiredFiltro('#select-filtro-categoria', (e) => {
        _filtros.produtos.categoria = e.target.value;
        _pag.produtos = 1;
        renderizarProdutos();
    });
    wiredFiltro('#select-filtro-status', (e) => {
        _filtros.produtos.status = e.target.value;
        _pag.produtos = 1;
        renderizarProdutos();
    });

    // Botão "Novo Produto" — pré-preenche estoque_minimo com o padrão global
    document.getElementById('btn-novo-produto')?.addEventListener('click', () => {
        _produtoEditandoId = null;
        document.getElementById('modal-titulo-dinamico').textContent = 'Cadastrar Novo Produto';
        document.getElementById('form-produto').reset();
        // Pré-preenche com o valor padrão das Configurações
        const minEl = document.getElementById('modal-prod-estoque-min');
        if (minEl) minEl.value = _cfg.estoqueMinimoPadrao || 20;
        document.getElementById('modal-produto').style.display = 'flex';
    });

    // Fechar modal
    document.getElementById('btn-fechar-modal')?.addEventListener('click', () => {
        document.getElementById('modal-produto').style.display = 'none';
    });

    // Submit do form
    document.getElementById('form-produto')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            nome:               document.getElementById('modal-prod-nome').value,
            descricao:          document.getElementById('modal-prod-descricao').value,
            fkcategoria:        parseInt(document.getElementById('modal-prod-categoria').value),
            quantidade_estoque: parseInt(document.getElementById('modal-prod-estoque').value),
            preco_compra:       parseFloat(document.getElementById('modal-prod-preco').value),
            estoque_minimo:     parseInt(document.getElementById('modal-prod-estoque-min')?.value || '20'),
            status1:            'Ativo',
        };
        try {
            if (_produtoEditandoId) {
                await api.put(`/produtos/${_produtoEditandoId}`, payload);
                toast('Produto atualizado com sucesso!');
            } else {
                await api.post('/produtos', payload);
                toast('Produto cadastrado com sucesso!');
            }
            document.getElementById('modal-produto').style.display = 'none';
            await carregarProdutos();
        } catch (err) { toast(err.message, 'error'); }
    });

    // Carregar categorias no select do modal
    try {
        const categorias = await api.get('/categorias');
        const sel = document.getElementById('modal-prod-categoria');
        if (sel) {
            sel.innerHTML = categorias.map(c =>
                `<option value="${c.id_categoria}">${c.nome_categoria}</option>`
            ).join('');
        }
        // Também atualiza o filtro
        const filtro = document.getElementById('select-filtro-categoria');
        if (filtro) {
            filtro.innerHTML = `<option value="">Todas as Categorias</option>` +
                categorias.map(c => `<option value="${c.id_categoria}">${c.nome_categoria}</option>`).join('');
        }
    } catch (_) {}
}

async function carregarProdutos() {
    const tbody = document.getElementById('tabela-produtos-body');
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:20px;color:#64748b">Carregando...</td></tr>`;

    try {
        const produtos = await api.get('/produtos');
        _dados.produtos = produtos;
        _pag.produtos   = 1;

        if (!produtos.length) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:20px;color:#64748b">Nenhum produto cadastrado.</td></tr>`;
            return;
        }
        renderizarProdutos();
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:#dc2626;padding:20px">Erro ao carregar: ${err.message}</td></tr>`;
    }
}

function computarFiltrosProdutos() {
    let r = [...(_dados.produtos || [])];
    const f = _filtros.produtos;
    r = filtrarBusca(r, f.busca, ['nome', 'descricao', 'nome_categoria']);
    if (f.categoria) r = r.filter(p => String(p.fkcategoria) === f.categoria);
    if (f.status && f.status !== 'todos') r = filtrarSelect(r, 'status1', f.status);
    _visivel.produtos = r;
}

function renderizarProdutos() {
    const tbody = document.getElementById('tabela-produtos-body');
    if (!tbody || !_dados.produtos) return;

    computarFiltrosProdutos();
    const todos   = _visivel.produtos;
    const pagina  = _pag.produtos;
    const limite  = _cfg.itensPorPagina;
    const fatia   = paginar(todos, pagina, limite);

    tbody.innerHTML = fatia.map(p => {
        const precoVenda  = (Number(p.preco_compra) * 1.3).toFixed(2).replace('.', ',');
        const statusClass = p.status1?.toLowerCase() === 'ativo' ? 'ativo' : 'inativo';
        const estoqueMin  = p.estoque_minimo || 20;
        const estoqueClr  = p.quantidade_estoque <= estoqueMin ? '#ef4444' : '#64748b';
        return `
        <tr>
            <td>${p.id_produto}</td>
            <td><strong>${p.nome}</strong><br><small style="color:#64748b">${p.descricao || ''}</small></td>
            <td>${p.nome_categoria || 'Geral'}</td>
            <td>${p.quantidade_estoque}</td>
            <td><span style="color:${estoqueClr};font-weight:600;">${estoqueMin}</span></td>
            <td>${formatarMoeda(p.preco_compra)}</td>
            <td>R$ ${precoVenda}</td>
            <td><span class="badge ${statusClass}">${p.status1}</span></td>
            <td><div class="acoes">
                <button class="btn-acao editar" data-id="${p.id_produto}" title="Editar"><i class="fas fa-edit"></i></button>
                <button class="btn-acao deletar" data-id="${p.id_produto}" data-nome="${p.nome}" title="Excluir"><i class="fas fa-trash"></i></button>
            </div></td>
        </tr>`;
    }).join('');

    // Eventos — usa _dados.produtos para encontrar o item mesmo após paginação
    tbody.querySelectorAll('.btn-acao.editar').forEach(btn => {
        btn.addEventListener('click', async () => {
            const prod = _dados.produtos.find(p => p.id_produto == btn.dataset.id);
            if (!prod) return;
            _produtoEditandoId = prod.id_produto;
            document.getElementById('modal-titulo-dinamico').textContent = 'Editar Produto';
            document.getElementById('modal-prod-nome').value     = prod.nome;
            document.getElementById('modal-prod-descricao').value = prod.descricao || '';
            document.getElementById('modal-prod-categoria').value = prod.fkcategoria;
            document.getElementById('modal-prod-estoque').value   = prod.quantidade_estoque;
            document.getElementById('modal-prod-preco').value     = prod.preco_compra;
            const minEl = document.getElementById('modal-prod-estoque-min');
            if (minEl) minEl.value = prod.estoque_minimo || 20;
            document.getElementById('modal-produto').style.display = 'flex';
        });
    });

    tbody.querySelectorAll('.btn-acao.deletar').forEach(btn => {
        btn.addEventListener('click', () => {
            confirmarExclusao(btn.dataset.nome, async () => {
                try {
                    await api.delete(`/produtos/${btn.dataset.id}`);
                    toast('Produto excluído!');
                    await carregarProdutos();
                } catch (err) { toast(err.message, 'error'); }
            });
        });
    });

    // Paginação
    renderPaginacao('paginacao-container', todos.length, pagina, limite, (p) => {
        _pag.produtos = p;
        renderizarProdutos();
    });
}


// ════════════════════════════════════════════════════════════
// FORNECEDORES
// ════════════════════════════════════════════════════════════

let _fornEditandoId = null;

async function initFornecedores() {
    await carregarFornecedores();

    // Filtros
    wiredFiltro('.fornecedores-filtros .busca-box input', (e) => {
        _filtros.fornecedores.busca = e.target.value;
        _pag.fornecedores = 1;
        renderizarFornecedoresPaginados();
    });

    document.querySelector('.btn-novo-fornecedor')?.addEventListener('click', () => {
        _fornEditandoId = null;
        _idContatoAtual = null;
        document.getElementById('form-fornecedor')?.reset();
        document.getElementById('modal-titulo-forn').textContent = 'Novo Fornecedor';
        // Volta para aba de dados e bloqueia as demais
        document.querySelectorAll('.forn-tab-painel').forEach(p => p.style.display = 'none');
        const basico = document.getElementById('forn-basico');
        if (basico) basico.style.display = 'block';
        document.querySelectorAll('.forn-tab-btn').forEach(b => {
            b.style.color = b.dataset.tab === 'forn-basico' ? '#2563eb' : '#64748b';
            b.style.borderBottom = b.dataset.tab === 'forn-basico' ? '2px solid #2563eb' : '2px solid transparent';
            if (b.dataset.tab !== 'forn-basico') {
                b.setAttribute('disabled', true);
                b.style.opacity = '0.4';
                b.style.cursor = 'not-allowed';
            }
        });
        document.getElementById('modal-fornecedor').style.display = 'flex';
    });

    document.getElementById('btn-fechar-modal-forn')?.addEventListener('click', () => {
        document.getElementById('modal-fornecedor').style.display = 'none';
    });

    document.getElementById('form-fornecedor')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            razao_social: document.getElementById('forn-razao').value,
            cnpj:         document.getElementById('forn-cnpj').value.replace(/\D/g, ''),
            email:        document.getElementById('forn-email').value,
        };
        const btnSalvar = e.target.querySelector('button[type="submit"]');
        try {
            let resultado;
            if (_fornEditandoId) {
                resultado = await api.put(`/fornecedores/${_fornEditandoId}`, payload);
                toast('Dados atualizados!');
            } else {
                resultado = await api.post('/fornecedores', payload);
                toast('Fornecedor salvo! Agora adicione telefone e endereço.');
            }

            // Usa o ID retornado para desbloquear as abas de contato
            const novoId = resultado?.id || _fornEditandoId;
            if (novoId) {
                _fornEditandoId = novoId;
                abrirModalContatosForn(novoId);
                // Desbloqueia as abas visualmente
                document.querySelectorAll('.forn-tab-btn').forEach(b => {
                    b.removeAttribute('disabled');
                    b.style.opacity = '1';
                    b.style.cursor  = 'pointer';
                });
                // Feedback visual no botão
                if (btnSalvar) {
                    btnSalvar.innerHTML = '<i class="fas fa-check"></i> Salvo!';
                    btnSalvar.style.background = '#10b981';
                    setTimeout(() => {
                        btnSalvar.innerHTML = '<i class="fas fa-save"></i> Salvar Dados';
                        btnSalvar.style.background = '#27ae60';
                    }, 2000);
                }
            }
            await carregarFornecedores();
        } catch (err) { toast(err.message, 'error'); }
    });
}

async function carregarFornecedores() {
    const tbody = document.getElementById('tabela-fornecedores-body');
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:20px;color:#64748b">Carregando...</td></tr>`;

    try {
        const dados = await api.get('/fornecedores');
        _dados.fornecedores = dados;
        if (!dados.length) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:20px">Nenhum fornecedor.</td></tr>`;
            return;
        }
        _pag.fornecedores = 1;
        renderizarFornecedoresPaginados();
    } catch (err) {
        const tbody = document.getElementById('tabela-fornecedores-body');
        if(tbody) tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#dc2626;padding:20px">${err.message}</td></tr>`;
    }
}

function renderizarFornecedoresPaginados() {
    const tbody = document.getElementById('tabela-fornecedores-body');
    if (!tbody || !_dados.fornecedores) return;
    // Apply filters
    const dados  = _dados.fornecedores;
    let _baseforn2 = [...dados];
    if (_filtros.fornecedores.busca) {
        const _q = _filtros.fornecedores.busca.toLowerCase();
        _baseforn2 = _baseforn2.filter(x =>
            String(x.razao_social??'').toLowerCase().includes(_q) ||
            String(x.cnpj??'').toLowerCase().includes(_q) ||
            String(x.email??'').toLowerCase().includes(_q)
        );
    }
    _visivel.fornecedores = _baseforn2;
    const pagina = _pag.fornecedores;
    const limite = _cfg.itensPorPagina;
    const slice  = paginar(_visivel.fornecedores, pagina, limite);

        tbody.innerHTML = slice.map((f, i) => `
            <tr>
                <td>${i + 1}</td>
                <td>${f.razao_social}</td>
                <td>${f.cnpj}</td>
                <td>${f.email}</td>
                <td><span class="badge ativo">Ativo</span></td>
                <td><div class="acoes">
                    <button class="btn-acao editar" data-id="${f.id_fornecedor}" title="Editar"><i class="fas fa-edit"></i></button>
                    <button class="btn-acao deletar" data-id="${f.id_fornecedor}" data-nome="${f.razao_social}" title="Excluir"><i class="fas fa-trash"></i></button>
                </div></td>
            </tr>`).join('');

        tbody.querySelectorAll('.btn-acao.editar').forEach(btn => {
            btn.addEventListener('click', () => {
                const f = _dados.fornecedores.find(x => x.id_fornecedor == btn.dataset.id);
                if (!f) return;
                _fornEditandoId = f.id_fornecedor;
                document.getElementById('forn-razao').value  = f.razao_social;
                document.getElementById('forn-cnpj').value   = f.cnpj;
                document.getElementById('forn-email').value  = f.email;
                document.getElementById('modal-titulo-forn').textContent = 'Editar Fornecedor';
                // Volta para aba de dados e desbloqueia as demais
                document.querySelectorAll('.forn-tab-painel').forEach(p => p.style.display = 'none');
                const basico = document.getElementById('forn-basico');
                if (basico) basico.style.display = 'block';
                document.querySelectorAll('.forn-tab-btn').forEach(b => {
                    b.style.color = b.dataset.tab === 'forn-basico' ? '#2563eb' : '#64748b';
                    b.style.borderBottom = b.dataset.tab === 'forn-basico' ? '2px solid #2563eb' : '2px solid transparent';
                    b.removeAttribute('disabled');
                });
                abrirModalContatosForn(f.id_fornecedor);
                document.getElementById('modal-fornecedor').style.display = 'flex';
            });
        });

        tbody.querySelectorAll('.btn-acao.deletar').forEach(btn => {
            btn.addEventListener('click', () => {
                confirmarExclusao(btn.dataset.nome, async () => {
                    try {
                        await api.delete(`/fornecedores/${btn.dataset.id}`);
                        toast('Fornecedor excluído!');
                        await carregarFornecedores();
                    } catch (err) { toast(err.message, 'error'); }
                });
            });
        });

    renderPaginacao('paginacao-fornecedores', dados.length, pagina, limite, (p) => {
        _pag.fornecedores = p;
        renderizarFornecedoresPaginados();
    });
}


// ════════════════════════════════════════════════════════════
// CATEGORIAS
// ════════════════════════════════════════════════════════════

let _catEditandoId = null;

async function initCategorias() {
    await carregarCategorias();

    // Filtros
    wiredFiltro('#tab-empresa ~ .main .busca-box input, .busca-box input', (e) => {
        _filtros.categorias.busca = e.target.value;
        _pag.categorias = 1;
        carregarCategorias();
    });

    document.querySelector('.btn-primary')?.addEventListener('click', () => {
        _catEditandoId = null;
        document.getElementById('form-categoria')?.reset();
        document.getElementById('modal-titulo-cat').textContent = 'Nova Categoria';
        document.getElementById('modal-categoria').style.display = 'flex';
    });

    document.getElementById('btn-fechar-modal-cat')?.addEventListener('click', () => {
        document.getElementById('modal-categoria').style.display = 'none';
    });

    document.getElementById('form-categoria')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = { nome_categoria: document.getElementById('cat-nome').value };
        try {
            if (_catEditandoId) {
                await api.put(`/categorias/${_catEditandoId}`, payload);
                toast('Categoria atualizada!');
            } else {
                await api.post('/categorias', payload);
                toast('Categoria criada!');
            }
            document.getElementById('modal-categoria').style.display = 'none';
            await carregarCategorias();
        } catch (err) { toast(err.message, 'error'); }
    });
}

async function carregarCategorias() {
    const tbody = document.getElementById('tabela-categorias-body');
    if (!tbody) return;
    try {
        const dados = await api.get('/categorias');
        _dados.categorias = dados;
        // Filtro
        let _basecategorias = [...(dados || [])];
        if (_filtros.categorias.busca) {
            const _q = _filtros.categorias.busca.toLowerCase();
            _basecategorias = _basecategorias.filter(x => String(x.nome_categoria??'').toLowerCase().includes(_q));
        }
        _visivel.categorias = _basecategorias;
        const _pcategorias = _pag.categorias;
        const _lcategorias = _cfg.itensPorPagina;
        const _scategorias  = paginar(_visivel.categorias, _pcategorias, _lcategorias);
                tbody.innerHTML = _scategorias.map((c, i) => `
            <tr>
                <td>${i + 1}</td>
                <td><div class="cat-icon-box"><i class="fas fa-tags"></i></div></td>
                <td><strong>${c.nome_categoria}</strong></td>
                <td><span class="count-badge">${c.total_produtos} itens</span></td>
                <td><span class="badge ativo">Ativo</span></td>
                <td class="acoes">
                    <button class="btn-acao editar" data-id="${c.id_categoria}" title="Editar"><i class="fas fa-edit"></i></button>
                    <button class="btn-acao deletar" data-id="${c.id_categoria}" data-nome="${c.nome_categoria}" title="Excluir"><i class="fas fa-trash"></i></button>
                </td>
            </tr>`).join('');

        tbody.querySelectorAll('.btn-acao.editar').forEach(btn => {
            btn.addEventListener('click', () => {
                const c = dados.find(x => x.id_categoria == btn.dataset.id);
                if (!c) return;
                _catEditandoId = c.id_categoria;
                document.getElementById('cat-nome').value = c.nome_categoria;
                document.getElementById('modal-titulo-cat').textContent = 'Editar Categoria';
                document.getElementById('modal-categoria').style.display = 'flex';
            });
        });

        tbody.querySelectorAll('.btn-acao.deletar').forEach(btn => {
            btn.addEventListener('click', () => {
                confirmarExclusao(btn.dataset.nome, async () => {
                    try {
                        await api.delete(`/categorias/${btn.dataset.id}`);
                        toast('Categoria excluída!');
                        await carregarCategorias();
                    } catch (err) { toast(err.message, 'error'); }
                });
            });
        });

        renderPaginacao('paginacao-categorias', _visivel.categorias.length, _pcategorias, _lcategorias, (p) => {
            _pag.categorias = p;
            carregarCategorias();
        });
    } catch (err) { console.error(err); }
}


// ════════════════════════════════════════════════════════════
// SETORES
// ════════════════════════════════════════════════════════════

let _setorEditandoId = null;

async function initSetores() {
    await carregarSetores();

    // Filtros
    wiredFiltro('.busca-box input', (e) => {
        _filtros.setores.busca = e.target.value;
        _pag.setores = 1;
        carregarSetores();
    });

    document.querySelector('.btn-primary')?.addEventListener('click', () => {
        _setorEditandoId = null;
        document.getElementById('form-setor')?.reset();
        document.getElementById('modal-titulo-setor').textContent = 'Novo Setor';
        document.getElementById('modal-setor').style.display = 'flex';
    });

    document.getElementById('btn-fechar-modal-setor')?.addEventListener('click', () => {
        document.getElementById('modal-setor').style.display = 'none';
    });

    document.getElementById('form-setor')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            nome_setor:           document.getElementById('setor-nome').value,
            numero_funcionarios:  parseInt(document.getElementById('setor-nfuncs').value) || 0,
        };
        try {
            if (_setorEditandoId) {
                await api.put(`/setores/${_setorEditandoId}`, payload);
                toast('Setor atualizado!');
            } else {
                await api.post('/setores', payload);
                toast('Setor criado!');
            }
            document.getElementById('modal-setor').style.display = 'none';
            await carregarSetores();
        } catch (err) { toast(err.message, 'error'); }
    });
}

async function carregarSetores() {
    const tbody = document.getElementById('tabela-setores-body');
    if (!tbody) return;
    try {
        const dados = await api.get('/setores');
        _dados.setores = dados;
        // Filtro
        let _basesetores = [...(dados || [])];
        if (_filtros.setores.busca) {
            const _q = _filtros.setores.busca.toLowerCase();
            _basesetores = _basesetores.filter(x => String(x.nome_setor??'').toLowerCase().includes(_q));
        }
        _visivel.setores = _basesetores;
        const _psetores = _pag.setores;
        const _lsetores = _cfg.itensPorPagina;
        const _ssetores  = paginar(_visivel.setores, _psetores, _lsetores);
                tbody.innerHTML = _ssetores.map((s, i) => `
            <tr>
                <td>${i + 1}</td>
                <td><div class="setor-nome"><div class="setor-icon azul"><i class="fas fa-building"></i></div><span>${s.nome_setor}</span></div></td>
                <td>—</td>
                <td><span class="count-badge">${s.numero_funcionarios} funcs.</span></td>
                <td>—</td>
                <td>—</td>
                <td><span class="badge ativo">Ativo</span></td>
                <td class="acoes">
                    <button class="btn-acao editar" data-id="${s.id_setor}" title="Editar"><i class="fas fa-edit"></i></button>
                    <button class="btn-acao deletar" data-id="${s.id_setor}" data-nome="${s.nome_setor}" title="Excluir"><i class="fas fa-trash"></i></button>
                </td>
            </tr>`).join('');

        tbody.querySelectorAll('.btn-acao.editar').forEach(btn => {
            btn.addEventListener('click', () => {
                const s = dados.find(x => x.id_setor == btn.dataset.id);
                if (!s) return;
                _setorEditandoId = s.id_setor;
                document.getElementById('setor-nome').value   = s.nome_setor;
                document.getElementById('setor-nfuncs').value = s.numero_funcionarios;
                document.getElementById('modal-titulo-setor').textContent = 'Editar Setor';
                document.getElementById('modal-setor').style.display = 'flex';
            });
        });

        tbody.querySelectorAll('.btn-acao.deletar').forEach(btn => {
            btn.addEventListener('click', () => {
                confirmarExclusao(btn.dataset.nome, async () => {
                    try {
                        await api.delete(`/setores/${btn.dataset.id}`);
                        toast('Setor excluído!');
                        await carregarSetores();
                    } catch (err) { toast(err.message, 'error'); }
                });
            });
        });

    renderPaginacao('paginacao-setores', _visivel.setores.length, _psetores, _lsetores, (p) => {
        _pag.setores = p;
        carregarSetores();
    });
    } catch (err) { console.error(err); }
}


// ════════════════════════════════════════════════════════════
// FUNCIONÁRIOS
// ════════════════════════════════════════════════════════════

let _funcEditandoId = null;

async function initFuncionarios() {
    await carregarFuncionarios();

    // Filtros
    wiredFiltro('.busca-box input', (e) => {
        _filtros.funcionarios.busca = e.target.value;
        _pag.funcionarios = 1;
        carregarFuncionarios();
    });
    wiredFiltro('select[aria-label="Filtrar por setor"]', (e) => {
        _filtros.funcionarios.setor = e.target.value;
        _pag.funcionarios = 1;
        carregarFuncionarios();
    });

    // Carrega setores no select do modal
    try {
        const setores = await api.get('/setores');
        const sel = document.getElementById('func-setor');
        if (sel) sel.innerHTML = setores.map(s =>
            `<option value="${s.id_setor}">${s.nome_setor}</option>`).join('');
    } catch (_) {}

    document.querySelector('.btn-primary')?.addEventListener('click', () => {
        _funcEditandoId = null;
        _idContatoAtual = null;
        document.getElementById('form-funcionario')?.reset();
        document.getElementById('modal-titulo-func').textContent = 'Novo Funcionário';
        // Volta para aba de dados e bloqueia as demais
        document.querySelectorAll('.func-tab-painel').forEach(p => p.style.display = 'none');
        const basico = document.getElementById('func-basico');
        if (basico) basico.style.display = 'block';
        document.querySelectorAll('.func-tab-btn').forEach(b => {
            b.style.color = b.dataset.tab === 'func-basico' ? '#2563eb' : '#64748b';
            b.style.borderBottom = b.dataset.tab === 'func-basico' ? '2px solid #2563eb' : '2px solid transparent';
            if (b.dataset.tab !== 'func-basico') {
                b.setAttribute('disabled', true);
                b.style.opacity = '0.4';
                b.style.cursor = 'not-allowed';
            }
        });
        document.getElementById('modal-funcionario').style.display = 'flex';
    });

    document.getElementById('btn-fechar-modal-func')?.addEventListener('click', () => {
        document.getElementById('modal-funcionario').style.display = 'none';
    });

    document.getElementById('form-funcionario')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            nome_funcionario: document.getElementById('func-nome').value,
            tipo_funcionario: document.getElementById('func-tipo').value,
            fksetor:          parseInt(document.getElementById('func-setor').value),
        };
        const btnSalvar = e.target.querySelector('button[type="submit"]');
        try {
            let resultado;
            if (_funcEditandoId) {
                resultado = await api.put(`/funcionarios/${_funcEditandoId}`, payload);
                toast('Dados atualizados!');
            } else {
                resultado = await api.post('/funcionarios', payload);
                toast('Funcionário salvo! Agora adicione telefone e endereço.');
            }

            // Usa o ID retornado para desbloquear as abas de contato
            const novoId = resultado?.id || _funcEditandoId;
            if (novoId) {
                _funcEditandoId = novoId;
                abrirModalContatosFunc(novoId);
                // Desbloqueia as abas visualmente
                document.querySelectorAll('.func-tab-btn').forEach(b => {
                    b.removeAttribute('disabled');
                    b.style.opacity = '1';
                    b.style.cursor  = 'pointer';
                });
                // Feedback visual no botão
                if (btnSalvar) {
                    btnSalvar.innerHTML = '<i class="fas fa-check"></i> Salvo!';
                    btnSalvar.style.background = '#10b981';
                    setTimeout(() => {
                        btnSalvar.innerHTML = '<i class="fas fa-save"></i> Salvar Dados';
                        btnSalvar.style.background = '#2563eb';
                    }, 2000);
                }
            }
            await carregarFuncionarios();
        } catch (err) { toast(err.message, 'error'); }
    });
}

async function carregarFuncionarios() {
    const tbody = document.getElementById('tabela-funcionarios-body');
    if (!tbody) return;
    try {
        const dados = await api.get('/funcionarios');
        _dados.funcionarios = dados;
        const iniciais = nome => nome.split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase();
        const cores = ['azul','verde','laranja','roxo'];
        // Filtro
        let _basefuncionarios = [...(dados || [])];
        if (_filtros.funcionarios.busca) {
            const _q = _filtros.funcionarios.busca.toLowerCase();
            _basefuncionarios = _basefuncionarios.filter(x =>
                String(x.nome_funcionario??'').toLowerCase().includes(_q) ||
                String(x.tipo_funcionario??'').toLowerCase().includes(_q)
            );
        }
        if (_filtros.funcionarios.setor) _basefuncionarios = _basefuncionarios.filter(x => String(x.fksetor) === _filtros.funcionarios.setor);
        _visivel.funcionarios = _basefuncionarios;
        const _pfuncionarios = _pag.funcionarios;
        const _lfuncionarios = _cfg.itensPorPagina;
        const _sfuncionarios  = paginar(_visivel.funcionarios, _pfuncionarios, _lfuncionarios);
                tbody.innerHTML = _sfuncionarios.map((f, i) => `
            <tr>
                <td>${i + 1}</td>
                <td><div class="func-nome"><div class="avatar ${cores[i % 4]}">${iniciais(f.nome_funcionario)}</div><span>${f.nome_funcionario}</span></div></td>
                <td>${f.tipo_funcionario}</td>
                <td><span class="setor-badge ti">${f.nome_setor || '—'}</span></td>
                <td>—</td>
                <td>—</td>
                <td><span class="badge ativo">Ativo</span></td>
                <td class="acoes">
                    <button class="btn-acao editar" data-id="${f.id_funcionario}" title="Editar"><i class="fas fa-edit"></i></button>
                    <button class="btn-acao deletar" data-id="${f.id_funcionario}" data-nome="${f.nome_funcionario}" title="Excluir"><i class="fas fa-trash"></i></button>
                </td>
            </tr>`).join('');

        tbody.querySelectorAll('.btn-acao.editar').forEach(btn => {
            btn.addEventListener('click', () => {
                const f = _dados.funcionarios.find(x => x.id_funcionario == btn.dataset.id);
                if (!f) return;
                _funcEditandoId = f.id_funcionario;
                document.getElementById('func-nome').value  = f.nome_funcionario;
                document.getElementById('func-tipo').value  = f.tipo_funcionario;
                document.getElementById('func-setor').value = f.fksetor;
                document.getElementById('modal-titulo-func').textContent = 'Editar Funcionário';
                // Volta para aba de dados e desbloqueia as demais
                document.querySelectorAll('.func-tab-painel').forEach(p => p.style.display = 'none');
                const basico = document.getElementById('func-basico');
                if (basico) basico.style.display = 'block';
                document.querySelectorAll('.func-tab-btn').forEach(b => {
                    b.style.color = b.dataset.tab === 'func-basico' ? '#2563eb' : '#64748b';
                    b.style.borderBottom = b.dataset.tab === 'func-basico' ? '2px solid #2563eb' : '2px solid transparent';
                    b.removeAttribute('disabled');
                });
                abrirModalContatosFunc(f.id_funcionario);
                document.getElementById('modal-funcionario').style.display = 'flex';
            });
        });

        tbody.querySelectorAll('.btn-acao.deletar').forEach(btn => {
            btn.addEventListener('click', () => {
                confirmarExclusao(btn.dataset.nome, async () => {
                    try {
                        await api.delete(`/funcionarios/${btn.dataset.id}`);
                        toast('Funcionário excluído!');
                        await carregarFuncionarios();
                    } catch (err) { toast(err.message, 'error'); }
                });
            });
        });

    renderPaginacao('paginacao-funcionarios', _visivel.funcionarios.length, _pfuncionarios, _lfuncionarios, (p) => {
        _pag.funcionarios = p;
        carregarFuncionarios();
    });
    } catch (err) { console.error(err); }
}


// ════════════════════════════════════════════════════════════
// ENTRADAS
// ════════════════════════════════════════════════════════════

async function initEntradas() {
    await carregarEntradas();

    // Filtros
    wiredFiltro('.busca-box input', (e) => {
        _filtros.entradas.busca = e.target.value;
        _pag.entradas = 1;
        carregarEntradas();
    });

    // Popula selects do modal
    try {
        const [produtos, fornecedores] = await Promise.all([
            api.get('/produtos'), api.get('/fornecedores')
        ]);
        const selProd = document.getElementById('entrada-produto');
        const selForn = document.getElementById('entrada-fornecedor');
        if (selProd) selProd.innerHTML = produtos.map(p => `<option value="${p.id_produto}">${p.nome}</option>`).join('');
        if (selForn) selForn.innerHTML = fornecedores.map(f => `<option value="${f.id_fornecedor}">${f.razao_social}</option>`).join('');
    } catch (_) {}

    document.querySelector('.btn-primary')?.addEventListener('click', () => {
        document.getElementById('form-entrada')?.reset();
        document.getElementById('modal-entrada').classList.add('show');
    });

    document.getElementById('btn-fechar-modal-entrada')?.addEventListener('click', () => {
        document.getElementById('modal-entrada').classList.remove('show');
    });

    document.getElementById('form-entrada')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const qtd   = parseInt(document.getElementById('entrada-qtd').value);
        const unit  = parseFloat(document.getElementById('entrada-unitario').value);
        const payload = {
            fkproduto: parseInt(document.getElementById('entrada-produto').value),
            fkfornecedor: parseInt(document.getElementById('entrada-fornecedor').value),
            data_compra: document.getElementById('entrada-data').value,
            quantidade_compra: qtd,
            valor_unitario: unit,
            valor_compra: (qtd * unit).toFixed(2),
            num_nf: parseFloat(document.getElementById('entrada-nf').value),
        };
        try {
            await api.post('/entradas', payload);
            toast('Entrada registrada! Estoque atualizado.');
            document.getElementById('modal-entrada').classList.remove('show');
            // Volta para página 1 para mostrar a nova entrada no topo
            _pag.entradas = 1;
            // Invalida cache de produtos (estoque foi atualizado pelo trigger)
            _dados.produtos = null;
            await carregarEntradas();
        } catch (err) { toast(err.message, 'error'); }
    });
}

async function carregarEntradas() {
    const tbody = document.getElementById('tabela-entradas-body');
    if (!tbody) return;
    try {
        const dados = await api.get('/entradas');
        _dados.entradas = dados;
        // Filtro
        let _baseentradas = [...(dados || [])];
        if (_filtros.entradas.busca) {
            const _q = _filtros.entradas.busca.toLowerCase();
            _baseentradas = _baseentradas.filter(x =>
                String(x.nome_produto??'').toLowerCase().includes(_q) ||
                String(x.nome_fornecedor??'').toLowerCase().includes(_q)
            );
        }
        _visivel.entradas = _baseentradas;
        const _pentradas = _pag.entradas;
        const _lentradas = _cfg.itensPorPagina;
        const _sentradas  = paginar(_visivel.entradas, _pentradas, _lentradas);
                tbody.innerHTML = _sentradas.map(e => `
            <tr>
                <td>${formatarData(e.data_compra)}</td>
                <td>${e.nome_produto}</td>
                <td>${e.nome_fornecedor}</td>
                <td>${e.num_nf}</td>
                <td>${e.quantidade_compra}</td>
                <td>${formatarMoeda(e.valor_unitario)}</td>
                <td>${formatarMoeda(e.valor_compra)}</td>
                <td><span class="badge recebido">Recebido</span></td>
                <td class="acoes">
                    <button class="btn-acao deletar" data-id="${e.id_entrada}" data-nome="entrada #${e.id_entrada}" title="Excluir"><i class="fas fa-trash"></i></button>
                </td>
            </tr>`).join('') || `<tr><td colspan="9" style="text-align:center;padding:20px">Nenhuma entrada.</td></tr>`;

        tbody.querySelectorAll('.btn-acao.deletar').forEach(btn => {
            btn.addEventListener('click', () => {
                confirmarExclusao(btn.dataset.nome, async () => {
                    try {
                        await api.delete(`/entradas/${btn.dataset.id}`);
                        toast('Entrada excluída!');
                        await carregarEntradas();
                    } catch (err) { toast(err.message, 'error'); }
                });
            });
        });

    renderPaginacao('paginacao-entradas', _visivel.entradas.length, _pentradas, _lentradas, (p) => {
        _pag.entradas = p;
        carregarEntradas();
    });
    } catch (err) { console.error(err); }
}


// ════════════════════════════════════════════════════════════
// SAÍDAS
// ════════════════════════════════════════════════════════════

async function initSaidas() {
    await carregarSaidas();

    // Filtros
    wiredFiltro('.busca-box input', (e) => {
        _filtros.saidas.busca = e.target.value;
        _pag.saidas = 1;
        carregarSaidas();
    });
    wiredFiltro('#saida', (e) => {
        _filtros.saidas.busca = e.target.value;
        _pag.saidas = 1;
        carregarSaidas();
    });

    try {
        const [produtos, setores] = await Promise.all([
            api.get('/produtos'), api.get('/setores')
        ]);
        const selProd = document.getElementById('saida-produto');
        const selSet  = document.getElementById('saida-setor');
        if (selProd) selProd.innerHTML = produtos.map(p => `<option value="${p.id_produto}">${p.nome} (estoque: ${p.quantidade_estoque})</option>`).join('');
        if (selSet)  selSet.innerHTML  = setores.map(s => `<option value="${s.id_setor}">${s.nome_setor}</option>`).join('');
    } catch (_) {}

    document.querySelector('.btn-danger')?.addEventListener('click', () => {
        document.getElementById('form-saida')?.reset();
        document.getElementById('modal-saida').style.display = 'flex';
    });

    document.getElementById('btn-fechar-modal-saida')?.addEventListener('click', () => {
        document.getElementById('modal-saida').style.display = 'none';
    });

    document.getElementById('form-saida')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            fkproduto:        parseInt(document.getElementById('saida-produto').value),
            fksetor:          parseInt(document.getElementById('saida-setor').value),
            data_saida:       document.getElementById('saida-data').value,
            quantidade_produto: parseInt(document.getElementById('saida-qtd').value),
            valor_saida:      parseFloat(document.getElementById('saida-valor').value) || 0,
        };
        try {
            await api.post('/saidas', payload);
            toast('Saída registrada! Estoque descontado.');
            document.getElementById('modal-saida').style.display = 'none';
            // Volta para página 1 para mostrar a nova saída no topo
            _pag.saidas = 1;
            // Invalida cache de produtos (estoque foi atualizado pelo trigger)
            _dados.produtos = null;
            await carregarSaidas();
        } catch (err) { toast(err.message, 'error'); }
    });
}

async function carregarSaidas() {
    const tbody = document.getElementById('tabela-saidas-body');
    if (!tbody) return;
    try {
        const dados = await api.get('/saidas');
        _dados.saidas = dados;
        // Filtro
        let _basesaidas = [...(dados || [])];
        if (_filtros.saidas.busca) {
            const _q = _filtros.saidas.busca.toLowerCase();
            _basesaidas = _basesaidas.filter(x =>
                String(x.nome_produto??'').toLowerCase().includes(_q) ||
                String(x.nome_setor??'').toLowerCase().includes(_q)
            );
        }
        _visivel.saidas = _basesaidas;
        const _psalidas = _pag.saidas;
        const _lsaidas = _cfg.itensPorPagina;
        const _ssaidas  = paginar(_visivel.saidas, _psalidas, _lsaidas);
        tbody.innerHTML = _ssaidas.map(s => `
            <tr>
                <td>${formatarData(s.data_saida)}</td>
                <td>${s.nome_produto}</td>
                <td>${s.nome_setor}</td>
                <td>${s.quantidade_venda}</td>
                <td>—</td>
                <td><span class="badge concluido">Concluído</span></td>
                <td class="acoes">
                    <button class="btn-acao deletar" data-id="${s.id_saida}" data-nome="saída #${s.id_saida}" title="Excluir"><i class="fas fa-trash"></i></button>
                </td>
            </tr>`).join('') || `<tr><td colspan="7" style="text-align:center;padding:20px">Nenhuma saída.</td></tr>`;

        tbody.querySelectorAll('.btn-acao.deletar').forEach(btn => {
            btn.addEventListener('click', () => {
                confirmarExclusao(btn.dataset.nome, async () => {
                    try {
                        await api.delete(`/saidas/${btn.dataset.id}`);
                        toast('Saída excluída!');
                        await carregarSaidas();
                    } catch (err) { toast(err.message, 'error'); }
                });
            });
        });

    renderPaginacao('paginacao-saidas', _visivel.saidas.length, _psalidas, _lsaidas, (p) => {
        _pag.saidas = p;
        carregarSaidas();
    });
    } catch (err) { console.error(err); }
}


// ════════════════════════════════════════════════════════════
// HISTÓRICO
// ════════════════════════════════════════════════════════════

async function initHistorico() {
    await carregarHistorico();

    // Filtros — re-renderiza do cache sem nova requisição
    wiredFiltro('.busca-box input', (e) => {
        _filtros.historico.busca = e.target.value;
        _pag.historico = 1;
        _renderizarHistorico();
    });
    wiredFiltro('select[aria-label="Filtrar por tipo"]', (e) => {
        const val = e.target.value;
        const map = { 'entrada': 'INSERT', 'saida': 'DELETE', 'cadastro': 'INSERT', 'edicao': 'UPDATE', 'exclusao': 'DELETE' };
        _filtros.historico.tipo = map[val] || (val ? val.toUpperCase() : '');
        _pag.historico = 1;
        _renderizarHistorico();
    });
}

// ── Renderiza uma página do histórico sem re-buscar dados ────
function _renderizarHistorico() {
    const tbody = document.getElementById('tabela-historico-body');
    if (!tbody) return;

    const acaoClass = { INSERT: 'cadastro', UPDATE: 'edicao', DELETE: 'exclusao' };
    const acaoLabel = { INSERT: 'Cadastro', UPDATE: 'Edição',  DELETE: 'Exclusão' };
    const icones    = { INSERT: 'fa-plus',  UPDATE: 'fa-edit', DELETE: 'fa-trash' };
    const corAvatar = ['azul', 'verde', 'laranja', 'roxo'];

    // Aplica filtros sobre o cache
    let base = [...(_dados.historico || [])];
    if (_filtros.historico.busca) {
        const q = _filtros.historico.busca.toLowerCase();
        base = base.filter(x =>
            String(x.nome_tabela   ?? '').toLowerCase().includes(q) ||
            String(x.usuario_banco ?? '').toLowerCase().includes(q) ||
            String(x.acao          ?? '').toLowerCase().includes(q)
        );
    }
    if (_filtros.historico.tipo) {
        base = base.filter(x => x.acao === _filtros.historico.tipo);
    }

    // Garante ordem do mais recente para o mais antigo
    // Ordena usando id_log (maior = mais recente) como critério confiável
    base.sort((a, b) => (b.id_log || 0) - (a.id_log || 0));
    _visivel.historico = base;

    const pagina = _pag.historico;
    const limite = _cfg.itensPorPagina;
    const fatia  = paginar(base, pagina, limite);

    if (!fatia.length) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:24px;color:#94a3b8;">Nenhum registro encontrado.</td></tr>`;
        document.getElementById('paginacao-historico').innerHTML = '';
        return;
    }

    tbody.innerHTML = fatia.map(log => {
        const nomeUsuario = log.usuario_exibicao || log.usuario_banco || 'Sistema';
        const iniciais    = nomeUsuario.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
        const corIdx      = nomeUsuario.charCodeAt(0) % corAvatar.length;
        // Usa campos pré-formatados pelo banco (sem conversão de fuso)
        const dataStr = log.data_formatada || '—';
        const horaStr = log.hora_formatada || '—';
        const tabelaLabel = {
            Produto: 'Produto', Fornecedor: 'Fornecedor', Categoria: 'Categoria',
            Setor: 'Setor', Funcionario: 'Funcionário', Entrada: 'Entrada',
            Saida: 'Saída', Usuarios: 'Usuário',
        };

        return `<tr>
            <td class="data-hora">${dataStr} <span>${horaStr}</span></td>
            <td>
                <div class="usuario-nome">
                    <div class="avatar-sm ${corAvatar[corIdx]}">${iniciais}</div>
                    ${nomeUsuario}
                </div>
            </td>
            <td><span class="acao-badge ${acaoClass[log.acao] || 'info'}">
                <i class="fas ${icones[log.acao] || 'fa-circle'}"></i>
                ${acaoLabel[log.acao] || log.acao}
            </span></td>
            <td>${tabelaLabel[log.nome_tabela] || log.nome_tabela}</td>
            <td style="color:#64748b;font-size:13px;">ID: ${log.id_registro_afetado}</td>
            <td class="ip">—</td>
            <td>—</td>
        </tr>`;
    }).join('');

    renderPaginacao('paginacao-historico', base.length, pagina, limite, _mudarPaginaHistorico);
}

// Callback nomeado para a paginação — troca de página sem re-buscar dados
function _mudarPaginaHistorico(novaPagina) {
    _pag.historico = novaPagina;
    _renderizarHistorico();
}

async function carregarHistorico() {
    const tbody = document.getElementById('tabela-historico-body');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:24px;color:#64748b;">
        <i class="fas fa-spinner fa-spin"></i> Carregando...
    </td></tr>`;

    try {
        // Busca os 500 mais recentes (paginação feita no frontend)
        const res = await api.get('/historico?limite=500');
        _dados.historico = res.dados || [];
        _pag.historico   = 1;
        _renderizarHistorico();
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#dc2626;padding:24px;">${err.message}</td></tr>`;
    }
}


// ════════════════════════════════════════════════════════════
// CONTATOS — Telefones e Endereços (Fornecedores e Funcionários)
// ════════════════════════════════════════════════════════════

let _idContatoAtual  = null; // id do fornecedor ou funcionário sendo editado
let _tipoContatoAtual = null; // 'fornecedor' ou 'funcionario'

// ── Abas do modal de Fornecedor ──────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

    // Troca de abas — Fornecedor
    document.querySelectorAll('.forn-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.forn-tab-btn').forEach(b => {
                b.style.color = '#64748b';
                b.style.borderBottom = '2px solid transparent';
            });
            document.querySelectorAll('.forn-tab-painel').forEach(p => p.style.display = 'none');
            btn.style.color = '#2563eb';
            btn.style.borderBottom = '2px solid #2563eb';
            const painel = document.getElementById(btn.dataset.tab);
            if (painel) painel.style.display = 'block';
            // Carrega dados ao entrar na aba
            if (btn.dataset.tab === 'forn-telefones' && _idContatoAtual) carregarContatosForn(_idContatoAtual);
            if (btn.dataset.tab === 'forn-endereco'  && _idContatoAtual) carregarContatosForn(_idContatoAtual);
        });
    });

    // Troca de abas — Funcionário
    document.querySelectorAll('.func-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.func-tab-btn').forEach(b => {
                b.style.color = '#64748b';
                b.style.borderBottom = '2px solid transparent';
            });
            document.querySelectorAll('.func-tab-painel').forEach(p => p.style.display = 'none');
            btn.style.color = '#2563eb';
            btn.style.borderBottom = '2px solid #2563eb';
            const painel = document.getElementById(btn.dataset.tab);
            if (painel) painel.style.display = 'block';
            if (btn.dataset.tab === 'func-telefones' && _idContatoAtual) carregarContatosFunc(_idContatoAtual);
            if (btn.dataset.tab === 'func-endereco'  && _idContatoAtual) carregarContatosFunc(_idContatoAtual);
        });
    });

    // Form endereço fornecedor
    document.getElementById('form-end-forn')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!_idContatoAtual) return;
        try {
            await api.post(`/fornecedores/${_idContatoAtual}/enderecos`, {
                id_end_forn: document.getElementById('end-forn-id').value || 0,
                rua:    document.getElementById('end-forn-rua').value,
                numero: document.getElementById('end-forn-numero').value,
                cep:    document.getElementById('end-forn-cep').value,
                cidade: document.getElementById('end-forn-cidade').value,
            });
            toast('Endereço salvo!');
            await carregarContatosForn(_idContatoAtual);
        } catch (err) { toast(err.message, 'error'); }
    });

    // Form endereço funcionário
    document.getElementById('form-end-func')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!_idContatoAtual) return;
        try {
            await api.post(`/funcionarios/${_idContatoAtual}/enderecos`, {
                id_end_fun: document.getElementById('end-func-id').value || 0,
                rua:    document.getElementById('end-func-rua').value,
                numero: document.getElementById('end-func-numero').value,
                cep:    document.getElementById('end-func-cep').value,
                cidade: document.getElementById('end-func-cidade').value,
            });
            toast('Endereço salvo!');
            await carregarContatosFunc(_idContatoAtual);
        } catch (err) { toast(err.message, 'error'); }
    });
});

// ── Abre modal com abas desbloqueadas (somente no edit) ──────
function abrirModalContatosForn(id) {
    _idContatoAtual = id;
    // Desbloqueia as abas
    document.getElementById('btn-tab-telefones')?.removeAttribute('disabled');
    document.getElementById('btn-tab-endereco-forn')?.removeAttribute('disabled');
    document.querySelectorAll('.forn-tab-btn, .func-tab-btn').forEach(b => {
        b.style.opacity = '1';
        b.style.cursor  = 'pointer';
    });
}

function abrirModalContatosFunc(id) {
    _idContatoAtual = id;
    document.getElementById('btn-tab-telefones-func')?.removeAttribute('disabled');
    document.getElementById('btn-tab-endereco-func')?.removeAttribute('disabled');
}

// ── Carregar contatos do Fornecedor ──────────────────────────
async function carregarContatosForn(id) {
    try {
        const dados = await api.get(`/fornecedores/${id}/contatos`);
        renderizarTelefones('lista-tel-forn', dados.telefones, 'fornecedor', id);
        preencherEndereco('forn', dados.enderecos[0]);
    } catch (err) { console.error(err); }
}

// ── Carregar contatos do Funcionário ─────────────────────────
async function carregarContatosFunc(id) {
    try {
        const dados = await api.get(`/funcionarios/${id}/contatos`);
        renderizarTelefones('lista-tel-func', dados.telefones, 'funcionario', id);
        preencherEndereco('func', dados.enderecos[0]);
    } catch (err) { console.error(err); }
}

// ── Renderiza lista de telefones ─────────────────────────────
function renderizarTelefones(containerId, telefones, tipo, entityId) {
    const lista = document.getElementById(containerId);
    if (!lista) return;
    if (!telefones.length) {
        lista.innerHTML = '<p style="color:#94a3b8;font-size:13px;text-align:center;">Nenhum telefone cadastrado.</p>';
        return;
    }
    const campo  = tipo === 'fornecedor' ? 'id_telefone_for' : 'id_telefone_fun';
    const rota   = tipo === 'fornecedor' ? 'fornecedores' : 'funcionarios';
    lista.innerHTML = telefones.map(t => `
        <div style="display:flex;align-items:center;justify-content:space-between;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px 14px;">
            <span style="font-size:14px;color:#334155;"><i class="fas fa-phone" style="color:#2563eb;margin-right:8px;"></i>${t.telefone}</span>
            <button type="button" onclick="deletarTelefone('${rota}', ${entityId}, ${t[campo]})"
                style="background:#fee2e2;color:#dc2626;border:none;padding:5px 10px;border-radius:6px;cursor:pointer;font-size:12px;font-family:Poppins,sans-serif;">
                <i class="fas fa-trash"></i>
            </button>
        </div>`).join('');
}

// ── Preenche form de endereço ─────────────────────────────────
function preencherEndereco(prefixo, endereco) {
    const idField  = prefixo === 'forn' ? 'end-forn-id'     : 'end-func-id';
    const ruaField = prefixo === 'forn' ? 'end-forn-rua'    : 'end-func-rua';
    const numField = prefixo === 'forn' ? 'end-forn-numero' : 'end-func-numero';
    const cepField = prefixo === 'forn' ? 'end-forn-cep'    : 'end-func-cep';
    const cidField = prefixo === 'forn' ? 'end-forn-cidade' : 'end-func-cidade';

    const el = (id) => document.getElementById(id);
    if (endereco) {
        const idKey = prefixo === 'forn' ? 'id_end_forn' : 'id_end_fun';
        if (el(idField))  el(idField).value  = endereco[idKey] || '';
        if (el(ruaField)) el(ruaField).value = endereco.rua    || '';
        if (el(numField)) el(numField).value = endereco.numero || '';
        if (el(cepField)) el(cepField).value = endereco.cep    || '';
        if (el(cidField)) el(cidField).value = endereco.cidade || '';
    } else {
        [idField,ruaField,numField,cepField,cidField].forEach(f => { if(el(f)) el(f).value = ''; });
    }
}

// ── Adicionar telefone — Fornecedor ──────────────────────────
async function adicionarTelefoneForn() {
    const input = document.getElementById('novo-tel-forn');
    if (!input?.value || !_idContatoAtual) return;
    try {
        await api.post(`/fornecedores/${_idContatoAtual}/telefones`, { telefone: input.value });
        input.value = '';
        toast('Telefone adicionado!');
        await carregarContatosForn(_idContatoAtual);
    } catch (err) { toast(err.message, 'error'); }
}

// ── Adicionar telefone — Funcionário ─────────────────────────
async function adicionarTelefoneFunc() {
    const input = document.getElementById('novo-tel-func');
    if (!input?.value || !_idContatoAtual) return;
    try {
        await api.post(`/funcionarios/${_idContatoAtual}/telefones`, { telefone: input.value });
        input.value = '';
        toast('Telefone adicionado!');
        await carregarContatosFunc(_idContatoAtual);
    } catch (err) { toast(err.message, 'error'); }
}

// ── Deletar telefone (genérico) ──────────────────────────────
async function deletarTelefone(rota, entityId, telId) {
    try {
        await api.delete(`/${rota}/${entityId}/telefones/${telId}`);
        toast('Telefone removido!');
        if (rota === 'fornecedores') await carregarContatosForn(entityId);
        else                         await carregarContatosFunc(entityId);
    } catch (err) { toast(err.message, 'error'); }
}
