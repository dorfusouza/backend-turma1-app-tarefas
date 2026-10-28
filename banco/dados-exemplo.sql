-- Dados de exemplo para o app boneco. APAGA as duas tabelas e recarrega (pode rodar de novo à vontade).
-- No SSMS: abra este arquivo e execute tudo (F5).
USE demo_tarefas;

-- TRUNCATE não funciona em tabela que outra tabela aponta (chave estrangeira): usamos DELETE, a tarefa primeiro.
DELETE FROM tarefas;
DELETE FROM categorias;

-- Normalmente o banco escolhe o ID (IDENTITY). O IDENTITY_INSERT ON deixa a gente escolher, só aqui.
SET IDENTITY_INSERT categorias ON;
INSERT INTO categorias (id, nome) VALUES
    (1, N'Estudos'),
    (2, N'Casa'),
    (3, N'Trabalho');
SET IDENTITY_INSERT categorias OFF;

SET IDENTITY_INSERT tarefas ON;
INSERT INTO tarefas (id, titulo, feita, id_categoria) VALUES
    (1, N'Ler o capítulo de SQL Server', 1, 1),
    (2, N'Fazer o exercício do pool',    0, 1),
    (3, N'Lavar a louça',                0, 2),
    (4, N'Enviar o relatório',           0, 3);
SET IDENTITY_INSERT tarefas OFF;

-- O contador do IDENTITY não volta sozinho depois do DELETE. Aqui ele volta para o último ID usado:
-- o próximo INSERT normal ganha o ID 5 (tarefas) e o 4 (categorias).
DBCC CHECKIDENT ('tarefas', RESEED, 4);
DBCC CHECKIDENT ('categorias', RESEED, 3);

SELECT t.id, t.titulo, t.feita, c.nome AS categoria
FROM tarefas t JOIN categorias c ON c.id = t.id_categoria ORDER BY t.id;
