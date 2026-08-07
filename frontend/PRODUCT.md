# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Donos e equipe de lojas de veículos usados (revendas multimarcas de pequeno/médio porte no Brasil) que gerenciam estoque, leads, propostas e o atendimento da loja pelo painel — perfis Super Admin (multi-loja) e Admin/vendedor da loja (Role: SUPER_ADMIN, STORE_ADMIN no schema). Também compradores finais que navegam a vitrine pública da loja.

## Product Purpose

EstoqueAuto é um SaaS multi-tenant para gestão de lojas de veículos: cada loja cadastra e gerencia seu próprio estoque de carros, leads, propostas, clientes e agendamentos num painel administrativo, e publica automaticamente uma vitrine pública (`/loja/:slug`) no estilo marketplace pra quem compra. Inclui um bot de WhatsApp por loja (Evolution API) que responde automaticamente sobre estoque, faixa de preço, financiamento e atendimento.

## Positioning

Painel completo de operação de loja de veículos + vitrine pública + bot de WhatsApp integrado, tudo sob o mesmo domínio por loja (multi-tenant via slug/subdomínio), sem precisar contratar ferramentas separadas de CRM, site e atendimento.

## Operating Context

- Painel administrativo (`/dashboard`, CRUDs de veículos/clientes/leads/propostas/vendedores/configurações) — usado no dia a dia por quem trabalha na loja, geralmente em desktop.
- Vitrine pública (`/loja/:slug`) — usada por compradores em qualquer dispositivo, estilo marketplace de veículos.
- Bot de WhatsApp — atende o cliente final automaticamente fora do painel, mas é configurado e monitorado dentro do painel (Configurações → WhatsApp).

## Capabilities and Constraints

- Stack: React 19 + Vite + Tailwind CSS v4 + Radix/shadcn-style UI primitives (`src/components/ui`) + TanStack Query. Ícones atualmente via `lucide-react` (biblioteca padrão, contribui pra visual genérico).
- Backend: NestJS + Prisma multi-tenant (companyId em quase todo modelo).
- Multi-tenant real: cada loja só vê e opera seus próprios dados; Super Admin enxerga entre lojas.

## Brand Commitments

- Nome: EstoqueAuto (domínio estoqueauto.com).
- Cor primária vermelho `#E31C23` (`hsl(357 78% 50%)`) e grafite/charcoal `#12141A` como cor de marca — identidade confirmada, preservar.
- Tipografia: Archivo (display) + Source Sans 3 (corpo).
- Logo/mark em `src/assets` e `public/brand` (`BrandLogo`, `estoqueauto-mark.png`, `favicon.svg`).

## Evidence on Hand

- Painel e vitrine já implementados e funcionando (não é greenfield); telas internas do painel (dashboard, veículos, clientes, leads, propostas, vendedores, configurações) usam fundo branco/cinza claro com cards brancos — é exatamente essa camada que o usuário pediu pra modernizar, tirando a "cara de IA genérica" (grid de cards com ícone outline dentro de círculo, tipografia sem hierarquia forte).
- Login e a vitrine pública (`/loja`) já têm tratamento visual mais autoral (coluna seca + foto full-bleed, grade de anúncios estilo marketplace) — servem de referência de qualidade a igualar dentro do painel.

## Product Principles

- Multi-tenant de verdade: nenhuma tela pode vazar dado de uma loja pra outra.
- O painel é ferramenta de trabalho (Operate): escaneabilidade e velocidade de tarefa vêm antes de expressão visual, mas isso não justifica genérico — precisão nos detalhes é onde a marca aparece.
- Vermelho + grafite é a identidade EstoqueAuto; toda evolução visual acontece dentro dessa paleta, não contra ela.
- Bot de WhatsApp e painel compartilham a mesma marca — o que o cliente final vê (mensagens do bot) e o que a loja vê (painel) devem parecer do mesmo produto.

## Accessibility & Inclusion

Nenhum requisito específico levantado pelo usuário até agora; seguir práticas padrão de contraste e foco navegável (Radix já cobre boa parte disso).
