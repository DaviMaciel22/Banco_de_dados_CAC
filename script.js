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