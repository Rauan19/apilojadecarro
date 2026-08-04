import type { ComponentType, ReactNode } from "react";
import type { SocialNetwork } from "@/utils/socialLinks";

function IconShell({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      {children}
    </svg>
  );
}

export function InstagramIcon({ className }: { className?: string }) {
  return (
    <IconShell className={className}>
      <path d="M12 7.2A4.8 4.8 0 1 0 12 16.8 4.8 4.8 0 0 0 12 7.2zm0 7.92A3.12 3.12 0 1 1 12 8.88a3.12 3.12 0 0 1 0 6.24z" />
      <circle cx="17.52" cy="6.48" r="1.14" />
      <path d="M16.8 2.4H7.2A4.8 4.8 0 0 0 2.4 7.2v9.6a4.8 4.8 0 0 0 4.8 4.8h9.6a4.8 4.8 0 0 0 4.8-4.8V7.2a4.8 4.8 0 0 0-4.8-4.8zm3.12 14.4a3.12 3.12 0 0 1-3.12 3.12H7.2a3.12 3.12 0 0 1-3.12-3.12V7.2A3.12 3.12 0 0 1 7.2 4.08h9.6a3.12 3.12 0 0 1 3.12 3.12z" />
    </IconShell>
  );
}

export function FacebookIcon({ className }: { className?: string }) {
  return (
    <IconShell className={className}>
      <path d="M14.4 9.6h2.4V6h-2.4c-2 0-3.6 1.6-3.6 3.6v1.2H8.4v3.6h2.4V22h3.6v-7.6h2.16l.72-3.6H14.4V9.6c0-.48.24-.96.96-.96z" />
    </IconShell>
  );
}

export function YoutubeIcon({ className }: { className?: string }) {
  return (
    <IconShell className={className}>
      <path d="M21.6 7.8a2.64 2.64 0 0 0-1.86-1.86C18.12 5.52 12 5.52 12 5.52s-6.12 0-7.74.42A2.64 2.64 0 0 0 2.4 7.8 27.6 27.6 0 0 0 2 12a27.6 27.6 0 0 0 .4 4.2 2.64 2.64 0 0 0 1.86 1.86c1.62.42 7.74.42 7.74.42s6.12 0 7.74-.42a2.64 2.64 0 0 0 1.86-1.86A27.6 27.6 0 0 0 22 12a27.6 27.6 0 0 0-.4-4.2zM10.08 15.12V8.88L15.36 12l-5.28 3.12z" />
    </IconShell>
  );
}

export function TikTokIcon({ className }: { className?: string }) {
  return (
    <IconShell className={className}>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.3a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V9.18a8.16 8.16 0 0 0 4.76 1.52V7.25a4.85 4.85 0 0 1-1-.56z" />
    </IconShell>
  );
}

export const socialIcons: Record<SocialNetwork, ComponentType<{ className?: string }>> = {
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  youtube: YoutubeIcon,
  tiktok: TikTokIcon,
};
