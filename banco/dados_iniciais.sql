-- ============================================================
-- CAC LTDA — DADOS INICIAIS
-- Execute por último, após todos os outros scripts
-- ============================================================
USE banco_cac;
GO

-- ============================================================
-- USUÁRIO ADMINISTRADOR PADRÃO
-- Senha: Admin@123
-- Hash bcrypt gerado com saltRounds = 10
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM Usuarios WHERE email = 'admin@cac.com')
BEGIN
    INSERT INTO Usuarios (nome, email, senha, perfil, ativo)
    VALUES (
        'Administrador',
        'admin@cac.com',
        '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        'admin',
        1
    );
    PRINT '✅ Usuário admin criado: admin@cac.com / Admin@123';
END
ELSE
    PRINT 'ℹ️  Usuário admin já existe.';
GO

-- ============================================================
-- CONFIGURAÇÕES PADRÃO DO SISTEMA
-- ============================================================
-- Empresa
MERGE Configuracoes AS t
USING (VALUES
    ('empresa_nome',          'CAC LTDA',             'Nome da empresa'),
    ('empresa_cnpj',          '',                     'CNPJ da empresa'),
    ('empresa_email',         '',                     'E-mail da empresa'),
    ('empresa_telefone',      '',                     'Telefone da empresa'),
    -- Sistema
    ('sistema_estoque_minimo','20',                   'Valor padrão de estoque mínimo para novos produtos'),
    ('sistema_itens_pagina',  '20',                   'Quantidade de itens por página nas tabelas'),
    ('sistema_tema',          'claro',                'Tema da interface'),
    -- Notificações
    ('notif_estoque_critico', '1',                    'Ativar alertas de estoque mínimo (1=sim, 0=não)'),
    ('notif_email',           '0',                    'Enviar alertas por e-mail (1=sim, 0=não)'),
    ('notif_email_destino',   '',                     'E-mail para receber alertas'),
    -- Segurança
    ('seg_tempo_sessao',      '8',                    'Tempo de sessão em horas'),
    ('seg_tentativas_login',  '5',                    'Máximo de tentativas de login')
) AS s(chave, valor, descricao)
ON t.chave = s.chave
WHEN MATCHED THEN
    UPDATE SET t.descricao = s.descricao
WHEN NOT MATCHED THEN
    INSERT (chave, valor, descricao) VALUES (s.chave, s.valor, s.descricao);
GO

PRINT '✅ Configurações padrão inseridas/atualizadas.';
GO

-- ============================================================
-- RESUMO FINAL
-- ============================================================
PRINT '';
PRINT '════════════════════════════════════════════════════════';
PRINT '✅ BANCO CAC LTDA CRIADO COM SUCESSO!';
PRINT '';
PRINT '   Acesso inicial:';
PRINT '   E-mail : admin@cac.com';
PRINT '   Senha  : Admin@123';
PRINT '';
PRINT '   ⚠️  Troque a senha no primeiro acesso em:';
PRINT '   Configurações → Segurança → Alterar Senha';
PRINT '════════════════════════════════════════════════════════';
GO

SELECT 'Tabelas' AS tipo, COUNT(*) AS quantidade
FROM sys.tables WHERE type = 'U'
UNION ALL
SELECT 'Views',      COUNT(*) FROM sys.views
UNION ALL
SELECT 'Procedures', COUNT(*) FROM sys.procedures WHERE type = 'P'
UNION ALL
SELECT 'Triggers',   COUNT(*) FROM sys.triggers;
GO
