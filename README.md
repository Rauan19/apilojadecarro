# LojaDeCarro SaaS

Sistema SaaS multi-tenant production-ready para gerenciamento de lojas de veículos.

## Visão geral

- **Super Admin** gerencia todas as empresas, planos, tokens de API e logs
- Cada **empresa** possui dados isolados (`companyId` em todas as tabelas)
- Gestão de estoque, clientes, leads, propostas, vendedores e agendamentos
- **API pública** para sites da loja, bots e integrações externas
- Preparado para migrar de SQLite → PostgreSQL alterando apenas o provider do Prisma

## Stack

| Camada | Tecnologias |
|--------|-------------|
| Backend | NestJS, TypeScript, Prisma, SQLite, JWT, Swagger, Pino, Helmet, Multer, Bcrypt |
| Frontend | React, Vite, TypeScript, TailwindCSS, React Router, TanStack Query, RHF + Zod, Axios, Recharts |
| Arquitetura | Clean Architecture, SOLID, Repository, Service, DTO, RBAC, Multi-tenant |

## Estrutura

```
projeto/
├── backend/          # API NestJS
├── frontend/         # Painel React + vitrine pública `/loja`
├── docs/             # Documentação adicional
└── README.md
```

A vitrine `/loja` consome a API pública. Sites externos de cada loja também podem usar os mesmos endpoints.
## Pré-requisitos

- Node.js 20+ (recomendado 22+)
- npm 10+

## Instalação

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
npm run db:setup
# ou, passo a passo:
# npx prisma migrate dev
# npx prisma db seed
npm run start:dev
```

API: `http://localhost:3000/api`  
Swagger: `http://localhost:3000/docs`

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

App: `http://localhost:5173`

## Credenciais do seed

| Papel | E-mail | Senha |
|-------|--------|-------|
| Super Admin | `admin@sistema.com` | `123456` |
| Admin da Loja | `admin@autoprme.com.br` | `123456` |
| Vendedor | `ana@autoprme.com.br` | `123456` |

Empresa demo: **AutoPrime Veículos** (`autoprme`)

## Variáveis de ambiente

### Backend (`backend/.env`)

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `PORT` | Porta da API | `3000` |
| `DATABASE_URL` | URL do banco Prisma | `file:./dev.db` |
| `JWT_SECRET` | Segredo do access token | — |
| `JWT_EXPIRES_IN` | Expiração do access token | `15m` |
| `JWT_REFRESH_SECRET` | Segredo do refresh token | — |
| `JWT_REFRESH_EXPIRES_IN` | Expiração do refresh | `7d` |
| `FRONTEND_URL` | Origin CORS | `http://localhost:5173` |
| `APP_URL` | URL pública da API (uploads) | `http://localhost:3000` |
| `UPLOAD_DEST` | Pasta de uploads | `./uploads` |

### Frontend (`frontend/.env`)

| Variável | Descrição |
|----------|-----------|
| `VITE_API_URL` | Base da API (`http://localhost:3000/api`) |
| `VITE_DEMO_API_TOKEN` | Token da API pública para a vitrine `/loja` |
| `VITE_PUBLIC_API_TOKEN` | Token alternativo da vitrine (tem prioridade sobre o demo) |

## Prisma e banco

O projeto usa **SQLite** em desenvolvimento.

```bash
cd backend
npx prisma migrate dev      # cria/aplica migrations
npx prisma generate        # gera o client
npx prisma db seed         # popula dados demo
npx prisma studio          # UI do banco
```

### Migrar para PostgreSQL

1. Altere em `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

2. Atualize `DATABASE_URL`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/lojadecarro?schema=public"
```

3. Rode:

```bash
npx prisma migrate dev
```

## Papéis (RBAC)

### Super Admin
- CRUD de empresas (criar, editar, excluir, bloquear, ativar, alterar plano)
- Visualizar faturamento/estatísticas globais
- Gerar e revogar tokens de API
- Visualizar logs e documentação da API

### Admin da Loja
- Veículos, clientes, leads, propostas, vendedores, usuários da loja
- Dashboard e configurações do site
- **Não** pode gerar token de API

### Vendedor
- Visualizar estoque
- Cadastrar clientes e propostas
- Ver apenas seus próprios clientes/leads

## Autenticação

### JWT (painel)

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@sistema.com",
  "password": "123456"
}
```

Resposta:

```json
{
  "success": true,
  "message": "Login realizado com sucesso",
  "data": {
    "accessToken": "...",
    "refreshToken": "...",
    "user": { "id": "...", "role": "SUPER_ADMIN", ... }
  },
  "errors": null
}
```

Refresh: `POST /api/auth/refresh` com `{ "refreshToken": "..." }`

### Token de API (integrações)

1. Login como Super Admin
2. Acesse **Tokens API** no painel (ou `POST /api/api-tokens`)
3. Informe `companyId` e `nome`
4. Copie o token de 64 caracteres (exibido apenas na criação)

Uso:

```http
Authorization: Bearer <TOKEN_64_CHARS>
```

## API pública

Base: `/api/public` — requer Bearer Token de API.

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/public/vehicles` | Lista veículos disponíveis |
| GET | `/api/public/vehicles/:id` | Detalhe do veículo |
| GET | `/api/public/search` | Busca com filtros |
| POST | `/api/public/leads` | Cadastrar lead |
| POST | `/api/public/schedule` | Agendar visita |
| GET | `/api/public/company` | Dados públicos da loja |

### Filtros de veículos

`brand`, `model`, `year`, `minPrice`, `maxPrice`, `transmission`, `fuel`, `color`, `search`, `page`, `limit`

### Exemplo

```bash
curl -H "Authorization: Bearer SEU_TOKEN" \
  "http://localhost:3000/api/public/vehicles?brand=Toyota&minPrice=50000"
```

### Padrão de resposta

Sucesso:

```json
{
  "success": true,
  "message": "Mensagem",
  "data": {},
  "errors": null
}
```

Erro:

```json
{
  "success": false,
  "message": "Erro",
  "errors": []
}
```

## Uploads

Arquivos salvos por empresa:

```
uploads/
  empresa-{companyId}/
    uuid.jpg
```

Endpoints: `POST /api/uploads/image` e `POST /api/uploads/images`

## Multi-tenant

- Toda tabela de negócio possui `companyId`
- Consultas filtram automaticamente pelo tenant do usuário autenticado
- Super Admin pode operar globalmente / informar `companyId`
- Tokens de API amarram o request à empresa correspondente

## Scripts úteis

### Backend

```bash
npm run start:dev      # desenvolvimento
npm run build          # build produção
npm run start:prod     # rodar dist
npm run prisma:seed    # seed
npm run prisma:studio  # Prisma Studio
```

### Frontend

```bash
npm run dev      # Vite
npm run build    # build produção
npm run preview  # preview do build
```

## Documentação

- Swagger interativo: [http://localhost:3000/docs](http://localhost:3000/docs)
- Docs no painel (Super Admin): `/admin/api`
- Guias extras: pasta [`docs/`](./docs)

## Arquitetura do backend

```
src/
├── common/          # filters, guards, interceptors, decorators, DTOs
├── config/
├── prisma/
└── modules/
    ├── auth/
    ├── companies/
    ├── users/
    ├── vehicles/
    ├── customers/
    ├── leads/
    ├── proposals/
    ├── sellers/
    ├── dashboard/
    ├── api-tokens/
    ├── public-api/
    ├── schedules/
    ├── logs/
    ├── settings/
    └── uploads/
```

Regras de negócio ficam nos **Services**. Controllers apenas orquestram. Persistência via **Repositories** (onde aplicável) e Prisma.

## Roadmap de evolução

A estrutura já está preparada para:

- PostgreSQL / Redis
- Integração WhatsApp
- IA para qualificação de leads
- Apps móveis consumindo a mesma API
- Microsserviços (módulos desacoplados)

## Licença

Uso privado / proprietário.
