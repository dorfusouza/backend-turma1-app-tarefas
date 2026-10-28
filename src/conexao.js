// Conexão com o Banco
require('dotenv').config();
const sql = require('mssql/msnodesqlv8')

function textoDeConexao(banco){
    const servidor = process.env.DB_SERVER || 'localhost\\SQLEXPRESS';
    const driver = process.env.DB_DRIVER || 'SQL Server';
    const database = banco ? `Database=${banco};` : '';
    // Os drivers novos exigem criptografia e desconfiam do certificado 
    // de teste do SQL Server local.
    // O driver antigo ("SQL Server") não conhece esse atributo
    //  e recusa a conexão se ele aparecer.
    const confiar = /ODBC Driver|Native Client/.test(driver) ? 
                                    'TrustServerCertificate=Yes;' : '';
    return `Driver={${driver}};Server=${servidor};
                            ${database}Trusted_Connection=Yes;${confiar}`;

}

const pool = new sql.ConnectionPool({
    connectionString: textoDeConexao(process.env.DB_NAME),
    pool: { max: 10},
});

let conectando;
function conectar() {
    if (!conectando) {
        conectando = pool.connect().catch((erro) => {
            conectando = undefined;
            throw erro;
        });
    }
    return conectando;
}

async function consultar(texto, parametros = {}) {
    await conectar();

    const pedido = pool.request();
    for(const [nome, valor] of Object.entries(parametros)) pedido.input(nome, valor);
    return pedido.query(texto);
}

async function fechar() {
    await pool.close();
}

const erroDeBanco = (erro) => erro instanceof sql.MSSQLError;

module.exports = { consultar, fechar, erroDeBanco, textoDeConexao, sql };