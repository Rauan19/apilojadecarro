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
