# API Pública

Documentação da API pública para sites, bots e integrações.

## Autenticação

Todas as rotas públicas exigem:

```
Authorization: Bearer <TOKEN_API>
```

O token é gerado **somente pelo Super Admin** em `POST /api/api-tokens`.

Características do token:

- 64 caracteres hexadecimais
- Vinculado a uma empresa (`companyId`)
- Pode ser revogado a qualquer momento
- Cada uso atualiza `ultimoUso` / `lastUsedAt`
- Logs registram endpoint, IP, horário e tempo de resposta

## Endpoints

### Listar veículos

`GET /api/public/vehicles`

Query params: `brand`, `model`, `year`, `minPrice`, `maxPrice`, `transmission`, `fuel`, `color`, `search`, `page`, `limit`

### Detalhe do veículo

`GET /api/public/vehicles/:id`

### Busca

`GET /api/public/search` — mesmos filtros da listagem

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

### Dados da empresa

`GET /api/public/company`

Retorna nome, contato, logo e configurações públicas do site.

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

Documentação interativa completa: `http://localhost:3000/docs` (ou a porta configurada em `PORT`).
