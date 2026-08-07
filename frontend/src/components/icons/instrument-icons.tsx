import type { SVGProps } from "react";

/**
 * Conjunto de ícones próprio do EstoqueAuto — grafismo técnico/instrumento
 * (traço reto, cantos vivos, cortes a 45°) em vez do contorno arredondado
 * padrão de bibliotecas genéricas. Cada ícone é desenhado à mão em vez de
 * importado de um pacote de ícones comum.
 */
type IconProps = SVGProps<SVGSVGElement>;

function Base({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="square"
      strokeLinejoin="miter"
      {...props}
    >
      {children}
    </svg>
  );
}

export function IconOverview(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4.5 16.5a7.5 7.5 0 1 1 15 0" />
      <path d="M12 12 16 7.5" />
      <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
      <path d="M4 19.5h16" strokeWidth={1.1} opacity={0.5} />
    </Base>
  );
}

export function IconVehicle(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M3 15.5V13l2-3.5h3l1-2h6l1 2h3l2 3.5v2.5" />
      <path d="M3 15.5h18" />
      <path d="M6.5 13.5h11" strokeWidth={1.1} opacity={0.5} />
      <rect x="6" y="16" width="2" height="2" transform="rotate(45 7 17)" />
      <rect x="16" y="16" width="2" height="2" transform="rotate(45 17 17)" />
    </Base>
  );
}

export function IconStockRows(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 7h9" />
      <path d="M4 12h15" />
      <path d="M4 17h11" />
      <path d="M20 7v.01M20 17v.01" strokeWidth={2.2} />
    </Base>
  );
}

export function IconCustomers(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="9" cy="9" r="3" />
      <circle cx="16" cy="14.5" r="2.4" />
      <path d="M4.5 19c.6-2.4 2.3-3.7 4.5-3.7s3.7 1 4.3 2.6" />
      <path d="M13 17.6c.4-1.3 1.4-2 3-2s2.7.9 3 2.1" />
    </Base>
  );
}

export function IconLeads(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="6" y="6" width="12" height="12" transform="rotate(45 12 12)" />
      <rect x="9.5" y="9.5" width="5" height="5" transform="rotate(45 12 12)" strokeWidth={1.1} opacity={0.6} />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </Base>
  );
}

export function IconProposal(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M6 3.5h9l3 3v14H6z" />
      <path d="M15 3.5v3h3" />
      <path d="M8.5 12h7M8.5 15.5h5" strokeWidth={1.1} />
    </Base>
  );
}

export function IconSellers(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 3l7 2.6v5.4c0 4.2-2.9 7-7 9-4.1-2-7-4.8-7-9V5.6z" />
      <path d="M9 12l2 2 4-4.2" strokeWidth={1.4} />
    </Base>
  );
}

export function IconUsers(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="8.3" r="3.2" />
      <path d="M5.5 19.5c.9-3.3 3-5 6.5-5s5.6 1.7 6.5 5" />
    </Base>
  );
}

export function IconSettings(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M7 5v9M7 17.5V19" />
      <path d="M12 5v3.5M12 11.5V19" />
      <path d="M17 5v6.5M17 14.5V19" />
      <circle cx="7" cy="11.5" r="1.7" fill="currentColor" stroke="none" />
      <circle cx="12" cy="9.5" r="1.7" fill="currentColor" stroke="none" />
      <circle cx="17" cy="12.5" r="1.7" fill="currentColor" stroke="none" />
    </Base>
  );
}

export function IconProfile(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4.5 18.5a7.5 7.5 0 0 1 15 0" strokeWidth={1.1} opacity={0.55} />
      <circle cx="12" cy="9.3" r="3.1" />
      <path d="M6.7 19c.8-2.9 2.6-4.4 5.3-4.4s4.5 1.5 5.3 4.4" />
    </Base>
  );
}

export function IconCompanies(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 19.5V13l3-2 3 2v6.5" />
      <path d="M10 19.5V8l4-2.5 4 2.5v11.5" />
      <path d="M3 19.5h18" />
      <path d="M13 11h2M13 14.5h2" strokeWidth={1.1} opacity={0.6} />
    </Base>
  );
}

export function IconPlans(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M11.2 3.5h5.3L20 7.5v5.3L12.5 20.5 3.5 11.5z" />
      <circle cx="15.2" cy="8.3" r="1.3" fill="currentColor" stroke="none" />
    </Base>
  );
}

export function IconTokens(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="8" cy="12" r="4" />
      <path d="M11.5 12H20M16 12v3M19 12v3" />
    </Base>
  );
}

export function IconLogs(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M6 3.5h10l3 3.2V20H6z" />
      <path d="M16 3.5v3.2h3" />
      <path d="M9 11h6M9 14.5h6M9 17.5h3.5" strokeWidth={1.1} />
    </Base>
  );
}

export function IconCode(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M9 8 5 12l4 4" />
      <path d="M15 8l4 4-4 4" />
      <path d="M13 6.5 11 17.5" strokeWidth={1.1} opacity={0.6} />
    </Base>
  );
}

export function IconStorefront(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 9.5 6 4h12l2 5.5" />
      <path d="M4 9.5h16v10H4z" />
      <path d="M9.5 19.5v-5h5v5" strokeWidth={1.1} />
    </Base>
  );
}

export function IconLogout(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M11 4.5H6v15h5" />
      <path d="M20 12H10.5" />
      <path d="M15.5 8 20 12l-4.5 4" />
    </Base>
  );
}

export function IconRevenue(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 18.5 9.5 12l4 3.5L20 6.5" />
      <path d="M14.5 6.5H20v5.5" />
      <path d="M4 20.5h16" strokeWidth={1.1} opacity={0.5} />
    </Base>
  );
}

export function IconProfit(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M9.5 9.5h3.2a1.8 1.8 0 0 1 0 3.6H9.5" strokeWidth={1.3} />
      <path d="M10.5 9v6.5M9.5 13.1h3" strokeWidth={1.3} />
    </Base>
  );
}

export function IconSubscription(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="4" y="5.5" width="16" height="13" />
      <path d="M4 9.5h16" />
      <path d="M7 13h4" strokeWidth={1.3} />
    </Base>
  );
}

export function IconMenuTicks(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 6.5h16" />
      <path d="M4 12h11" />
      <path d="M4 17.5h16" />
    </Base>
  );
}
