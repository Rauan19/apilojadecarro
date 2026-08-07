import * as React from "react";

/**
 * Showroom noturno em canvas 2.5D — pátio, holofotes e plataforma.
 * Sem foto de estoque e sem silhueta “ilustração de carro”.
 */
export function LoginShowroomScene() {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const pointer = React.useRef({ x: 0, y: 0 });

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let running = true;
    let w = 0;
    let h = 0;
    let dpr = 1;
    const t0 = performance.now();
    let px = 0;
    let py = 0;

    type Mote = { x: number; y: number; r: number; a: number; s: number };
    const motes: Mote[] = Array.from({ length: 42 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.4 + Math.random() * 1.5,
      a: 0.1 + Math.random() * 0.3,
      s: 0.04 + Math.random() * 0.12,
    }));

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      pointer.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    const paint = (now: number) => {
      if (!running) return;
      const t = reduceMotion ? 0 : (now - t0) / 1000;
      px += (pointer.current.x - px) * 0.05;
      py += (pointer.current.y - py) * 0.05;

      const isMobile = w < 900;

      // parede / teto
      const wall = ctx.createLinearGradient(0, 0, 0, h);
      wall.addColorStop(0, "#10131a");
      wall.addColorStop(0.42, "#1a1f28");
      wall.addColorStop(0.55, "#242a35");
      wall.addColorStop(1, "#0c0e13");
      ctx.fillStyle = wall;
      ctx.fillRect(0, 0, w, h);

      const horizon = isMobile ? h * 0.3 + py * 5 : h * 0.5 + py * 8;
      const vpX = (isMobile ? w * 0.5 : w * 0.4) + px * 24;

      // estrutura do teto (vigas)
      ctx.strokeStyle = "rgba(255,255,255,0.045)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 5; i++) {
        const y = h * (0.04 + i * 0.035);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // trilho de holofotes
      const lights = isMobile
        ? [0.22, 0.5, 0.78]
        : [0.14, 0.32, 0.5, 0.68, 0.86];
      for (let i = 0; i < lights.length; i++) {
        const lx =
          w * lights[i]! +
          Math.sin(t * 0.35 + i * 1.3) * (reduceMotion ? 0 : 8) +
          px * 6;
        const red = i === Math.floor(lights.length / 2);
        const cone = ctx.createRadialGradient(lx, h * 0.08, 2, lx, horizon + 30, h * (isMobile ? 0.35 : 0.55));
        cone.addColorStop(0, red ? "rgba(227,28,35,0.22)" : "rgba(255,225,185,0.16)");
        cone.addColorStop(0.35, red ? "rgba(227,28,35,0.06)" : "rgba(255,225,185,0.04)");
        cone.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = cone;
        ctx.fillRect(0, 0, w, h);

        // corpo da luminária
        ctx.fillStyle = "#0a0b0e";
        ctx.fillRect(lx - 18, h * 0.055, 36, 8);
        ctx.fillStyle = red ? "rgba(227,28,35,0.85)" : "rgba(255,240,210,0.7)";
        ctx.beginPath();
        ctx.ellipse(lx, h * 0.072, 14, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // piso polido
      const floor = ctx.createLinearGradient(0, horizon, 0, h);
      floor.addColorStop(0, "#3e4654");
      floor.addColorStop(0.25, "#2a303c");
      floor.addColorStop(0.7, "#181c24");
      floor.addColorStop(1, "#0a0c10");
      ctx.fillStyle = floor;
      ctx.fillRect(0, horizon, w, h - horizon);

      // grade do pátio
      const scroll = reduceMotion ? 0 : (t * 38) % 64;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, horizon, w, h - horizon);
      ctx.clip();

      for (let i = 0; i < 14; i++) {
        const p = (i / 14 + scroll / 64 / 14) % 1;
        const y = horizon + Math.pow(p, 1.5) * (h - horizon);
        ctx.strokeStyle = `rgba(255,255,255,${0.035 + p * 0.12})`;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      for (let i = -18; i <= 18; i++) {
        const edgeX = vpX + i * (w / (isMobile ? 10 : 15));
        ctx.strokeStyle = i % 5 === 0 ? "rgba(227,28,35,0.11)" : "rgba(255,255,255,0.04)";
        ctx.beginPath();
        ctx.moveTo(vpX, horizon);
        ctx.lineTo(edgeX, h + 40);
        ctx.stroke();
      }
      ctx.restore();

      // vagas do pátio (marcação de estacionamento)
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, horizon, w, h - horizon);
      ctx.clip();
      const bayCount = isMobile ? 3 : 5;
      for (let i = 0; i < bayCount; i++) {
        const t0 = (i + 0.5) / bayCount - 0.5;
        const nearL = vpX + t0 * w * 0.9 - (isMobile ? 40 : 70);
        const nearR = vpX + t0 * w * 0.9 + (isMobile ? 40 : 70);
        const farL = vpX + t0 * w * 0.25 - 8;
        const farR = vpX + t0 * w * 0.25 + 8;
        const yNear = h - h * 0.04;
        const yFar = horizon + (h - horizon) * 0.22;
        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(nearL, yNear);
        ctx.lineTo(farL, yFar);
        ctx.lineTo(farR, yFar);
        ctx.lineTo(nearR, yNear);
        ctx.stroke();
      }
      ctx.restore();

      // filete do horizonte
      const hz = ctx.createLinearGradient(0, horizon, w, horizon);
      hz.addColorStop(0, "rgba(255,220,180,0)");
      hz.addColorStop(0.35, "rgba(227,28,35,0.45)");
      hz.addColorStop(0.5, "rgba(255,245,230,0.35)");
      hz.addColorStop(0.7, "rgba(227,28,35,0.3)");
      hz.addColorStop(1, "rgba(255,220,180,0)");
      ctx.strokeStyle = hz;
      ctx.lineWidth = 1.75;
      ctx.beginPath();
      ctx.moveTo(0, horizon);
      ctx.lineTo(w, horizon);
      ctx.stroke();

      // pilares laterais
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      const pillarW = isMobile ? 18 : 36;
      ctx.fillRect(0, 0, pillarW, horizon);
      ctx.fillRect(w - pillarW, 0, pillarW, horizon);
      ctx.fillStyle = "rgba(255,255,255,0.04)";
      ctx.fillRect(pillarW, 0, 1, horizon);
      ctx.fillRect(w - pillarW - 1, 0, 1, horizon);

      // plataforma de exposição
      const platX = (isMobile ? w * 0.5 : w * 0.38) + px * 12;
      const platY = isMobile ? horizon + h * 0.045 : horizon + h * 0.18;
      const rx = isMobile ? Math.min(w * 0.38, 150) : Math.min(w * 0.22, 240);
      const ry = isMobile ? 16 : 32;
      const spin = reduceMotion ? 0.4 : t * 0.7;

      // sombra da plataforma
      const platShadow = ctx.createRadialGradient(platX, platY, 10, platX, platY, rx * 1.2);
      platShadow.addColorStop(0, "rgba(0,0,0,0.5)");
      platShadow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = platShadow;
      ctx.beginPath();
      ctx.ellipse(platX, platY + 6, rx * 1.05, ry * 1.4, 0, 0, Math.PI * 2);
      ctx.fill();

      // disco interno (reflexo)
      const disc = ctx.createRadialGradient(platX, platY - ry * 0.3, 4, platX, platY, rx);
      disc.addColorStop(0, "rgba(80,90,105,0.55)");
      disc.addColorStop(0.5, "rgba(40,46,56,0.4)");
      disc.addColorStop(1, "rgba(20,24,30,0.15)");
      ctx.fillStyle = disc;
      ctx.beginPath();
      ctx.ellipse(platX, platY, rx * 0.88, ry * 0.88, 0, 0, Math.PI * 2);
      ctx.fill();

      // anéis
      ctx.strokeStyle = "rgba(255,255,255,0.14)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(platX, platY, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(platX, platY, rx * 0.72, ry * 0.72, 0, 0, Math.PI * 2);
      ctx.stroke();

      // arco vermelho em movimento (marca)
      ctx.strokeStyle = "#E31C23";
      ctx.lineWidth = 3.5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.ellipse(platX, platY, rx, ry, 0, spin, spin + 1.25);
      ctx.stroke();

      // segundo arco mais suave
      ctx.strokeStyle = "rgba(255,220,180,0.35)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(platX, platY, rx, ry, 0, spin + Math.PI, spin + Math.PI + 0.7);
      ctx.stroke();

      // marcadores de ângulo na plataforma
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2 + spin * 0.15;
        const inner = 0.82;
        const x1 = platX + Math.cos(a) * rx * inner;
        const y1 = platY + Math.sin(a) * ry * inner;
        const x2 = platX + Math.cos(a) * rx * 0.95;
        const y2 = platY + Math.sin(a) * ry * 0.95;
        ctx.strokeStyle = i % 3 === 0 ? "rgba(227,28,35,0.35)" : "rgba(255,255,255,0.1)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // pedestal central baixo
      const pedW = rx * 0.28;
      const pedH = isMobile ? 10 : 18;
      const pedGrad = ctx.createLinearGradient(platX, platY - pedH, platX, platY);
      pedGrad.addColorStop(0, "#4a5260");
      pedGrad.addColorStop(1, "#1a1e26");
      ctx.fillStyle = pedGrad;
      ctx.beginPath();
      ctx.ellipse(platX, platY - pedH * 0.3, pedW, pedH * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(227,28,35,0.5)";
      ctx.beginPath();
      ctx.ellipse(platX, platY - pedH * 0.3, pedW * 0.35, pedH * 0.18, 0, 0, Math.PI * 2);
      ctx.fill();

      // partículas de luz
      for (const m of motes) {
        const mx = m.x * w + Math.sin(t * m.s + m.x * 9) * (reduceMotion ? 0 : 12) + px * 8;
        const my =
          m.y * horizon * 0.9 +
          ((t * m.s * 20 + m.y * 50) % (horizon + 10)) * (reduceMotion ? 0 : 1);
        ctx.fillStyle = `rgba(255,230,200,${m.a})`;
        ctx.beginPath();
        ctx.arc(mx, my % (horizon + 5), m.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // vinheta
      const vig = ctx.createRadialGradient(platX, h * 0.4, h * 0.1, w * 0.45, h * 0.5, h * 0.95);
      vig.addColorStop(0, "rgba(0,0,0,0)");
      vig.addColorStop(0.65, "rgba(0,0,0,0.12)");
      vig.addColorStop(1, "rgba(0,0,0,0.5)");
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, w, h);

      if (!reduceMotion) raf = requestAnimationFrame(paint);
    };

    const onResize = () => {
      resize();
      if (reduceMotion) paint(performance.now());
    };

    resize();
    paint(performance.now());
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("resize", onResize);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="login-scene absolute inset-0 h-full w-full"
      aria-hidden
    />
  );
}
