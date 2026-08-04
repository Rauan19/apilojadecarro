# Guia de Instalação Rápida

## Backend

```bash
cd backend
npm install
copy .env.example .env   # Windows
# cp .env.example .env   # Linux/Mac
npm run db:setup
npm run start:dev
```

- API: http://localhost:3000/api
- Swagger: http://localhost:3000/docs

### VPS / produção

O Docker sobe **só o Postgres**. A API Nest roda com Node.

Se a VPS tiver Compose antigo (`docker-compose` com hífen), os scripts `db:*` já tentam os dois.

```bash
cd backend
cp .env.example .env   # ajuste JWT, URLs e DATABASE_URL
npm ci
npm run db:up          # sobe Postgres na porta 65432
# se falhar: apt install docker-compose  OU  docker-compose up -d
npx prisma migrate deploy
npx ts-node prisma/seed.ts   # só na 1ª vez
npm run build
npm run start:prod
# ou: pm2 start dist/main.js --name lojadecarro-api
```

Erro `Can't reach database server at 127.0.0.1:65432` = Postgres não está rodando. Confira com `docker ps` / `docker-compose ps`.

## Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

- App: http://localhost:5173

## Login

- Super Admin: `admin@sistema.com` / `123456`
- Admin Loja: `admin@autoprme.com.br` / `123456`
- Vendedor: `ana@autoprme.com.br` / `123456`

## Gerar Token de API

1. Entre como Super Admin
2. Menu **Tokens API**
3. Selecione a empresa e crie o token
4. Copie o token (64 caracteres) — exibido só uma vez
5. Use em: `Authorization: Bearer <token>`
