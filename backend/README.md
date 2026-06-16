# 🚀 Upserv - Backend API

Backend da plataforma Upserv desenvolvido com Node.js, Express, TypeScript e SQLite usando Drizzle ORM.

## 📋 Pré-requisitos

- Node.js 16+ instalado
- npm ou yarn

## 📦 Instalação

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Copie o arquivo `.env.example` para `.env` e configure:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas variáveis:

```
PORT=3000
DB_PATH=./database.sqlite
NODE_ENV=development
```

## 🏃 Executando o projeto

### Modo desenvolvimento (com hot reload)

```bash
npm run dev
```

### Modo produção

```bash
npm run build
npm start
```

## 📁 Estrutura do Projeto

```
backend/
├── src/
│   ├── routes/
│   │   ├── auth.ts          # Rotas de autenticação (login, recuperar senha)
│   │   ├── usuarios.ts      # CRUD de usuários
│   │   └── servicos.ts      # CRUD de serviços
│   ├── db.ts                # Configuração do banco de dados
│   ├── schema.ts            # Schemas do Drizzle ORM
│   └── server.ts            # Arquivo principal do Express
├── package.json
├── tsconfig.json
└── .env.example
```

## 🗄️ Banco de Dados

O banco SQLite é criado automaticamente ao iniciar o servidor. As tabelas são criadas na primeira execução:

### Tabelas

1. **usuarios** - Usuários do sistema
   - id (PK)
   - nome
   - email (UNIQUE)
   - senha
   - criado_em

2. **prestadores** - Prestadores de serviço
   - id (PK)
   - usuario_id (FK)
   - descricao
   - criado_em

3. **servicos** - Serviços oferecidos
   - id (PK)
   - prestador_id (FK)
   - nome
   - preco
   - criado_em

## 🔌 Endpoints da API

### Autenticação

- `POST /auth/login` - Fazer login
- `POST /auth/recuperar-senha` - Recuperar senha

### Usuários

- `POST /usuarios` - Criar usuário (cadastro)
- `GET /usuarios` - Listar todos os usuários
- `GET /usuarios/:id` - Obter um usuário
- `PUT /usuarios/:id` - Atualizar usuário
- `DELETE /usuarios/:id` - Deletar usuário

### Serviços

- `GET /servicos` - Listar serviços
- `POST /servicos` - Criar serviço
- `GET /servicos/:id` - Obter serviço
- `PUT /servicos/:id` - Atualizar serviço
- `DELETE /servicos/:id` - Deletar serviço

## 📝 Exemplos de Requisições

### Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@email.com",
    "senha": "senha123"
  }'
```

### Cadastro

```bash
curl -X POST http://localhost:3000/usuarios \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva",
    "email": "joao@email.com",
    "senha": "senha123",
    "confirmarSenha": "senha123"
  }'
```

### Listar Usuários

```bash
curl -X GET http://localhost:3000/usuarios
```

## 🔐 Segurança

- Senhas são criptografadas com bcrypt
- Validação de dados de entrada
- CORS habilitado para requisições do frontend

## 🚀 Deploy

Para fazer deploy em produção:

1. Build do projeto:

```bash
npm run build
```

2. Deploy dos arquivos em `dist/`

## 📚 Tecnologias

- **Express.js** - Framework web
- **TypeScript** - Tipagem estática
- **Drizzle ORM** - ORM para SQLite
- **SQLite** - Banco de dados
- **bcryptjs** - Hash de senhas
- **CORS** - Cross-Origin Resource Sharing
