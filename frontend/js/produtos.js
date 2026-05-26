// js/produtos.js
const API_URL = 'http://localhost:3000/api/produtos';

document.addEventListener('DOMContentLoaded', () => {
    carregarProdutos();
    
    const formProduto = document.getElementById('formProduto');
    if (formProduto) {
        formProduto.addEventListener('submit', salvarProduto);
    }
});

// 1. LISTAR PRODUTOS (GET)
async function carregarProdutos() {
    try {
        const response = await fetch(API_URL);
        const produtos = await response.json();
        
        const tbody = document.querySelector('#tabelaProdutos tbody');
        tbody.innerHTML = ''; 

        produtos.forEach(prod => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${prod.id_produto}</td>
                <td>${prod.nome}</td>
                <td>R$ ${prod.preco_compra.toFixed(2)}</td>
                <td>${prod.quantidade_estoque}</td>
                <td><span class="badge ${prod.status1 === 'Ativo' ? 'bg-success' : 'bg-danger'}">${prod.status1}</span></td>
                <td>
                    <button onclick="editarProduto(${prod.id_produto}, '${prod.nome}', ${prod.preco_compra}, ${prod.quantidade_estoque}, ${prod.fkcategoria}, '${prod.descricao}')" class="btn-editar">Editar</button>
                    <button onclick="deletarProduto(${prod.id_produto})" class="btn-excluir">Excluir</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        alert('Erro ao carregar a lista de produtos da base de dados.');
    }
}

// 2. SALVAR OU ATUALIZAR (POST / PUT)
async function salvarProduto(event) {
    event.preventDefault(); // Evita recarregar a tela

    // Captura dados do modal (Certifique-se de que os IDs batem com seu HTML)
    const id = document.getElementById('produtoId').value;
    const produto = {
        nome: document.getElementById('nomeProduto').value,
        preco_compra: parseFloat(document.getElementById('precoProduto').value),
        quantidade_estoque: parseInt(document.getElementById('estoqueProduto').value),
        fkcategoria: parseInt(document.getElementById('categoriaProduto').value) || 1,
        descricao: document.getElementById('descricaoProduto').value,
        status1: 'Ativo'
    };

    const metodo = id ? 'PUT' : 'POST';
    const url = id ? `${API_URL}/${id}` : API_URL;

    try {
        const response = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(produto)
        });

        const data = await response.json();
        if (response.ok) {
            alert(data.message || 'Salvo com sucesso!');
            fecharModal(); // Função do seu front para fechar o modal
            carregarProdutos(); // Atualiza a tabela
        } else {
            alert('Erro: ' + data.error);
        }
    } catch (error) {
        console.error('Erro ao salvar:', error);
    }
}

// 3. PREPARAR EDIÇÃO
function editarProduto(id, nome, preco, estoque, categoria, descricao) {
    document.getElementById('produtoId').value = id;
    document.getElementById('nomeProduto').value = nome;
    document.getElementById('precoProduto').value = preco;
    document.getElementById('estoqueProduto').value = estoque;
    document.getElementById('categoriaProduto').value = categoria;
    document.getElementById('descricaoProduto').value = descricao;
    
    abrirModal(); // Função do seu front para abrir o modal
}

// 4. DELETAR (DELETE)
async function deletarProduto(id) {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
        try {
            const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
            const data = await response.json();
            
            if (response.ok) {
                alert('Produto excluído com sucesso!');
                carregarProdutos();
            } else {
                alert('Erro: ' + data.error);
            }
        } catch (error) {
            console.error('Erro ao excluir:', error);
        }
    }
}