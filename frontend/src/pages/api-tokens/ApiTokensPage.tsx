import * as React from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Ban, Check, Copy, KeyRound, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiTokensService } from "@/services/api-tokens.service";
import { companiesService } from "@/services/companies.service";
import { getApiErrorMessage } from "@/services/api";
import { formatDateTime } from "@/lib/utils";
import type { ApiToken } from "@/types";

function CreateTokenDialog({
  open,
  onOpenChange,
  companyId,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  onCreated: (token: ApiToken) => void;
}) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset } = useForm<{ name: string }>();

  React.useEffect(() => {
    if (open) reset({ name: "" });
  }, [open, reset]);

  const mutation = useMutation({
    mutationFn: (name: string) => apiTokensService.create({ companyId, name }),
    onSuccess: (token) => {
      queryClient.invalidateQueries({ queryKey: ["api-tokens", companyId] });
      onOpenChange(false);
      onCreated(token);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo token de API</DialogTitle>
          <DialogDescription>Crie um token para integrações externas com a API pública.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit((values) => mutation.mutate(values.name))} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nome da integração</Label>
            <Input id="name" {...register("name", { required: true, minLength: 2 })} placeholder="Ex: Site institucional" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={mutation.isPending}>
              Gerar token
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TokenRevealDialog({ token, onOpenChange }: { token: ApiToken | null; onOpenChange: (open: boolean) => void }) {
  const [copied, setCopied] = React.useState(false);

  const copy = () => {
    if (!token) return;
    navigator.clipboard.writeText(token.token);
    setCopied(true);
    toast.success("Token copiado para a área de transferência");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={!!token} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Token criado com sucesso</DialogTitle>
          <DialogDescription>
            Copie e guarde este token em local seguro. Por segurança, ele não será exibido novamente.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted p-3">
          <code className="flex-1 break-all text-sm">{token?.token}</code>
          <Button type="button" size="icon" variant="outline" onClick={copy}>
            {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Concluído</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ApiTokensPage() {
  const [companyId, setCompanyId] = React.useState<string>("");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [revealToken, setRevealToken] = React.useState<ApiToken | null>(null);
  const [revoking, setRevoking] = React.useState<ApiToken | null>(null);
  const [removing, setRemoving] = React.useState<ApiToken | null>(null);
  const queryClient = useQueryClient();

  const { data: companiesData } = useQuery({
    queryKey: ["companies-picker-all"],
    queryFn: () => companiesService.list({ page: 1, limit: 100 }),
  });

  React.useEffect(() => {
    if (!companyId && companiesData?.items.length) {
      setCompanyId(companiesData.items[0].id);
    }
  }, [companiesData, companyId]);

  const { data: tokens, isLoading } = useQuery({
    queryKey: ["api-tokens", companyId],
    queryFn: () => apiTokensService.listByCompany(companyId),
    enabled: !!companyId,
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => apiTokensService.revoke(id),
    onSuccess: () => {
      toast.success("Token revogado");
      queryClient.invalidateQueries({ queryKey: ["api-tokens", companyId] });
      setRevoking(null);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => apiTokensService.remove(id),
    onSuccess: () => {
      toast.success("Token removido");
      queryClient.invalidateQueries({ queryKey: ["api-tokens", companyId] });
      setRemoving(null);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });

  const columns: DataTableColumn<ApiToken>[] = [
    {
      key: "name",
      header: "Integração",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{row.name}</span>
        </div>
      ),
    },
    { key: "token", header: "Token", cell: (row) => <code className="text-xs text-muted-foreground">{row.token}</code> },
    {
      key: "active",
      header: "Status",
      cell: (row) => <Badge variant={row.active ? "success" : "secondary"}>{row.active ? "Ativo" : "Revogado"}</Badge>,
    },
    {
      key: "lastUsedAt",
      header: "Último uso",
      cell: (row) => <span className="text-muted-foreground">{row.lastUsedAt ? formatDateTime(row.lastUsedAt) : "Nunca usado"}</span>,
    },
    {
      key: "createdAt",
      header: "Criado em",
      cell: (row) => <span className="text-muted-foreground">{formatDateTime(row.createdAt)}</span>,
    },
    {
      key: "actions",
      header: "",
      headerClassName: "w-12",
      cell: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {row.active && (
              <DropdownMenuItem onClick={() => setRevoking(row)}>
                <Ban /> Revogar
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onClick={() => setRemoving(row)}>
              <Trash2 /> Remover
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Tokens de API"
        description="Gere e revogue tokens de integração da API pública por cliente"
        actions={
          <Button onClick={() => setCreateOpen(true)} disabled={!companyId}>
            <Plus /> Novo token
          </Button>
        }
      />

      <div className="mb-4 max-w-sm">
        <Label className="mb-1.5 block text-xs text-muted-foreground">Cliente</Label>
        <Select value={companyId} onValueChange={setCompanyId}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione um cliente" />
          </SelectTrigger>
          <SelectContent>
            {companiesData?.items.map((company) => (
              <SelectItem key={company.id} value={company.id}>
                {company.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!companyId ? (
        <EmptyState
          icon={KeyRound}
          title="Selecione um cliente"
          description="Escolha um cliente (loja) para visualizar e criar tokens de API."
        />
      ) : (
        <DataTable
          columns={columns}
          data={tokens ?? []}
          isLoading={isLoading}
          keyExtractor={(row) => row.id}
          emptyTitle="Nenhum token cadastrado"
          emptyDescription="Crie um token para permitir integrações externas com a API pública."
        />
      )}

      {companyId && (
        <CreateTokenDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          companyId={companyId}
          onCreated={setRevealToken}
        />
      )}

      <TokenRevealDialog token={revealToken} onOpenChange={(open) => !open && setRevealToken(null)} />

      <ConfirmDialog
        open={!!revoking}
        onOpenChange={(open) => !open && setRevoking(null)}
        title={`Revogar token "${revoking?.name}"?`}
        description="O token deixará de funcionar imediatamente para integrações externas."
        destructive={false}
        loading={revokeMutation.isPending}
        onConfirm={() => revoking && revokeMutation.mutate(revoking.id)}
      />

      <ConfirmDialog
        open={!!removing}
        onOpenChange={(open) => !open && setRemoving(null)}
        title={`Remover token "${removing?.name}"?`}
        description="Esta ação é irreversível."
        loading={removeMutation.isPending}
        onConfirm={() => removing && removeMutation.mutate(removing.id)}
      />
    </div>
  );
}
