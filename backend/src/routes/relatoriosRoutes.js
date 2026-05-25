// src/routes/relatoriosRoutes.js
const { Router } = require('express');
const ctrl = require('../controllers/relatoriosController');
const router = Router();

router.get('/consumo-setor',      ctrl.consumoPorSetor);
router.get('/ficha-produto/:id',  ctrl.fichaProduto);
router.get('/fornecedores-produto', ctrl.fornecedoresProduto);
router.get('/produtos-em-falta',  ctrl.produtosEmFalta);
router.get('/menor-preco',        ctrl.menorPrecoFornecedor);
router.get('/ultimas-compras',    ctrl.ultimasCompras);
router.get('/setores-por-grupo',  ctrl.setoresPorGrupo);

module.exports = router;
