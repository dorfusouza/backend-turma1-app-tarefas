-- Banco + tabelas do app boneco (Lista de Tarefas) em UM script, para rodar no SSMS.
-- Execute tudo (F5). Pode rodar quantas vezes quiser: não apaga nada.
-- Quem usa o terminal não precisa deste arquivo: npm run db:schema faz o mesmo.
-- O "GO" separa os lotes: é um comando do SSMS (não do SQL Server), por isso só vale aqui.

-- 1. O banco
IF DB_ID('demo_tarefas') IS NULL
    CREATE DATABASE demo_tarefas;
GO

USE demo_tarefas;
GO

-- 2. As tabelas. Uma categoria ("Estudos", "Casa") tem várias tarefas.
--    A tarefa aponta para a sua categoria.
IF OBJECT_ID('categorias', 'U') IS NULL
CREATE TABLE categorias (
    id   INT IDENTITY(1,1) PRIMARY KEY,
    nome NVARCHAR(50) NOT NULL UNIQUE
);

IF OBJECT_ID('tarefas', 'U') IS NULL
CREATE TABLE tarefas (
    id           INT IDENTITY(1,1) PRIMARY KEY,
    titulo       NVARCHAR(100) NOT NULL,
    feita        BIT NOT NULL DEFAULT 0,
    id_categoria INT NOT NULL,
    FOREIGN KEY (id_categoria) REFERENCES categorias (id)
);
GO

-- 3. Conferência: deve listar categorias e tarefas
SELECT name AS tabela FROM sys.tables ORDER BY name;
