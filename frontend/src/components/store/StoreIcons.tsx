import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { className?: string };

function Icon({ className, children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

/** Ícones próprios da vitrine (sólidos) — evita o visual genérico do Lucide */
export function StorePhoneIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M7.2 3.6h2.16c.6 0 1.12.42 1.22 1l.6 3.36a1.2 1.2 0 0 1-.3 1.08l-1.32 1.32a14.4 14.4 0 0 0 4.8 4.8l1.32-1.32a1.2 1.2 0 0 1 1.08-.3l3.36.6c.58.1 1 0.62 1 1.22v2.16a1.8 1.8 0 0 1-1.92 1.8A15.6 15.6 0 0 1 3.6 5.52 1.8 1.8 0 0 1 5.4 3.6h1.8z" />
    </Icon>
  );
}

export function StoreWhatsAppIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M12 2.4A9.6 9.6 0 0 0 4.08 16.56L3 21l4.56-1.02A9.6 9.6 0 1 0 12 2.4zm5.28 13.68c-.22.62-1.28 1.14-1.78 1.2-.46.06-1.04.08-1.68-.1a11.4 11.4 0 0 1-5.04-3.18 5.76 5.76 0 0 1-1.44-2.76c-.12-.66.06-1.32.48-1.8.22-.24.5-.36.8-.36h.58c.2 0 .46-.08.72.54.28.66.94 2.28 1.02 2.44.08.16.14.36 0 .54-.12.18-.18.3-.36.48-.18.18-.36.4-.16.78.2.36.9 1.48 1.94 2.4 1.32 1.16 2.42 1.52 2.82 1.7.4.16.62.14.84-.08.24-.24.98-1.14 1.24-1.54.26-.4.52-.34.86-.2.34.14 2.16 1.02 2.52 1.2.36.18.6.28.68.42.08.16.08.9-.14 1.52z" />
    </Icon>
  );
}

export function StoreSearchIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M10.5 3.6a6.9 6.9 0 1 0 4.26 12.3l3.42 3.42a1.2 1.2 0 0 0 1.7-1.7l-3.42-3.42A6.9 6.9 0 0 0 10.5 3.6zm0 2.4a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9z" />
    </Icon>
  );
}

export function StoreSpeedIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M12 3a9 9 0 0 0-9 9v.6c0 .66.54 1.2 1.2 1.2h1.08A6.72 6.72 0 0 1 12 6.72 6.72 6.72 0 0 1 18.72 13.8H19.8c.66 0 1.2-.54 1.2-1.2V12a9 9 0 0 0-9-9zm1.62 7.02-4.08 4.08a1.2 1.2 0 1 0 1.7 1.7l4.08-4.08a1.2 1.2 0 1 0-1.7-1.7zM5.4 18h13.2a1.2 1.2 0 1 1 0 2.4H5.4a1.2 1.2 0 1 1 0-2.4z" />
    </Icon>
  );
}

export function StoreFuelIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M4.8 3.6A1.2 1.2 0 0 0 3.6 4.8v14.4A1.2 1.2 0 0 0 4.8 20.4h8.4a1.2 1.2 0 0 0 1.2-1.2v-6h.6a1.8 1.8 0 0 1 1.8 1.8v1.8a3 3 0 1 0 6 0V9.3a1.8 1.8 0 0 0-.54-1.28l-2.04-2.04a1.2 1.2 0 1 0-1.7 1.7l1.28 1.28v6.84a.6.6 0 1 1-1.2 0v-1.8a4.2 4.2 0 0 0-4.2-4.2h-.6V4.8A1.2 1.2 0 0 0 13.2 3.6H4.8zm1.2 2.4h6v3.6h-6V6z" />
    </Icon>
  );
}

export function StoreGearIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M12 7.2a4.8 4.8 0 1 0 0 9.6 4.8 4.8 0 0 0 0-9.6zm0 2.4a2.4 2.4 0 1 1 0 4.8 2.4 2.4 0 0 1 0-4.8zM4.8 11.4H3a1.2 1.2 0 1 0 0 2.4h1.8a1.2 1.2 0 1 0 0-2.4zm16.2 0h-1.8a1.2 1.2 0 1 0 0 2.4H21a1.2 1.2 0 1 0 0-2.4zM12 3a1.2 1.2 0 0 0-1.2 1.2V6a1.2 1.2 0 1 0 2.4 0V4.2A1.2 1.2 0 0 0 12 3zm0 15a1.2 1.2 0 0 0-1.2 1.2V21a1.2 1.2 0 1 0 2.4 0v-1.8A1.2 1.2 0 0 0 12 18z" />
    </Icon>
  );
}

export function StoreShareIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M15.6 3a2.4 2.4 0 1 1 .48 4.75L9.9 10.98a2.4 2.4 0 1 1-.12-2.28l6.06-3.18A2.4 2.4 0 0 1 15.6 3zm0 10.8a2.4 2.4 0 0 1 .78-.13l6.06 3.18a2.4 2.4 0 1 1-.36 2.16l-6.06-3.18a2.4 2.4 0 1 1-.42-2.03zM6 9.6a2.4 2.4 0 1 1 0 4.8 2.4 2.4 0 0 1 0-4.8z" />
    </Icon>
  );
}

export function StoreSendIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M3.36 4.08a1.2 1.2 0 0 1 1.32-.24l15.6 7.2a1.2 1.2 0 0 1 0 2.16l-15.6 7.2A1.2 1.2 0 0 1 3 19.08V14.4a1.2 1.2 0 0 1 .96-1.18L12 12 3.96 10.78A1.2 1.2 0 0 1 3 9.6V4.92c0-.3.12-.58.36-.84z" />
    </Icon>
  );
}

export function StoreCalendarIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M8.4 2.4a1.2 1.2 0 0 0-1.2 1.2V4.8H5.4A2.4 2.4 0 0 0 3 7.2v12A2.4 2.4 0 0 0 5.4 21.6h13.2a2.4 2.4 0 0 0 2.4-2.4v-12a2.4 2.4 0 0 0-2.4-2.4h-1.8V3.6a1.2 1.2 0 1 0-2.4 0V4.8H9.6V3.6A1.2 1.2 0 0 0 8.4 2.4zM5.4 9.6h13.2v9.6H5.4V9.6zm2.4 2.4v2.4h2.4V12H7.8zm4.2 0v2.4h2.4V12h-2.4zm4.2 0v2.4h2.4V12h-2.4z" />
    </Icon>
  );
}

export function StorePinIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M12 2.4a6.6 6.6 0 0 0-6.6 6.6c0 4.62 5.28 11.16 5.88 11.88a.96.96 0 0 0 1.44 0c.6-.72 5.88-7.26 5.88-11.88A6.6 6.6 0 0 0 12 2.4zm0 4.2a2.4 2.4 0 1 1 0 4.8 2.4 2.4 0 0 1 0-4.8z" />
    </Icon>
  );
}

export function StoreHomeIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M11.22 3.36a1.2 1.2 0 0 1 1.56 0l7.8 6.6a1.2 1.2 0 0 1-1.56 1.8L18 10.92V18a2.4 2.4 0 0 1-2.4 2.4h-1.8a1.2 1.2 0 0 1-1.2-1.2V15.6H11.4v3.6a1.2 1.2 0 0 1-1.2 1.2H8.4A2.4 2.4 0 0 1 6 18v-7.08l-1.02.84a1.2 1.2 0 1 1-1.56-1.8l7.8-6.6z" />
    </Icon>
  );
}

export function StoreChatIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M4.8 4.2A2.4 2.4 0 0 0 2.4 6.6v8.4A2.4 2.4 0 0 0 4.8 17.4h2.4v2.64a.96.96 0 0 0 1.56.72L13.2 17.4h6A2.4 2.4 0 0 0 21.6 15V6.6a2.4 2.4 0 0 0-2.4-2.4H4.8zm2.4 4.2h9.6a1.2 1.2 0 1 1 0 2.4H7.2a1.2 1.2 0 1 1 0-2.4zm0 3.6h6a1.2 1.2 0 1 1 0 2.4h-6a1.2 1.2 0 1 1 0-2.4z" />
    </Icon>
  );
}

export function StoreCheckIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M9.9 16.62a1.2 1.2 0 0 1-1.7 0L4.5 12.9a1.2 1.2 0 1 1 1.7-1.7l2.88 2.88 7.9-7.9a1.2 1.2 0 1 1 1.7 1.7l-8.78 8.74z" />
    </Icon>
  );
}

export function StoreCarIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M6.36 7.8A2.4 2.4 0 0 1 8.58 6h6.84a2.4 2.4 0 0 1 2.22 1.8l1.08 3.6H21a1.2 1.2 0 1 1 0 2.4h-.6v3.6a1.8 1.8 0 0 1-1.8 1.8h-.6a1.8 1.8 0 0 1-1.8-1.8v-.6H8.4v.6a1.8 1.8 0 0 1-1.8 1.8h-.6A1.8 1.8 0 0 1 4.2 17.4v-3.6H3.6a1.2 1.2 0 1 1 0-2.4h1.68L6.36 7.8zM8.4 14.4a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4zm7.2 0a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4zM8.7 8.4l-.84 2.76h8.28L15.3 8.4H8.7z" />
    </Icon>
  );
}

export function StoreDoorIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M6 3.6A1.2 1.2 0 0 1 7.2 2.4h9.6A1.2 1.2 0 0 1 18 3.6v16.8a1.2 1.2 0 0 1-1.2 1.2H7.2A1.2 1.2 0 0 1 6 20.4V3.6zm8.4 7.8a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4z" />
    </Icon>
  );
}

export function StoreColorIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M12 2.4a9.6 9.6 0 0 0-1.2 19.12 1.8 1.8 0 0 0 1.92-1.8v-.72a1.68 1.68 0 0 1 1.68-1.68h2.04A3.96 3.96 0 0 0 20.4 13.2 9.6 9.6 0 0 0 12 2.4zM7.8 12a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm2.4-3.6a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3.6 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm2.4 3.6a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" />
    </Icon>
  );
}

export function StoreChevronLeftIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M14.94 5.46a1.2 1.2 0 0 1 0 1.7L10.1 12l4.84 4.84a1.2 1.2 0 1 1-1.7 1.7l-5.7-5.7a1.2 1.2 0 0 1 0-1.7l5.7-5.7a1.2 1.2 0 0 1 1.7 0z" />
    </Icon>
  );
}

export function StoreChevronRightIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M9.06 5.46a1.2 1.2 0 0 1 1.7 0l5.7 5.7a1.2 1.2 0 0 1 0 1.7l-5.7 5.7a1.2 1.2 0 1 1-1.7-1.7L13.9 12 9.06 7.16a1.2 1.2 0 0 1 0-1.7z" />
    </Icon>
  );
}

export function StoreCloseIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M6.46 6.46a1.2 1.2 0 0 1 1.7 0L12 10.3l3.84-3.84a1.2 1.2 0 1 1 1.7 1.7L13.7 12l3.84 3.84a1.2 1.2 0 1 1-1.7 1.7L12 13.7l-3.84 3.84a1.2 1.2 0 1 1-1.7-1.7L10.3 12 6.46 8.16a1.2 1.2 0 0 1 0-1.7z" />
    </Icon>
  );
}

export function StoreExpandIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M4.8 3.6h4.8a1.2 1.2 0 1 1 0 2.4H6v3.6a1.2 1.2 0 1 1-2.4 0V4.8A1.2 1.2 0 0 1 4.8 3.6zm9.6 0h4.8A1.2 1.2 0 0 1 20.4 4.8v4.8a1.2 1.2 0 1 1-2.4 0V6h-3.6a1.2 1.2 0 1 1 0-2.4zM3.6 14.4a1.2 1.2 0 0 1 1.2 1.2v3.6h3.6a1.2 1.2 0 1 1 0 2.4H4.8A1.2 1.2 0 0 1 3.6 20.4v-4.8a1.2 1.2 0 0 1 0-1.2zm15.6 0a1.2 1.2 0 0 1 1.2 1.2v4.8a1.2 1.2 0 0 1-1.2 1.2h-4.8a1.2 1.2 0 1 1 0-2.4H18v-3.6a1.2 1.2 0 0 1 1.2-1.2z" />
    </Icon>
  );
}

export function StoreMailIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M3.6 6A2.4 2.4 0 0 1 6 3.6h12A2.4 2.4 0 0 1 20.4 6v12a2.4 2.4 0 0 1-2.4 2.4H6A2.4 2.4 0 0 1 3.6 18V6zm2.4.72 5.4 4.2a1.2 1.2 0 0 0 1.44 0l5.4-4.2V6H6v.72zm0 2.76V18h12V9.48l-4.92 3.84a3.6 3.6 0 0 1-4.32 0L6 9.48z" />
    </Icon>
  );
}

export function StoreClockIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M12 2.4a9.6 9.6 0 1 0 0 19.2 9.6 9.6 0 0 0 0-19.2zm0 2.4a7.2 7.2 0 1 1 0 14.4 7.2 7.2 0 0 1 0-14.4zm.6 2.4a1.2 1.2 0 0 0-2.4 0v4.2c0 .32.12.62.36.84l2.4 2.4a1.2 1.2 0 1 0 1.7-1.7L12.6 11.1V7.2z" />
    </Icon>
  );
}

export function StoreLinkIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M10.08 13.92a3.6 3.6 0 0 1 0-5.1l2.4-2.4a3.6 3.6 0 0 1 5.1 5.1l-.96.96a1.2 1.2 0 1 1-1.7-1.7l.96-.96a1.2 1.2 0 1 0-1.7-1.7l-2.4 2.4a1.2 1.2 0 0 0 0 1.7 1.2 1.2 0 1 1-1.7 1.7zm3.84-3.84a3.6 3.6 0 0 1 0 5.1l-2.4 2.4a3.6 3.6 0 1 1-5.1-5.1l.96-.96a1.2 1.2 0 1 1 1.7 1.7l-.96.96a1.2 1.2 0 1 0 1.7 1.7l2.4-2.4a1.2 1.2 0 0 0 0-1.7 1.2 1.2 0 1 1 1.7-1.7z" />
    </Icon>
  );
}
