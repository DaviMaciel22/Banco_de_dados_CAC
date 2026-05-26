const menuToggle = document.getElementById("menu-toggle");
const sidebar = document.getElementById("sidebar");
const main = document.querySelector(".main");
const topbar = document.querySelector(".topbar");

menuToggle.addEventListener("click", () => {

    // ESCONDE/MOSTRA SIDEBAR
    sidebar.classList.toggle("hidden");

    // EXPANDE MAIN
    main.classList.toggle("expanded");

    // MOVE TOPBAR
    topbar.classList.toggle("expanded");

});

const reportButtons = document.querySelectorAll(".btn-rel[data-relatorio]");
const modalOverlay = document.getElementById("reportModal");
const modalClose = document.getElementById("modalClose");
const modalCloseBtn = document.getElementById("modalCloseBtn");
const modalTitle = document.getElementById("modalTitle");
const modalBody = document.getElementById("modalBody");

const reportDetails = {
    "Relatório de Consumo e Custos por Setor": `
        <h3>Relatório de Consumo e Custos por Setor</h3>
        <p>Quantidade e valor dos produtos consumidos por cada setor da organização.</p>
        <p>Dados:</p>
        <ul>
            <li>Setor Administrativo: 320 unidades consumidas, R$ 18.450,00</li>
            <li>Setor Operacional: 520 unidades consumidas, R$ 34.120,00</li>
            <li>Setor Comercial: 210 unidades consumidas, R$ 12.750,00</li>
        </ul>
    `,
    "Extrato de Movimentação de Estoque": `
        <h3>Extrato de Movimentação de Estoque</h3>
        <p>Ficha detalhada do produto com todas as entradas e saídas de estoque.</p>
        <p>Dados:</p>
        <ul>
            <li>Produto A: 150 unidades compradas, 110 unidades saídas, saldo 40</li>
            <li>Produto B: 80 unidades compradas, 65 unidades saídas, saldo 15</li>
            <li>Produto C: 200 unidades compradas, 190 unidades saídas, saldo 10</li>
        </ul>
    `,
    "Catálogo e Mapeamento de Fornecedores por Item": `
        <h3>Catálogo e Mapeamento de Fornecedores por Item</h3>
        <p>Lista de fornecedores que atendem cada produto.</p>
        <p>Dados:</p>
        <ul>
            <li>Produto A: Fornecedor Alfa, Fornecedor Beta</li>
            <li>Produto B: Fornecedor Delta</li>
            <li>Produto C: Fornecedor Alfa, Fornecedor Gama</li>
        </ul>
    `,
    "Relatório de Ruptura de Estoque (Itens Zerados)": `
        <h3>Relatório de Ruptura de Estoque (Itens Zerados)</h3>
        <p>Produtos em falta com necessidade de compra imediata.</p>
        <p>Dados:</p>
        <ul>
            <li>Produto D: 0 unidades em estoque, necessidade de 75 unidades</li>
            <li>Produto E: 0 unidades em estoque, necessidade de 40 unidades</li>
            <li>Produto F: 0 unidades em estoque, necessidade de 25 unidades</li>
        </ul>
    `,
    "Análise de Menor Preço e Fornecedor Ideal": `
        <h3>Análise de Menor Preço e Fornecedor Ideal</h3>
        <p>Fornecedores e valor do menor preço de compra do produto.</p>
        <p>Dados:</p>
        <ul>
            <li>Produto A: menor preço R$ 8,25 (Fornecedor Alfa)</li>
            <li>Produto B: menor preço R$ 16,80 (Fornecedor Delta)</li>
            <li>Produto C: menor preço R$ 5,45 (Fornecedor Gama)</li>
        </ul>
    `,
};

const openModal = (title, bodyText) => {
    modalTitle.textContent = title;
    modalBody.innerHTML = bodyText;
    modalOverlay.classList.add("open");
    modalOverlay.setAttribute("aria-hidden", "false");
};

const closeModal = () => {
    modalOverlay.classList.remove("open");
    modalOverlay.setAttribute("aria-hidden", "true");
};

reportButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const reportName = button.dataset.relatorio;
        const details = reportDetails[reportName] || "Detalhes do relatório não disponíveis.";
        openModal(reportName, details);
    });
});

modalClose.addEventListener("click", closeModal);
modalCloseBtn.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", (event) => {
    if (event.target === modalOverlay) {
        closeModal();
    }
});
