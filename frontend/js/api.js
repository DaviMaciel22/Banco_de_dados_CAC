// frontend/js/api.js
// Cliente HTTP centralizado — injeta o token JWT em todas as requisições automaticamente

const API_URL = 'https://backend-cac-d3h8baa6f8age8f3.centralus-01.azurewebsites.net/api';

const api = {

    // Monta os headers com Authorization se houver token salvo
    _headers() {
        const token = localStorage.getItem('cac_token');
        return {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        };
    },

    // Trata a resposta: se 401, desloga e redireciona pro login
    async _handleResponse(response) {
        if (response.status === 401) {
            localStorage.removeItem('cac_token');
            localStorage.removeItem('cac_usuario');
            window.location.href = 'login.html';
            return;
        }

        const data = await response.json();

        if (!response.ok) {
            // Lança o erro com a mensagem do backend para o catch capturar
            throw new Error(data.error || 'Erro desconhecido na API.');
        }

        return data;
    },

    async get(endpoint) {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'GET',
            headers: this._headers(),
        });
        return this._handleResponse(response);
    },

    async post(endpoint, body) {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: this._headers(),
            body: JSON.stringify(body),
        });
        return this._handleResponse(response);
    },

    async put(endpoint, body) {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'PUT',
            headers: this._headers(),
            body: JSON.stringify(body),
        });
        return this._handleResponse(response);
    },

    async delete(endpoint) {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'DELETE',
            headers: this._headers(),
        });
        return this._handleResponse(response);
    },
};
