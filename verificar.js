/**
 * VERIFICADOR do app de tarefas: diz se o seu código já está pronto em cada bloco da aula.
 *
 *   npm run verificar          confere todos os blocos (1 a 5)
 *   npm run verificar -- 2     confere só até o bloco 2
 *
 * Ele cria um banco TEMPORÁRIO (tarefas_verificacao_<número>), carrega os dados de exemplo, testa e apaga o banco
 * no fim: o seu banco demo_tarefas não é tocado. Precisa do SQL Server ligado e do arquivo .env.
 * Você não precisa entender este arquivo para a aula. Não precisa mexer nele.
 */
process.env.DOTENV_CONFIG_QUIET = 'true';
process.env.NODE_ENV = 'test'; // o Express não imprime a pilha de cada erro
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const nomeBanco = `tarefas_verificacao_${process.pid}`;
process.env.DB_NAME = nomeBanco; // o seu código vai usar o banco temporário
const PORTA = 3999;
process.env.PORT = String(PORTA);
const ATE = Number(process.argv[2]) || 5;

const escrever = (texto) => process.stdout.write(texto + '\n');
const logOriginal = console.log;
const silenciar = () => { console.log = () => {}; };
const devolverLog = () => {}; // o console do app fica mudo até o fim: só o verificador escreve

let sql;
try {
    sql = require('mssql/msnodesqlv8');
} catch {
    escrever('✖ Faltam as bibliotecas do banco. Rode:  npm install');
    process.exit(1);
}

// ---------- o banco temporário (com uma conexão só, como o SSMS) ----------
function textoDeConexao(banco) {
    const servidor = process.env.DB_SERVER || 'localhost\\SQLEXPRESS';
    const driver = process.env.DB_DRIVER || 'SQL Server';
    const database = banco ? `Database=${banco};` : '';
    const confiar = /ODBC Driver|Native Client/.test(driver) ? 'TrustServerCertificate=Yes;' : '';
    return `Driver={${driver}};Server=${servidor};${database}Trusted_Connection=Yes;${confiar}`;
}

async function rodarScript(texto) {
    const pool = new sql.ConnectionPool({ connectionString: textoDeConexao(), pool: { min: 1, max: 1 } });
    await pool.connect();
    try {
        for (const lote of texto.split(/^\s*GO\s*$/im)) {
            if (lote.replace(/--.*$/gm, '').trim()) await pool.request().query(lote);
        }
    } finally {
        await pool.close();
    }
}

const lerBanco = (arquivo) => fs.readFileSync(path.join(__dirname, 'banco', arquivo), 'utf8').replace(/demo_tarefas/g, nomeBanco);

// ---------- as conferências ----------
const placar = {};
let blocoAtual = 0;
function conferir(descricao, condicao, dica) {
    placar[blocoAtual] = placar[blocoAtual] || { ok: 0, total: 0 };
    placar[blocoAtual].total++;
    if (condicao) placar[blocoAtual].ok++;
    escrever(`${condicao ? 'CORRETO' : 'ERRO   '}: ${descricao}`);
    if (!condicao && dica) escrever(`         dica: ${dica}`);
}

async function tentar(funcao) {
    try {
        return { valor: await funcao() };
    } catch (erro) {
        return { erro };
    }
}

function carregar(arquivo) {
    try {
        return require(path.join(__dirname, arquivo));
    } catch (erro) {
        if (erro.code === 'MODULE_NOT_FOUND' && erro.message.includes(arquivo.replace(/\//g, path.sep).replace('.js', ''))) return null;
        escrever(`ERRO   : ${arquivo} tem um erro e não carregou: ${erro.message.split('\n')[0]}`);
        return null;
    }
}

async function pedir(metodo, caminho, corpo, textoCru) {
    const opcoes = { method: metodo };
    if (corpo !== undefined || textoCru !== undefined) {
        opcoes.headers = { 'Content-Type': 'application/json' };
        opcoes.body = textoCru !== undefined ? textoCru : JSON.stringify(corpo);
    }
    const resposta = await fetch(`http://localhost:${PORTA}${caminho}`, opcoes);
    const texto = await resposta.text();
    let json = null;
    try { json = texto ? JSON.parse(texto) : null; } catch { /* sem JSON */ }
    return { status: resposta.status, json, texto };
}

const titulo = (texto) => `?titulo=${encodeURIComponent(texto)}`;

(async () => {
    escrever(`Verificando até o bloco ${ATE} (banco temporário ${nomeBanco})...\n`);
    try {
        await rodarScript(lerBanco('criar-banco.sql'));
        await rodarScript(lerBanco('dados-exemplo.sql'));
    } catch (erro) {
        escrever(`✖ Não deu para usar o SQL Server: ${erro.message}`);
        escrever('  Confira se o serviço SQL Server (SQLEXPRESS) está ligado e o DB_SERVER do .env.');
        process.exit(1);
    }

    silenciar();
    const TarefaRepositorio = carregar('src/repositories/TarefaRepositorio.js');
    const TarefaService = carregar('src/services/TarefaService.js');
    carregar('server.js'); // o servidor sobe na porta 3999, só durante a verificação
    devolverLog();
    await new Promise((r) => setTimeout(r, 300));

    try {
        // ======================= BLOCO 1 =======================
        blocoAtual = 1;
        escrever('--- Bloco 1: ler do banco ---');
        conferir('existe o arquivo src/repositories/TarefaRepositorio.js', TarefaRepositorio !== null,
            'o repositório de tarefas foi escrito no arquivo CategoriaRepositorio.js: renomeie o arquivo.');
        if (TarefaRepositorio) {
            silenciar();
            const todas = await tentar(() => TarefaRepositorio.listar());
            const feitas = await tentar(() => TarefaRepositorio.listar(true));
            const tres = await tentar(() => TarefaRepositorio.buscarPorId(3));
            const nenhuma = await tentar(() => TarefaRepositorio.buscarPorId(99));
            devolverLog();
            conferir('listar() devolve as 4 tarefas, com o nome da categoria e "feita" true/false',
                Array.isArray(todas.valor) && todas.valor.length === 4 && todas.valor[0].categoria === 'Estudos' && todas.valor[0].feita === true,
                todas.erro ? todas.erro.message : 'confira o SELECT com JOIN e o "return recordset.map(...)".');
            conferir('listar(true) devolve só a tarefa feita', Array.isArray(feitas.valor) && feitas.valor.length === 1,
                'o filtro vira um WHERE t.feita = @feita, com { feita } nos parâmetros.');
            conferir('buscarPorId(3) devolve "Lavar a louça"', tres.valor && tres.valor.titulo === 'Lavar a louça',
                tres.erro ? tres.erro.message : 'WHERE t.id = @id e devolva recordset[0].');
            conferir('buscarPorId(99) devolve null', !nenhuma.erro && nenhuma.valor === null, 'recordset[0] ?? null');
        }
        let r = await tentar(() => pedir('GET', '/tarefas'));
        conferir('GET /tarefas → 200 com 4 tarefas', r.valor && r.valor.status === 200 && Array.isArray(r.valor.json) && r.valor.json.length === 4,
            r.valor && r.valor.status === 500 ? 'erro 500: faltou algum require no server.js?' : 'o servidor subiu? (npm start funciona?)');
        r = await tentar(() => pedir('GET', '/tarefas?feita=true'));
        conferir('GET /tarefas?feita=true → só 1 tarefa', r.valor && r.valor.status === 200 && Array.isArray(r.valor.json) && r.valor.json.length === 1);
        r = await tentar(() => pedir('GET', '/tarefas?feita=talvez'));
        conferir('GET /tarefas?feita=talvez → 400', r.valor && r.valor.status === 400);

        // ======================= BLOCO 2 =======================
        if (ATE >= 2) {
            blocoAtual = 2;
            escrever('\n--- Bloco 2: gravar no banco e SQL injection ---');
            if (TarefaRepositorio) {
                silenciar();
                const novo = await tentar(() => TarefaRepositorio.criar('Estudar o pool', 1));
                const id = novo.valor;
                await tentar(() => TarefaRepositorio.atualizar(id, 'Estudar o pool de conexões', true));
                const mudou = await tentar(() => TarefaRepositorio.buscarPorId(id));
                await tentar(() => TarefaRepositorio.remover(id));
                const sumiu = await tentar(() => TarefaRepositorio.buscarPorId(id));
                devolverLog();
                conferir('criar() devolve o ID que o banco gerou (um número)', Number.isInteger(id),
                    novo.erro ? novo.erro.message : 'INSERT ... OUTPUT INSERTED.id VALUES (...) e devolva recordset[0].id.');
                conferir('atualizar() muda o título e o "feita"', mudou.valor && mudou.valor.titulo === 'Estudar o pool de conexões' && mudou.valor.feita === true,
                    'UPDATE tarefas SET titulo = @titulo, feita = @feita WHERE id = @id');
                conferir('remover() apaga a tarefa', Number.isInteger(id) && !sumiu.erro && sumiu.valor === null, 'DELETE FROM tarefas WHERE id = @id');
            }
            r = await tentar(() => pedir('GET', `/demo/inseguro/tarefas${titulo("x' OR '1'='1")}`));
            conferir("rota insegura com x' OR '1'='1 → devolve TODAS as tarefas", r.valor && r.valor.status === 200 && Array.isArray(r.valor.json) && r.valor.json.length === 4,
                'a rota /demo/inseguro/tarefas está no server.js? (ela vem no checkpoint bloco2)');
            r = await tentar(() => pedir('GET', `/demo/seguro/tarefas${titulo("x' OR '1'='1")}`));
            conferir("rota segura com o mesmo texto → nenhuma tarefa", r.valor && r.valor.status === 200 && Array.isArray(r.valor.json) && r.valor.json.length === 0);
        }

        // ======================= BLOCO 3 =======================
        if (ATE >= 3) {
            blocoAtual = 3;
            escrever('\n--- Bloco 3: o serviço (as regras) ---');
            const temServico = TarefaService && typeof TarefaService.criarTarefa === 'function';
            conferir('o TarefaService tem criarTarefa, editarTarefa e removerTarefa',
                temServico && typeof TarefaService.editarTarefa === 'function' && typeof TarefaService.removerTarefa === 'function');
            if (temServico) {
                silenciar();
                const curto = await tentar(() => TarefaService.criarTarefa('ab', 1));
                const semCategoria = await tentar(() => TarefaService.criarTarefa('Tarefa sem categoria', 99));
                const certa = await tentar(() => TarefaService.criarTarefa('Comprar pão', 2));
                const id = certa.valor && certa.valor.id;
                const feitaErrada = await tentar(() => TarefaService.editarTarefa(id, 'Comprar pão francês', 'sim'));
                const editada = await tentar(() => TarefaService.editarTarefa(id, 'Comprar pão francês', true));
                const naoExiste = await tentar(() => TarefaService.removerTarefa(99));
                const removida = await tentar(() => TarefaService.removerTarefa(id));
                devolverLog();
                conferir('título com menos de 3 letras → erro com "Título"', curto.erro && curto.erro.message.includes('Título'));
                conferir('categoria que não existe → erro que cita o 99', semCategoria.erro && semCategoria.erro.message.includes('99'),
                    'antes de criar, o serviço busca a categoria (CategoriaRepositorio.buscarPorId).');
                conferir('tarefa certa → volta completa, com a categoria "Casa"', certa.valor && certa.valor.categoria === 'Casa' && certa.valor.feita === false,
                    certa.erro ? certa.erro.message : 'depois de criar, devolva TarefaRepositorio.buscarPorId(id).');
                conferir('"feita" que não é true/false → erro', !!feitaErrada.erro);
                conferir('editarTarefa com feita = true → feita true', editada.valor && editada.valor.feita === true);
                conferir('remover uma tarefa que não existe → erro "não existe"', naoExiste.erro && naoExiste.erro.message.includes('não existe'));
                conferir('remover a tarefa criada → dá certo', !removida.erro);
            }
        }

        // ======================= BLOCO 4 =======================
        if (ATE >= 4) {
            blocoAtual = 4;
            escrever('\n--- Bloco 4: rotas e status ---');
            r = await tentar(() => pedir('GET', '/tarefas/3'));
            conferir('GET /tarefas/3 → 200', r.valor && r.valor.status === 200 && r.valor.json && r.valor.json.titulo === 'Lavar a louça');
            r = await tentar(() => pedir('GET', '/tarefas/99'));
            conferir('GET /tarefas/99 → 404 com { erro }', r.valor && r.valor.status === 404 && r.valor.json && typeof r.valor.json.erro === 'string');
            r = await tentar(() => pedir('POST', '/tarefas', { titulo: 'Revisar a aula', idCategoria: 1 }));
            const criada = r.valor && r.valor.json;
            conferir('POST /tarefas → 201 com a tarefa nova', r.valor && r.valor.status === 201 && criada && Number.isInteger(criada.id) && criada.categoria === 'Estudos');
            r = await tentar(() => pedir('POST', '/tarefas', { titulo: 'ab', idCategoria: 1 }));
            conferir('POST com título curto → 400', r.valor && r.valor.status === 400);
            r = await tentar(() => pedir('POST', '/tarefas', { titulo: 'Tarefa perdida', idCategoria: 99 }));
            conferir('POST com categoria que não existe → 400', r.valor && r.valor.status === 400);
            r = await tentar(() => pedir('POST', '/tarefas', undefined, '{"titulo": '));
            conferir('POST com JSON quebrado → 400 em JSON', r.valor && r.valor.status === 400 && r.valor.json !== null,
                'falta o tratador de erros (app.use com 4 parâmetros) no fim do server.js.');
            r = await tentar(() => pedir('PUT', '/tarefas/2', { titulo: 'Fazer o exercício do pool', feita: true }));
            conferir('PUT /tarefas/2 → 200 com feita = true', r.valor && r.valor.status === 200 && r.valor.json && r.valor.json.feita === true);
            r = await tentar(() => pedir('PUT', '/tarefas/2', { titulo: 'Fazer o exercício do pool', feita: 'sim' }));
            conferir('PUT com "feita" que não é true/false → 400', r.valor && r.valor.status === 400);
            r = await tentar(() => pedir('PUT', '/tarefas/99', { titulo: 'Qualquer coisa', feita: true }));
            conferir('PUT /tarefas/99 → 404 com { erro }', r.valor && r.valor.status === 404 && r.valor.json !== null);
            if (criada && criada.id) {
                r = await tentar(() => pedir('DELETE', `/tarefas/${criada.id}`));
                conferir('DELETE da tarefa criada → 204', r.valor && r.valor.status === 204);
                r = await tentar(() => pedir('DELETE', `/tarefas/${criada.id}`));
                conferir('DELETE de novo → 404 com { erro }', r.valor && r.valor.status === 404 && r.valor.json !== null);
            }
            r = await tentar(() => pedir('GET', '/rota-que-nao-existe'));
            conferir('rota que não existe → 404 em JSON', r.valor && r.valor.status === 404 && r.valor.json !== null);
        }

        // ======================= BLOCO 5 =======================
        if (ATE >= 5) {
            blocoAtual = 5;
            escrever('\n--- Bloco 5: categorias (o que você criou sozinho) ---');
            r = await tentar(() => pedir('GET', '/categorias'));
            conferir('GET /categorias → 200 com 3 categorias', r.valor && r.valor.status === 200 && Array.isArray(r.valor.json) && r.valor.json.length === 3);
            r = await tentar(() => pedir('POST', '/categorias', { nome: 'Lazer' }));
            const lazer = r.valor && r.valor.json;
            conferir('POST /categorias → 201 com { id, nome }', r.valor && r.valor.status === 201 && lazer && Number.isInteger(lazer.id) && lazer.nome === 'Lazer');
            r = await tentar(() => pedir('POST', '/categorias', { nome: 'Lazer' }));
            conferir('categoria repetida → 400 "já existe"', r.valor && r.valor.status === 400 && r.valor.json && String(r.valor.json.erro).includes('já existe'));
            r = await tentar(() => pedir('POST', '/categorias', { nome: 'x' }));
            conferir('nome com menos de 2 letras → 400', r.valor && r.valor.status === 400);
            r = await tentar(() => pedir('DELETE', '/categorias/1'));
            conferir('DELETE de categoria que ainda tem tarefas → 409', r.valor && r.valor.status === 409 && r.valor.json !== null);
            if (lazer && lazer.id) {
                r = await tentar(() => pedir('DELETE', `/categorias/${lazer.id}`));
                conferir('DELETE de categoria sem tarefas → 204', r.valor && r.valor.status === 204);
            }
            r = await tentar(() => pedir('DELETE', '/categorias/99'));
            conferir('DELETE de categoria que não existe → 404 com { erro }', r.valor && r.valor.status === 404 && r.valor.json !== null);
        }

        // ======================= O BANCO QUE CAI =======================
        if (ATE >= 4) {
            escrever('\n--- Erro do banco (a tabela some) ---');
            const antes = await tentar(() => pedir('GET', '/tarefas'));
            await rodarScript(`USE [${nomeBanco}]; DROP TABLE tarefas;`);
            r = await tentar(() => pedir('GET', '/tarefas'));
            conferir('GET /tarefas com a tabela fora → 500 em JSON (e não 400 nem 404)',
                antes.valor && antes.valor.status === 200 && r.valor && r.valor.status === 500 && r.valor.json !== null,
                'o tratador de erros (app.use com 4 parâmetros) responde 500 com { erro }.');
        }
    } finally {
        console.log = logOriginal;
        await rodarScript(`IF DB_ID('${nomeBanco}') IS NOT NULL BEGIN
            ALTER DATABASE [${nomeBanco}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
            DROP DATABASE [${nomeBanco}];
        END`).catch(() => {});
    }

    escrever('\n=== Resultado ===');
    let tudoCerto = true;
    for (const [bloco, { ok, total }] of Object.entries(placar)) {
        escrever(`Bloco ${bloco}: ${ok}/${total}${ok === total ? '  ✔' : ''}`);
        if (ok !== total) tudoCerto = false;
    }
    if (!tudoCerto) {
        escrever('\nTravou? Volte ao ritmo da turma com o checkpoint do último bloco (troque N pelo número):');
        escrever('  git fetch --tags   →   git stash -u   →   git reset --hard blocoN');
    }
    process.exit(tudoCerto ? 0 : 1);
})().catch((erro) => {
    console.log = logOriginal;
    escrever(`ERRO no verificador: ${erro.message}`);
    process.exit(1);
});
