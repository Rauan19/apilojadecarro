# Arquitetura

## Princípios

- **SOLID** e Clean Architecture
- Separação Controller → Service → Repository
- DTOs com `class-validator` / `class-transformer`
- Multi-tenant por `companyId`
- RBAC via Guards + Decorators
- Resposta padronizada via Interceptor
- Erros padronizados via Exception Filter global

## Camadas

```
Controller  → recebe HTTP, valida DTO, delega
Service     → regras de negócio
Repository  → acesso a dados (Prisma)
Prisma      → ORM (SQLite agora / PostgreSQL depois)
```

## Segurança

- Helmet
- CORS configurável
- JWT + Refresh Token
- Bcrypt para senhas
- Throttling
- ValidationPipe global (whitelist + forbidNonWhitelisted)
- Tokens de API com escopo por empresa

## Extensibilidade

Módulos NestJS isolados permitem evoluir para:

- Filas (Bull/Redis)
- WhatsApp / webhooks
- Microsserviços por domínio
- Cache e CDN para uploads
