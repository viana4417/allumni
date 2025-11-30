# Allumni - Sistema de Rede de Ex-Alunos

Sistema completo de rede social para ex-alunos com funcionalidades de login, perfis, vagas, grupos e chat.

## 🚀 Funcionalidades

- **Autenticação**: Sistema de login e cadastro com senhas criptografadas
- **Perfis**: Gerenciamento completo de perfis de usuários
- **Vagas**: Sistema de publicação e candidatura a vagas de emprego
- **Grupos**: Criação e participação em grupos temáticos
- **Chat**: Sistema de mensagens privadas e em grupos
- **Dashboard**: Interface moderna e responsiva

## 📋 Pré-requisitos

- Node.js (versão 14 ou superior)
- npm (geralmente vem com Node.js)

## 🔧 Instalação

1. Clone o repositório ou navegue até a pasta do projeto:
```bash
cd pce
```

2. Instale as dependências:
```bash
npm install
```

3. Inicialize o banco de dados:
```bash
npm run init-db
```

Isso criará o banco de dados SQLite com o schema necessário e dados de exemplo.

## 🏃 Executando o Projeto

1. Inicie o servidor backend:
```bash
npm start
```

Ou para desenvolvimento com auto-reload:
```bash
npm run dev
```

2. Abra o navegador e acesse:
```
http://localhost:3000
```

## 📊 Credenciais de Teste

Após inicializar o banco de dados, você pode usar:

- **Email**: `testede.exemplo@blablabla.com`
- **Senha**: `123456`

## 📁 Estrutura do Projeto

```
pce/
├── database/
│   ├── schema.sql          # Schema do banco de dados
│   ├── init.js             # Script de inicialização
│   └── allumni.db          # Banco de dados SQLite (criado após init)
├── design/
│   └── loginpage.png       # Design de referência
├── index.html              # Página de login/cadastro
├── home.html               # Dashboard principal
├── script.js               # Lógica do frontend (login)
├── api.js                  # Cliente API para comunicação com backend
├── styles.css              # Estilos da página de login
├── dashboard.css           # Estilos do dashboard
├── server.js               # Servidor Express com todas as APIs
├── package.json            # Dependências do projeto
└── README.md              # Este arquivo
```

## 🔌 APIs Disponíveis

### Autenticação
- `POST /api/auth/cadastro` - Cadastrar novo usuário
- `POST /api/auth/login` - Fazer login

### Perfis
- `GET /api/perfil/:userId` - Buscar perfil
- `PUT /api/perfil/:userId` - Atualizar perfil

### Vagas
- `GET /api/vagas` - Listar todas as vagas
- `GET /api/vagas/:id` - Buscar vaga específica
- `POST /api/vagas` - Criar nova vaga
- `POST /api/vagas/:id/candidatar` - Candidatar-se a vaga

### Grupos
- `GET /api/grupos` - Listar todos os grupos
- `GET /api/grupos/usuario/:userId` - Buscar grupos do usuário
- `POST /api/grupos` - Criar novo grupo
- `POST /api/grupos/:id/entrar` - Entrar em grupo

### Chat
- `GET /api/chat/privado/:userId1/:userId2` - Mensagens privadas
- `GET /api/chat/grupo/:grupoId` - Mensagens do grupo
- `POST /api/chat/enviar` - Enviar mensagem

## 🗄️ Banco de Dados

O projeto usa SQLite com as seguintes tabelas:

- `usuarios` - Dados dos usuários
- `perfis` - Informações adicionais dos perfis
- `vagas` - Vagas de emprego
- `candidaturas` - Candidaturas a vagas
- `grupos` - Grupos temáticos
- `grupo_membros` - Relação usuários-grupos
- `mensagens` - Sistema de chat
- `conexoes` - Conexões/amizades entre usuários

## 🛠️ Tecnologias Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript (ES6 Modules)
- **Backend**: Node.js, Express
- **Banco de Dados**: SQLite3
- **Segurança**: bcrypt para hash de senhas

## 📝 Notas

- O banco de dados SQLite será criado automaticamente na pasta `database/`
- As senhas são criptografadas usando bcrypt
- O servidor roda na porta 3000 por padrão
- Para produção, considere usar variáveis de ambiente para configurações sensíveis

## 🤝 Contribuindo

Este é um projeto em desenvolvimento. Sinta-se à vontade para sugerir melhorias!

## 📄 Licença

MIT

