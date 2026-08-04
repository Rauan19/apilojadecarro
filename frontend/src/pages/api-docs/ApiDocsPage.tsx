import * as React from "react";
import { toast } from "sonner";
import { Check, Copy, Globe, KeyRound, Server, Terminal } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { API_URL } from "@/services/api";

function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copiado para a área de transferência");
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-white/10 hover:text-white",
        className
      )}
      aria-label="Copiar código"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function CodeBlock({ code, language = "bash" }: { code: string; language?: string }) {
  return (
    <div className="group relative overflow-hidden rounded-lg bg-[#0d1117] font-mono text-[13px] leading-relaxed text-slate-200">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
        <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{language}</span>
        <CopyButton text={code} />
      </div>
      <pre className="overflow-x-auto p-4">
        <code>{code}</code>
      </pre>
    </div>
  );
}

interface EndpointDoc {
  method: "GET" | "POST";
  path: string;
  title: string;
  description: string;
  params?: { name: string; type: string; description: string }[];
  body?: { name: string; type: string; required?: boolean; description: string }[];
  curl: string;
  response: string;
}

function methodBadgeClass(method: string) {
  return method === "GET" ? "bg-accent/10 text-accent border-transparent" : "bg-success/10 text-success border-transparent";
}

function EndpointCard({ endpoint }: { endpoint: EndpointDoc }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={methodBadgeClass(endpoint.method)}>{endpoint.method}</Badge>
          <code className="text-sm font-semibold">{endpoint.path}</code>
        </div>
        <CardTitle className="text-base">{endpoint.title}</CardTitle>
        <CardDescription>{endpoint.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {endpoint.params && endpoint.params.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Query params</p>
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <tbody>
                  {endpoint.params.map((param) => (
                    <tr key={param.name} className="border-b border-border last:border-0">
                      <td className="whitespace-nowrap px-3 py-2 font-mono text-xs font-medium">{param.name}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-xs text-muted-foreground">{param.type}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{param.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {endpoint.body && endpoint.body.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Body (JSON)</p>
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <tbody>
                  {endpoint.body.map((field) => (
                    <tr key={field.name} className="border-b border-border last:border-0">
                      <td className="whitespace-nowrap px-3 py-2 font-mono text-xs font-medium">
                        {field.name}
                        {field.required && <span className="text-destructive">*</span>}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-xs text-muted-foreground">{field.type}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{field.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Exemplo (cURL)</p>
          <CodeBlock code={endpoint.curl} />
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Resposta</p>
          <CodeBlock code={endpoint.response} language="json" />
        </div>
      </CardContent>
    </Card>
  );
}

export function ApiDocsPage() {
  const baseUrl = API_URL;
  const tokenPlaceholder = "SEU_TOKEN_DE_API";

  const vehicleExample = `{
  "id": "uuid-do-veiculo",
  "brand": "Toyota",
  "model": "Corolla",
  "version": "XEi 2.0 Flex Aut.",
  "year": 2022,
  "yearModel": 2023,
  "price": 128900,
  "originalPrice": 139900,
  "mileage": 42000,
  "fuel": "FLEX",
  "transmission": "AUTOMATIC",
  "color": "Prata",
  "doors": 4,
  "description": "Único dono, revisões em dia.",
  "optionals": "[\\"Ar digital\\",\\"Multimídia\\",\\"Câmera de ré\\"]",
  "status": "AVAILABLE",
  "createdAt": "2026-07-01T12:00:00.000Z",
  "updatedAt": "2026-07-10T15:30:00.000Z",
  "images": [
    {
      "id": "uuid-da-imagem",
      "url": "/uploads/empresa-.../foto.jpg",
      "order": 0
    }
  ]
}`;

  const vehicleListParams = [
    { name: "page", type: "number", description: "Página atual (padrão: 1)" },
    { name: "limit", type: "number", description: "Itens por página (padrão: 10, máx: 100)" },
    { name: "search", type: "string", description: "Busca livre por marca, modelo ou descrição" },
    { name: "brand", type: "string", description: "Filtra por marca" },
    { name: "model", type: "string", description: "Filtra por modelo" },
    { name: "year", type: "number", description: "Filtra por ano de fabricação" },
    { name: "minPrice", type: "number", description: "Preço mínimo" },
    { name: "maxPrice", type: "number", description: "Preço máximo" },
    { name: "color", type: "string", description: "Filtra por cor" },
    { name: "transmission", type: "string", description: "MANUAL | AUTOMATIC | CVT | DCT" },
    {
      name: "fuel",
      type: "string",
      description: "FLEX | GASOLINE | ETHANOL | DIESEL | ELECTRIC | HYBRID | GNV",
    },
    { name: "sortBy", type: "string", description: "Campo de ordenação (padrão: createdAt)" },
    { name: "sortOrder", type: "string", description: "asc | desc (padrão: desc)" },
  ];

  const endpoints: EndpointDoc[] = [
    {
      method: "GET",
      path: "/public/company",
      title: "Informações da empresa",
      description:
        "Retorna os dados públicos da loja associada ao token (nome, logo, contato e configurações da vitrine).",
      curl: `curl -X GET "${baseUrl}/public/company" \\\n  -H "Authorization: Bearer ${tokenPlaceholder}"`,
      response: `{
  "success": true,
  "message": "Empresa obtida com sucesso",
  "data": {
    "name": "AutoPrime Veículos",
    "slug": "autoprme",
    "logo": "/uploads/empresa-.../logo.png",
    "phone": "(11) 3456-7890",
    "email": "contato@autoprme.com.br",
    "city": "São Paulo",
    "customDomain": null,
    "settings": { "whatsapp": "5511999998888", "about": "..." }
  }
}`,
    },
    {
      method: "GET",
      path: "/public/vehicles",
      title: "Listar veículos disponíveis",
      description:
        "Lista paginada de veículos AVAILABLE da loja do token. Ideal para bots e sites externos.",
      params: vehicleListParams,
      curl: `curl -X GET "${baseUrl}/public/vehicles?page=1&limit=10&search=corolla" \\\n  -H "Authorization: Bearer ${tokenPlaceholder}"`,
      response: `{
  "success": true,
  "message": "Veículos listados com sucesso",
  "data": {
    "items": [
${vehicleExample
  .split("\n")
  .map((line) => `      ${line}`)
  .join("\n")}
    ],
    "meta": {
      "total": 5,
      "page": 1,
      "limit": 10,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
}`,
    },
    {
      method: "GET",
      path: "/public/vehicles/:id",
      title: "Detalhes de um veículo",
      description:
        "Retorna um veículo específico da loja pelo ID (somente se estiver AVAILABLE). Use o id da listagem.",
      params: [{ name: "id", type: "uuid (path)", description: "ID do veículo na URL" }],
      curl: `curl -X GET "${baseUrl}/public/vehicles/{id}" \\\n  -H "Authorization: Bearer ${tokenPlaceholder}"`,
      response: `{
  "success": true,
  "message": "Veículo encontrado",
  "data": ${vehicleExample}
}`,
    },
    {
      method: "GET",
      path: "/public/search",
      title: "Buscar veículos (alias)",
      description:
        "Mesmo comportamento de /public/vehicles. Útil para campos de busca (ex.: ?search=corolla).",
      params: vehicleListParams,
      curl: `curl -X GET "${baseUrl}/public/search?search=corolla&page=1&limit=10" \\\n  -H "Authorization: Bearer ${tokenPlaceholder}"`,
      response: `{
  "success": true,
  "message": "Busca realizada com sucesso",
  "data": {
    "items": [ /* mesmos campos do veículo na listagem */ ],
    "meta": { "total": 1, "page": 1, "limit": 10, "totalPages": 1, "hasNextPage": false, "hasPrevPage": false }
  }
}`,
    },
    {
      method: "POST",
      path: "/public/leads",
      title: "Criar lead via site",
      description: "Registra um novo lead originado do site ou bot da loja.",
      body: [
        { name: "name", type: "string", required: true, description: "Nome do interessado" },
        { name: "phone", type: "string", description: "Telefone de contato" },
        { name: "email", type: "string", description: "E-mail de contato" },
        { name: "notes", type: "string", description: "Mensagem ou observações" },
        { name: "vehicleId", type: "uuid", description: "ID do veículo de interesse" },
      ],
      curl: `curl -X POST "${baseUrl}/public/leads" \\\n  -H "Authorization: Bearer ${tokenPlaceholder}" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "name": "Maria Souza",\n    "phone": "(11) 98888-7777",\n    "email": "maria@email.com",\n    "vehicleId": "uuid-do-veiculo"\n  }'`,
      response: `{
  "success": true,
  "message": "Lead criado com sucesso",
  "data": { "id": "uuid", "name": "Maria Souza", "status": "NEW", "origin": "SITE" }
}`,
    },
    {
      method: "POST",
      path: "/public/schedule",
      title: "Agendar visita ou test-drive",
      description: "Cria um agendamento de visita ou test-drive vinculado (opcionalmente) a um veículo.",
      body: [
        { name: "name", type: "string", required: true, description: "Nome do interessado" },
        { name: "phone", type: "string", description: "Telefone de contato" },
        { name: "email", type: "string", description: "E-mail de contato" },
        { name: "date", type: "ISO date", required: true, description: "Data e hora desejadas" },
        { name: "notes", type: "string", description: "Observações do agendamento" },
        { name: "vehicleId", type: "uuid", description: "ID do veículo relacionado" },
      ],
      curl: `curl -X POST "${baseUrl}/public/schedule" \\\n  -H "Authorization: Bearer ${tokenPlaceholder}" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "name": "Carlos Lima",\n    "phone": "(11) 97777-6666",\n    "date": "2026-08-15T14:00:00.000Z",\n    "vehicleId": "uuid-do-veiculo"\n  }'`,
      response: `{
  "success": true,
  "message": "Agendamento criado com sucesso",
  "data": { "id": "uuid", "status": "PENDING", "date": "2026-08-15T14:00:00.000Z" }
}`,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Documentação da API"
        description="Referência da API pública para sites, bots e integrações de cada loja"
      />

      <Card className="mb-6 overflow-hidden border-none bg-sidebar text-sidebar-foreground">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
              <Server className="h-6 w-6" />
            </div>
            <div>
              <p className="font-display text-lg font-semibold">API REST EstoqueAuto</p>
              <p className="text-sm text-sidebar-foreground/60">Base URL para todas as requisições</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-black/20 px-4 py-2.5">
            <Globe className="h-4 w-4 text-sidebar-foreground/60" />
            <code className="text-sm">{baseUrl}</code>
            <CopyButton text={baseUrl} />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="auth" className="mb-6">
        <TabsList>
          <TabsTrigger value="auth">
            <KeyRound className="mr-1.5 h-4 w-4" /> Autenticação
          </TabsTrigger>
          <TabsTrigger value="endpoints">
            <Terminal className="mr-1.5 h-4 w-4" /> Endpoints
          </TabsTrigger>
        </TabsList>

        <TabsContent value="auth" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Como autenticar (API pública)</CardTitle>
              <CardDescription>
                O <span className="font-medium text-foreground">Bearer token</span> das rotas{" "}
                <code className="rounded bg-muted px-1 py-0.5">/public/*</code> é o{" "}
                <span className="font-medium text-foreground">token da loja</span> gerado pelo Super Admin em{" "}
                <span className="font-medium text-foreground">Tokens API</span>. Cada token fica vinculado a uma loja e
                identifica o estoque dela automaticamente.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">
                <p className="font-semibold text-foreground">Passo a passo</p>
                <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-muted-foreground">
                  <li>
                    No painel admin SaaS, abra <strong className="text-foreground">Tokens API</strong>.
                  </li>
                  <li>Selecione a loja (cliente) e gere um novo token.</li>
                  <li>Copie o token (exibido só na criação) e use no header abaixo.</li>
                  <li>
                    Ideal para bots e sites: o token <strong className="text-foreground">não expira</strong>. Só deixa
                    de funcionar se for revogado/apagado ou se a loja for bloqueada.
                  </li>
                </ol>
              </div>

              <CodeBlock code={`Authorization: Bearer ${tokenPlaceholder}`} language="header" />

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border p-4">
                  <p className="text-sm font-semibold">Token da loja (API pública)</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Gerado em <strong>Tokens API</strong>, 64 caracteres,{" "}
                    <strong className="text-foreground">sem data de expiração</strong>, vinculado a uma loja. Use em
                    todas as rotas{" "}
                    <code className="rounded bg-muted px-1 py-0.5 text-xs">/public/*</code>. Pode ser revogado a
                    qualquer momento no admin.
                  </p>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <p className="text-sm font-semibold">JWT do painel (não use no bot)</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Login do dashboard via{" "}
                    <code className="rounded bg-muted px-1 py-0.5 text-xs">POST /auth/login</code>: access ~15 min,
                    refresh ~7 dias. Serve só para o painel interno —{" "}
                    <strong className="text-foreground">não autentica a API pública</strong>.
                  </p>
                </div>
              </div>
              <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                Todas as respostas seguem o formato:{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">{`{ success, message, data, errors }`}</code>
                . URLs de imagem vêm relativas (ex.:{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">/uploads/...</code>) — monte com a origem da
                API (sem o sufixo <code className="rounded bg-muted px-1 py-0.5 text-xs">/api</code>).
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="endpoints" className="mt-4 space-y-4">
          {endpoints.map((endpoint) => (
            <EndpointCard key={endpoint.path + endpoint.method} endpoint={endpoint} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
