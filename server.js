const express = require('express');

const app = express();
const PORTA = process.env.PORT || 3000;

app.use(express.json());

function responderErro(res, status, erro) {
    if(erroDeBanco(erro)) throw erro;
    res.status(status).json({erro: erro.message})
}

// - CATEGORIA
app.get('/categorias', async (req, res) => {
    res.json(await TarefaService.listarCategorias());
})

// - TAREFA
// GET /tarefas            -> todas
// GET /tarefas?feita=true -> só as feitas
// (o filtro vira um WHERE com "@feita")

app.get('/tarefas', async (req, res) => {
    const { feita } = req.query;
    if(feita !== undefined 
        && feita !== 'true' 
        && feita !== 'false'){
            return res.status(400).json({ 
                erro: '"feita" deve ser true ou false.'
            }); 
    }
    res.json(await 
        TarefaService.listarTarefas(feita === undefined 
            ? undefined : feita === 'true'
        ));
});

app.listen(PORTA, () => {
    console.log(`Demo MySQL em http://localhost:${PORTA}`);
})