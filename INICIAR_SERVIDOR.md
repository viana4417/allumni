# Como Iniciar o Servidor

O erro "Failed to fetch" significa que o servidor backend não está rodando.

## Passos para iniciar:

### 1. Instalar dependências (primeira vez apenas):
```bash
npm install
```

### 2. Inicializar banco de dados (primeira vez apenas):
```bash
npm run init-db
```

### 3. Iniciar servidor:
```bash
npm start
```

Você deve ver a mensagem:
```
Conectado ao banco de dados SQLite.
Servidor rodando na porta 3000
Acesse: http://localhost:3000
```

### 4. Acessar a aplicação:
Abra o navegador em: `http://localhost:3000`

## Para desenvolvimento (com auto-reload):
```bash
npm run dev
```

## Credenciais de teste:
Após inicializar o banco:
- Email: `testede.exemplo@blablabla.com`
- Senha: `123456`

## Solução de problemas:

**Erro: "Cannot find module"**
- Execute: `npm install`

**Erro: "Database not found"**
- Execute: `npm run init-db`

**Porta 3000 já em uso:**
- Pare o processo na porta 3000 ou mude a porta no arquivo `server.js`

