// frontend/js/configuracoes.js
// Lógica completa da página de Configurações (5 abas)

document.addEventListener('DOMContentLoaded', () => {
    iniciarAbas();
    carregarConfiguracoes();
    carregarDadosSeguranca();
    initPerfil(); // carrega perfil ao abrir a página de configurações
    carregarUsuarios();
    iniciarEventos();
});

// ════════════════════════════════════════════════════════════
// ABAS — troca de painéis
// ════════════════════════════════════════════════════════════

function iniciarAbas() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const paineis = document.querySelectorAll('.config-painel');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            paineis.forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('tab-' + btn.dataset.tab)?.classList.add('active');
            // Recarrega perfil ao entrar na aba segurança
            if (btn.dataset.tab === 'seguranca') initPerfil();
        });
    });
}

// ════════════════════════════════════════════════════════════
// CARREGAR configurações do banco e preencher campos
// ════════════════════════════════════════════════════════════

async function carregarConfiguracoes() {
    try {
        const cfg = await api.get('/configuracoes');

        // Aba Empresa
        setValue('razao-social',    cfg.empresa_razao_social);
        setValue('cnpj',            cfg.empresa_cnpj);
        setValue('email-empresa',   cfg.empresa_email);
        setValue('telefone-empresa',cfg.empresa_telefone);
        setValue('endereco',        cfg.empresa_endereco);

        // Aba Sistema
        setValue('estoque-minimo',  cfg.sistema_estoque_minimo);
        setValue('moeda-padrao',    cfg.sistema_moeda);
        setValue('itens-pagina',    cfg.sistema_itens_pagina);

        // Aba Notificações
        setCheck('notif-estoque',   cfg.notif_estoque_critico === '1');
        setCheck('notif-entradas',  cfg.notif_entradas_pend   === '1');
        setCheck('notif-cadastros', cfg.notif_novos_cadastros === '1');
        setCheck('notif-relatorios',cfg.notif_relatorios_auto === '1');

    } catch (err) {
        console.error('Erro ao carregar configurações:', err.message);
    }
}

function setValue(id, val) {
    const el = document.getElementById(id);
    if (el && val !== undefined) el.value = val;
}

function setCheck(id, checked) {
    const el = document.getElementById(id);
    if (el) el.checked = checked;
}

// ════════════════════════════════════════════════════════════
// SALVAR — cada aba tem seu próprio botão
// ════════════════════════════════════════════════════════════

async function salvarEmpresa() {
    await salvar({
        empresa_razao_social:  getVal('razao-social'),
        empresa_cnpj:          getVal('cnpj'),
        empresa_email:         getVal('email-empresa'),
        empresa_telefone:      getVal('telefone-empresa'),
        empresa_endereco:      getVal('endereco'),
    }, 'btn-salvar-empresa');
}

async function salvarSistema() {
    await salvar({
        sistema_estoque_minimo: getVal('estoque-minimo'),
        sistema_moeda:          getVal('moeda-padrao'),
        sistema_itens_pagina:   getVal('itens-pagina'),
    }, 'btn-salvar-sistema');
}

async function salvarNotificacoes() {
    await salvar({
        notif_estoque_critico: document.getElementById('notif-estoque')?.checked   ? '1' : '0',
        notif_entradas_pend:   document.getElementById('notif-entradas')?.checked  ? '1' : '0',
        notif_novos_cadastros: document.getElementById('notif-cadastros')?.checked ? '1' : '0',
        notif_relatorios_auto: document.getElementById('notif-relatorios')?.checked? '1' : '0',
    }, 'btn-salvar-notif');
}

async function salvar(payload, btnId) {
    const btn = document.getElementById(btnId);
    const textoOriginal = btn?.innerHTML;

    try {
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
        }

        await api.put('/configuracoes', payload);
        toast('Configurações salvas com sucesso!', 'success');

    } catch (err) {
        toast(err.message, 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = textoOriginal;
        }
    }
}

function getVal(id) {
    return document.getElementById(id)?.value || '';
}

// ════════════════════════════════════════════════════════════
// ABA SEGURANÇA — dados do usuário logado + alterar senha
// ════════════════════════════════════════════════════════════

async function carregarDadosSeguranca() {
    try {
        const usuario = await api.get('/auth/me');

        // Preenche o card de sessão atual
        const nome = document.getElementById('sessao-nome');
        const info = document.getElementById('sessao-info');
        if (nome) nome.textContent = `${usuario.nome} — ${usuario.perfil}`;
        if (info) info.textContent = `${usuario.email} · Último login: ${formatarDataHora(usuario.ultimo_login)}`;

        // Preenche o nome na topbar
        document.querySelectorAll('.topbar-user span').forEach(s => s.textContent = usuario.nome);

    } catch (err) {
        console.error('Erro ao carregar dados de segurança:', err.message);
    }
}

async function alterarSenha() {
    const senhaAtual    = document.getElementById('senha-atual')?.value;
    const novaSenha     = document.getElementById('nova-senha')?.value;
    const confirmar     = document.getElementById('confirmar-senha')?.value;
    const btn           = document.getElementById('btn-alterar-senha');

    if (!senhaAtual || !novaSenha || !confirmar) {
        return toast('Preencha todos os campos de senha.', 'warning');
    }
    if (novaSenha !== confirmar) {
        return toast('A nova senha e a confirmação não coincidem.', 'warning');
    }
    if (novaSenha.length < 6) {
        return toast('A nova senha deve ter pelo menos 6 caracteres.', 'warning');
    }

    const textoOriginal = btn?.innerHTML;
    try {
        if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...'; }

        await api.put('/auth/alterar-senha', { senhaAtual, novaSenha });
        toast('Senha alterada com sucesso!', 'success');

        // Limpa os campos
        document.getElementById('senha-atual').value   = '';
        document.getElementById('nova-senha').value    = '';
        document.getElementById('confirmar-senha').value = '';
        atualizarForcaSenha('');

    } catch (err) {
        toast(err.message, 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = textoOriginal; }
    }
}

// Barra de força da senha
function atualizarForcaSenha(senha) {
    const wrap = document.getElementById('forca-senha-wrap');
    if (!wrap) return;

    if (!senha) { wrap.style.display = 'none'; return; }
    wrap.style.display = 'block';

    let forca = 0;
    if (senha.length >= 6)  forca++;
    if (senha.length >= 10) forca++;
    if (/[A-Z]/.test(senha) && /[0-9]/.test(senha)) forca++;
    if (/[^A-Za-z0-9]/.test(senha)) forca++;

    const cores  = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981'];
    const labels = ['Fraca', 'Razoável', 'Boa', 'Forte'];
    const barras = [1, 2, 3, 4];

    barras.forEach(n => {
        const bar = document.getElementById(`forca-${n}`);
        if (bar) bar.style.background = n <= forca ? cores[forca - 1] : '#e2e8f0';
    });

    const label = document.getElementById('forca-label');
    if (label) label.textContent = `Força: ${labels[forca - 1] || 'Muito fraca'}`;
}

// ════════════════════════════════════════════════════════════
// ABA USUÁRIOS — listar, criar, editar, excluir
// ════════════════════════════════════════════════════════════

let _usuarioEditandoId = null;

async function carregarUsuarios() {
    const tbody = document.getElementById('tabela-usuarios-body');
    if (!tbody) return;

    try {
        const usuarios = await api.get('/usuarios');
        const perfilClass = { admin: 'admin', gestor: 'gestor', operador: 'operador' };
        const perfilLabel = { admin: 'Administrador', gestor: 'Gestor', operador: 'Operador' };
        const cores = ['azul', 'verde', 'laranja'];
        const iniciais = nome => nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

        tbody.innerHTML = usuarios.map((u, i) => `
            <tr>
                <td>${u.id_usuario}</td>
                <td>
                    <div class="usuario-nome">
                        <div class="avatar-sm ${cores[i % 3]}">${iniciais(u.nome)}</div>
                        ${u.nome}
                    </div>
                </td>
                <td>${u.email}</td>
                <td><span class="perfil-badge ${perfilClass[u.perfil] || 'operador'}">${perfilLabel[u.perfil] || u.perfil}</span></td>
                <td>${formatarDataHora(u.ultimo_login)}</td>
                <td><span class="badge ${u.ativo ? 'ativo' : 'inativo'}">${u.ativo ? 'Ativo' : 'Inativo'}</span></td>
                <td class="acoes">
                    <button class="btn-acao editar" data-id="${u.id_usuario}" title="Editar"><i class="fas fa-edit"></i></button>
                    <button class="btn-acao deletar" data-id="${u.id_usuario}" data-nome="${u.nome}" title="Desativar"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('') || `<tr><td colspan="7" style="text-align:center;padding:20px">Nenhum usuário encontrado.</td></tr>`;

        // Botão editar
        tbody.querySelectorAll('.btn-acao.editar').forEach(btn => {
            btn.addEventListener('click', () => {
                const u = usuarios.find(x => x.id_usuario == btn.dataset.id);
                if (!u) return;
                _usuarioEditandoId = u.id_usuario;
                document.getElementById('modal-titulo-usuario').textContent = 'Editar Usuário';
                document.getElementById('usuario-nome').value   = u.nome;
                document.getElementById('usuario-email').value  = u.email;
                document.getElementById('usuario-perfil').value = u.perfil;

                // Campo senha fica opcional na edição
                const senhaWrap = document.getElementById('campo-senha-wrap');
                const senhaHint = document.getElementById('senha-hint');
                if (senhaWrap) {
                    senhaHint.textContent = '(deixe em branco para não alterar)';
                    document.getElementById('usuario-senha').required = false;
                }
                document.getElementById('modal-usuario').style.display = 'flex';
            });
        });

        // Botão deletar
        tbody.querySelectorAll('.btn-acao.deletar').forEach(btn => {
            btn.addEventListener('click', () => {
                confirmarExclusao(btn.dataset.nome, async () => {
                    try {
                        await api.delete(`/usuarios/${btn.dataset.id}`);
                        toast('Usuário desativado!', 'success');
                        await carregarUsuarios();
                    } catch (err) { toast(err.message, 'error'); }
                });
            });
        });

    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#dc2626;padding:20px">${err.message}</td></tr>`;
    }
}

// ════════════════════════════════════════════════════════════
// EVENTOS — wiring de todos os botões
// ════════════════════════════════════════════════════════════

function iniciarEventos() {
    // Salvar cada aba
    document.getElementById('btn-salvar-empresa')?.addEventListener('click', salvarEmpresa);
    document.getElementById('btn-salvar-sistema')?.addEventListener('click', salvarSistema);
    document.getElementById('btn-salvar-notif')?.addEventListener('click',   salvarNotificacoes);
    document.getElementById('btn-alterar-senha')?.addEventListener('click',  alterarSenha);

    // Barra de força da senha
    document.getElementById('nova-senha')?.addEventListener('input', e => atualizarForcaSenha(e.target.value));

    // Novo usuário
    document.getElementById('btn-novo-usuario')?.addEventListener('click', () => {
        _usuarioEditandoId = null;
        document.getElementById('form-usuario')?.reset();
        document.getElementById('modal-titulo-usuario').textContent = 'Novo Usuário';
        const senhaHint = document.getElementById('senha-hint');
        if (senhaHint) senhaHint.textContent = '(mín. 6 caracteres)';
        document.getElementById('usuario-senha').required = true;
        document.getElementById('modal-usuario').style.display = 'flex';
    });

    // Fechar modal usuário
    document.getElementById('btn-fechar-modal-usuario')?.addEventListener('click', () => {
        document.getElementById('modal-usuario').style.display = 'none';
    });

    // Submit form usuário
    document.getElementById('form-usuario')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nome   = document.getElementById('usuario-nome').value;
        const email  = document.getElementById('usuario-email').value;
        const senha  = document.getElementById('usuario-senha').value;
        const perfil = document.getElementById('usuario-perfil').value;

        try {
            if (_usuarioEditandoId) {
                const payload = { nome, email, perfil };
                if (senha) payload.senha = senha; // só envia se preenchido
                await api.put(`/usuarios/${_usuarioEditandoId}`, payload);
                toast('Usuário atualizado!', 'success');
            } else {
                if (!senha || senha.length < 6) {
                    return toast('A senha deve ter pelo menos 6 caracteres.', 'warning');
                }
                await api.post('/usuarios', { nome, email, senha, perfil });
                toast('Usuário criado com sucesso!', 'success');
            }
            document.getElementById('modal-usuario').style.display = 'none';
            await carregarUsuarios();
        } catch (err) { toast(err.message, 'error'); }
    });
}

// ════════════════════════════════════════════════════════════
// UTILITÁRIO
// ════════════════════════════════════════════════════════════

function formatarDataHora(iso) {
    if (!iso) return 'Nunca';
    return new Date(iso).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}


// ── Carrega e salva perfil do usuário logado ─────────────────
async function initPerfil() {
    try {
        const user = await api.get('/auth/me');

        const iniciais = (user.nome || '?').split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase();
        const avatar   = document.getElementById('perfil-avatar');
        const nomeDisp = document.getElementById('perfil-nome-display');
        const emailDisp= document.getElementById('perfil-email-display');
        const badge    = document.getElementById('perfil-role-badge');
        const nomeInput  = document.getElementById('perfil-nome');
        const emailInput = document.getElementById('perfil-email');

        if (avatar)    avatar.textContent   = iniciais;
        if (nomeDisp)  nomeDisp.textContent  = user.nome  || '—';
        if (emailDisp) emailDisp.textContent = user.email || '—';
        if (badge)     badge.textContent     = user.perfil || '';
        if (nomeInput)  nomeInput.value  = user.nome  || '';
        if (emailInput) emailInput.value = user.email || '';
    } catch (e) { console.error('Erro ao carregar perfil:', e); }
}

document.getElementById('btn-salvar-perfil')?.addEventListener('click', async () => {
    const nome  = document.getElementById('perfil-nome')?.value?.trim();
    const email = document.getElementById('perfil-email')?.value?.trim();
    const msg   = document.getElementById('perfil-msg');
    const btn   = document.getElementById('btn-salvar-perfil');

    if (!nome || !email) {
        if (msg) { msg.textContent = '⚠️ Preencha nome e e-mail.'; msg.style.color = '#f59e0b'; msg.style.display = 'inline'; }
        return;
    }

    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...'; }

    try {
        await api.put('/auth/perfil', { nome, email });

        // Atualiza o display do avatar
        const iniciais = nome.split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase();
        const avatar   = document.getElementById('perfil-avatar');
        if (avatar) avatar.textContent = iniciais;
        document.getElementById('perfil-nome-display').textContent  = nome;
        document.getElementById('perfil-email-display').textContent = email;

        // Atualiza nome na topbar se existir
        const topbarUser = document.querySelector('.topbar-user span');
        if (topbarUser) topbarUser.textContent = nome;

        if (msg) { msg.textContent = '✅ Perfil salvo!'; msg.style.color = '#10b981'; msg.style.display = 'inline'; setTimeout(() => { msg.style.display = 'none'; }, 3000); }
    } catch (err) {
        if (msg) { msg.textContent = '❌ ' + err.message; msg.style.color = '#ef4444'; msg.style.display = 'inline'; }
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Salvar Perfil'; }
    }
});

