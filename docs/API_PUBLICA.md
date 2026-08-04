# API Pública

Documentação da API pública para sites, bots e integrações de cada loja.

## Autenticação

O **Bearer token** das rotas `/api/public/*` é o **token da loja**, gerado pelo Super Admin no painel SaaS em **Tokens API** (ou `POST /api/api-tokens`).

```
Authorization: Bearer <TOKEN_DA_LOJA>
```

Características:

- 64 caracteres hexadecimais
- Vinculado a uma empresa/loja (`companyId`)
- **Não expira** — só deixa de funcionar se for revogado/apagado ou se a loja for bloqueada
- Cada uso atualiza `lastUsedAt`
- Logs registram endpoint, IP, horário e tempo de resposta

**Não use o JWT de login do painel** (`POST /auth/login`). Esse JWT (access ~15 min / refresh ~7 dias) é só para o dashboard interno e **não autentica** a API pública.

Ideal para bots: gere o token uma vez e guarde no ambiente do bot.

## Endpoints

### Dados da empresa

`GET /api/public/company`

Retorna nome, slug, logo, contato, domínio customizado e configurações públicas da loja do token.

### Listar veículos

`GET /api/public/vehicles`

Só veículos com status `AVAILABLE` da loja do token.

Query params:

| Param | Tipo | Descrição |
|-------|------|-----------|
| `page` | number | Página (padrão 1) |
| `limit` | number | Itens por página (padrão 10, máx 100) |
| `search` | string | Busca livre (marca, modelo, descrição) |
| `brand` | string | Marca |
| `model` | string | Modelo |
| `year` | number | Ano de fabricação |
| `minPrice` / `maxPrice` | number | Faixa de preço |
| `color` | string | Cor |
| `transmission` | string | `MANUAL` \| `AUTOMATIC` \| `CVT` \| `DCT` |
| `fuel` | string | `FLEX` \| `GASOLINE` \| `ETHANOL` \| `DIESEL` \| `ELECTRIC` \| `HYBRID` \| `GNV` |
| `sortBy` | string | Campo de ordenação (padrão `createdAt`) |
| `sortOrder` | string | `asc` \| `desc` (padrão `desc`) |

Campos de cada veículo: `id`, `brand`, `model`, `version`, `year`, `yearModel`, `price`, `originalPrice`, `mileage`, `fuel`, `transmission`, `color`, `doors`, `description`, `optionals`, `status`, `createdAt`, `updatedAt`, `images[]` (`id`, `url`, `order`).

URLs de imagem são relativas (ex.: `/uploads/...`). Monte com a origem da API (sem `/api`).

### Detalhe do veículo

`GET /api/public/vehicles/:id`

Mesmo payload de um item da listagem. Retorna 404 se não existir ou não estiver disponível.

### Busca

`GET /api/public/search` — mesmos filtros e resposta da listagem (alias).

### Cadastrar lead

`POST /api/public/leads`

```json
{
  "name": "Maria Silva",
  "phone": "(11) 99999-8888",
  "email": "maria@email.com",
  "notes": "Interessada no Corolla",
  "vehicleId": "uuid-opcional"
}
```

### Agendar visita

`POST /api/public/schedule`

```json
{
  "name": "Maria Silva",
  "phone": "(11) 99999-8888",
  "email": "maria@email.com",
  "date": "2026-08-10T14:00:00.000Z",
  "notes": "Test-drive",
  "vehicleId": "uuid-opcional"
}
```

## Códigos HTTP

| Código | Significado |
|--------|-------------|
| 200 | Sucesso |
| 201 | Criado |
| 400 | Validação |
| 401 | Token inválido/ausente |
| 404 | Recurso não encontrado |
| 429 | Rate limit |

## Swagger

Documentação interativa: `http://localhost:3000/docs` (ou a porta em `PORT`).
