# App de Tarefas — Programação Back-End (Turma 1)

O app de ensino da aula de banco de dados: uma API de **tarefas** que pertencem a **categorias**, guardadas no **SQL Server**. O código começa onde a turma parou em 28/10 e cresce bloco a bloco na aula de 04/11.

## Como baixar e rodar (Bloco 0)

Você precisa do **Node.js 22 ou mais novo** (`node -v`), do **SQL Server Express** ligado e do **SSMS**.

```bash
git clone https://github.com/dorfusouza/backend-turma1-app-tarefas.git
cd backend-turma1-app-tarefas
npm install
```

> Atenção: é `npm install` (as bibliotecas já estão no `package.json`). Se for instalar à mão, é **com espaço**: `npm install mssql msnodesqlv8`. Com barra (`mssql/msnodesqlv8`) o npm tenta baixar outra coisa do GitHub e trava.

1. Copie o `.env.example` para `.env`. Em `DB_SERVER`, coloque o **Server name** que aparece na tela de login do SSMS (no Express costuma ser `localhost\SQLEXPRESS`).
2. No SSMS, abra e execute (F5) `banco/criar-banco.sql` e depois `banco/dados-exemplo.sql`.
3. Suba o app:

```bash
npm start
```

## Como a aula funciona (PRIMM)

Cada bloco tem duas fases, e o slide mostra qual é:

- **OUVIR** — tampa do notebook abaixada. A gente **prevê** o que o código vai fazer, o professor **roda** e a turma **investiga** o resultado.
- **FAZER** — mãos no teclado. Você escreve a sua parte, com a missão do bloco e o critério de pronto.

No fim de cada bloco o professor publica um **checkpoint** (uma tag no Git, `bloco1` a `bloco5`).

## Atrasou? Volte ao ritmo com o checkpoint

Não copie a matéria atrasada: pegue o checkpoint e siga com a turma.

```bash
git fetch --tags
git stash -u
git reset --hard bloco2
```

Troque `bloco2` pelo bloco que acabou de terminar. O `git stash -u` guarda o que você já tinha escrito (para ver depois: `git stash show -p`). O seu `.env` não é apagado.

## O verificador: já está pronto?

```bash
npm run verificar          # confere todos os blocos
npm run verificar -- 2     # confere só até o bloco 2
```

Ele mostra `CORRETO` ou `ERRO` (com uma dica) para cada item. Usa um banco temporário e apaga no fim: o seu `demo_tarefas` não é tocado.

## Se der erro de conexão

| O que aparece | O que fazer |
|---|---|
| `ConnectionOpen (Connect())` | confira o `DB_SERVER` no `.env` (igual ao do SSMS) e se o serviço **SQL Server (SQLEXPRESS)** está rodando |
| `Cannot open database "demo_tarefas"` | rode o `banco/criar-banco.sql` no SSMS |
| `Login failed` | o seu usuário do Windows não tem acesso: entre no SSMS com a conta que instalou o SQL Server |
| `Data source name not found` | o driver do `DB_DRIVER` não está instalado: deixe `DB_DRIVER=SQL Server` |
| `Cannot find module 'mssql/msnodesqlv8'` | rode `npm install` |
