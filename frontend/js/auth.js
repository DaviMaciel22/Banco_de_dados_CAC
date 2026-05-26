// frontend/js/auth.js
// Gerencia login, logout e proteção de páginas

const Auth = {

    // Chama no topo de TODAS as páginas protegidas (não no login.html)
    // Se não houver token, redireciona pro login
    proteger() {
        const token = localStorage.getItem('cac_token');
        if (!token) {
            window.location.href = 'login.html';
        }
    },

    // Retorna os dados do usuário logado
    getUsuario() {
        const raw = localStorage.getItem('cac_usuario');
        return raw ? JSON.parse(raw) : null;
    },

    // Preenche o nome do usuário na topbar de qualquer página
    preencherTopbar() {
        const usuario = this.getUsuario();
        if (!usuario) return;

        const spans = document.querySelectorAll('.topbar-user span');
        spans.forEach(span => {
            span.textContent = usuario.nome;
        });
    },

    // Faz logout: limpa storage e vai pro login
    logout() {
        localStorage.removeItem('cac_token');
        localStorage.removeItem('cac_usuario');
        window.location.href = 'login.html';
    },
};

// Configura o botão "Sair" em qualquer página automaticamente
document.addEventListener('DOMContentLoaded', () => {
    // Proteção de rota: se não for login.html, verifica o token
    if (!window.location.pathname.endsWith('login.html')) {
        Auth.proteger();
        Auth.preencherTopbar();
    }

    // Vincula todos os links "Sair" da sidebar ao logout
    document.querySelectorAll('a[href="#"]').forEach(link => {
        if (link.textContent.trim().includes('Sair')) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                Auth.logout();
            });
        }
    });
});
