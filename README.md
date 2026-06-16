# Upserv

Aplicativo de marketplace de serviços com sistema de 3 tipos de usuário: **admin**, **prestador** e **usuário**.

## Stack

**Backend:** Node.js · Express · TypeScript · SQLite · JWT

**Frontend:** React Native · Expo · TypeScript · Axios

## Estrutura

```
n2e1/
├── backend/          # API REST (porta 3000)
│   └── src/
│       ├── routes/   # auth, usuarios, servicos, pedidos, slots...
│       ├── db.ts     # cliente SQLite
│       ├── schema.ts # definição das tabelas
│       └── server.ts # entry point
│
└── frontend/         # App mobile (Expo)
    └── src/
        ├── screens/  # todas as telas
        ├── services/ # chamadas à API
        ├── context/  # AuthContext
        ├── theme/    # tokens de design (cores, espaçamento)
        └── utils/    # responsividade
```

## Como rodar

### Backend

```bash
cd backend
npm install
cp .env.example .env   # preencha o JWT_SECRET
npm run dev            # http://localhost:3000
```

### Frontend

```bash
cd frontend
npm install
npx expo start         # escaneie com Expo Go
```

## Funcionalidades

- Autenticação com JWT (login, cadastro, recuperar senha)
- 3 papéis: admin gerencia tudo, prestador cria serviços e atende pedidos, usuário contrata e paga
- Carteira com saldo fictício e histórico de transações
- Criação e aprovação de serviços pelo admin
- Agendamento por slots de horário
- Pedidos com status e pagamento
- Favoritos, endereços e perfil editável
- Notificações e avaliações

## Variáveis de ambiente

Crie `backend/.env` baseado em `backend/.env.example`:

```
JWT_SECRET=qualquer_string_secreta
PORT=3000
```
