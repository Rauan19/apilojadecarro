import { DEMO_API_TOKEN, PUBLIC_API_TOKEN } from "@/services/public.service";

/**
 * A API pública do backend autentica exclusivamente via Bearer Token de API
 * (vinculado a uma empresa), não por slug. Como este projeto ainda não expõe
 * um endpoint de resolução slug -> token, usamos aqui um token de demonstração
 * configurado via variável de ambiente para popular a loja pública em /loja
 * e /loja/:slug. Em uma implantação real, cada slug seria resolvido para o
 * token de API correspondente à empresa antes da chamada.
 */
export function getPublicToken(): string {
  return PUBLIC_API_TOKEN || DEMO_API_TOKEN;
}
