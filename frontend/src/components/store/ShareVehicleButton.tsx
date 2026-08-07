import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { StoreCheckIcon, StoreLinkIcon, StoreShareIcon } from "@/components/store/StoreIcons";

interface ShareVehicleButtonProps {
  /** Só para acessibilidade / fallback visual — o share envia apenas a URL. */
  title?: string;
  url?: string;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
}

export function ShareVehicleButton({
  title = "Veículo",
  url,
  className,
  variant = "outline",
}: ShareVehicleButtonProps) {
  const [copied, setCopied] = React.useState(false);
  const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");
  const canNativeShare = typeof navigator !== "undefined" && "share" in navigator;

  const share = async () => {
    if (!shareUrl) return;

    // Só a URL: Instagram e outros apps do celular rejeitam/ignoram
    // quando vem texto + link colados.
    if (canNativeShare) {
      try {
        await navigator.share({ url: shareUrl });
        return;
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link do veículo copiado!");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar o link");
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      className={className}
      onClick={share}
      aria-label={`Compartilhar ${title}`}
    >
      {copied ? (
        <StoreCheckIcon className="h-4 w-4" />
      ) : canNativeShare ? (
        <StoreShareIcon className="h-4 w-4" />
      ) : (
        <StoreLinkIcon className="h-4 w-4" />
      )}
      {copied ? "Link copiado" : "Compartilhar"}
    </Button>
  );
}
