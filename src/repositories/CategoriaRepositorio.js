const { consultar } = require('../conexao');

const SELECT_TAREFA = `
    SELECT t.id, 
    t.titulo, 
    t.feita, 
    t.id_categoria AS idCategoria,
    c.nome AS categoria
    FROM tarefas t
    JOIN categorias c ON c.id = t.id_categoria
`;

const paramJson = (linha) => ({
    ...linha, feita: Boolean(linha.feita)
});

const TarefaRepositorio = {
    async listar(){

    },
    async buscarPorId(){

    },
    async criar(){

    },
    async atualizar(){

    },
    async remover(){

    },
    async contarDaCategoria(){

    },
    
};

module.exports = TarefaRepositorio;