// src/routes/contatosRoutes.js
const { Router } = require('express');
const ctrl = require('../controllers/contatosController');
const router = Router({ mergeParams: true });

// Fornecedores
router.get   ('/fornecedores/:id/contatos',              ctrl.getContatosFornecedor);
router.post  ('/fornecedores/:id/telefones',             ctrl.addTelefoneFornecedor);
router.delete('/fornecedores/:id/telefones/:idTel',      ctrl.deleteTelefoneFornecedor);
router.post  ('/fornecedores/:id/enderecos',             ctrl.saveEnderecoFornecedor);
router.delete('/fornecedores/:id/enderecos/:idEnd',      ctrl.deleteEnderecoFornecedor);

// Funcionarios
router.get   ('/funcionarios/:id/contatos',              ctrl.getContatosFuncionario);
router.post  ('/funcionarios/:id/telefones',             ctrl.addTelefoneFuncionario);
router.delete('/funcionarios/:id/telefones/:idTel',      ctrl.deleteTelefoneFuncionario);
router.post  ('/funcionarios/:id/enderecos',             ctrl.saveEnderecoFuncionario);
router.delete('/funcionarios/:id/enderecos/:idEnd',      ctrl.deleteEnderecoFuncionario);

module.exports = router;
