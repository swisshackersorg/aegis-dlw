import React, { useEffect, useRef, useState } from "react";
import bathroomImg from "../../assets/120a7343048e7616adfff781c4b53ee0f69a0cc3.png";

export type Pose = "stand" | "sit" | "fall";

interface BathroomLayoutProps {
  pose: Pose;
  personPos: { x: number; y: number };
  onClickMove: (pos: { x: number; y: number }) => void;
  personVisible: boolean;
  wifiDisconnected: boolean;
}

// Muted palette matching the architectural floor-plan style
const COLORS = {
  tx: { fill: "#5a7e8c", stroke: "#3e6270", label: "#4a7080", labelLight: "#6a96a4" },
  rx: { fill: "#8c7a5a", stroke: "#6e5e3e", label: "#7a6a4e", labelLight: "#a49474" },
  router: { fill: "#6a8c75", stroke: "#4e6e59", label: "#5a7a65", labelLight: "#7aa48f" },
  stand: { fill: "#7c9a8e", stroke: "#5a7d6e", text: "#5a7d6e" },
  sit: { fill: "#b8976a", stroke: "#9a7c54", text: "#9a7c54" },
  fall: { fill: "#b56b5f", stroke: "#944f44", text: "#944f44" },
  signal: { direct: "rgba(90,126,140,0.25)", particle: "rgba(90,126,140," },
  signalFall: { particle: "rgba(181,107,95," },
  path: {
    stand: "rgba(124,154,142,0.35)",
    sit: "rgba(184,151,106,0.35)",
    fall: "rgba(181,107,95,0.4)",
  },
};

export function BathroomLayout({ pose, personPos, onClickMove, personVisible, wifiDisconnected }: BathroomLayoutProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const timeRef = useRef(0);
  const [dimensions, setDimensions] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const obs = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({ w: entry.contentRect.width, h: entry.contentRect.height });
      }
    });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    onClickMove({ x: Math.max(0.03, Math.min(0.97, x)), y: Math.max(0.03, Math.min(0.97, y)) });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dimensions.w === 0) return;
    const ctx = canvas.getContext("2d")!;
    const dpr = window.devicePixelRatio;
    canvas.width = dimensions.w * dpr;
    canvas.height = dimensions.h * dpr;
    ctx.scale(dpr, dpr);

    const W = dimensions.w;
    const H = dimensions.h;

    const txX = W * 0.12;
    const txY = H * 0.825;
    const rxX = W * 0.765;
    const rxY = H * 0.22;
    const routerX = W * 0.87;
    const routerY = H * 0.92;

    const pX = personPos.x * W;
    const pY = personPos.y * H;

    const isFall = pose === "fall";
    const isSit = pose === "sit";
    const poseColors = isFall ? COLORS.fall : isSit ? COLORS.sit : COLORS.stand;

    function draw() {
      timeRef.current += 0.02;
      const t = timeRef.current;
      ctx.clearRect(0, 0, W, H);

      // Signal waves from TX — subtle arcs (only when person is visible)
      if (personVisible) {
        for (let i = 0; i < 4; i++) {
          const phase = (t * 0.6 + i * 0.35) % 1.5;
          const alpha = Math.max(0, 1 - phase / 3) * 0.12;
          const radius = phase * W * 0.22;
          ctx.beginPath();
          ctx.arc(txX, txY, radius, -Math.PI * 0.5, 0);
          ctx.strokeStyle = `rgba(90,126,140,${alpha})`;
          ctx.lineWidth = 3;
          ctx.stroke();
        }
      }

      // Direct path TX -> RX (only when person is visible)
      if (personVisible) {
        ctx.beginPath();
        ctx.setLineDash([5, 4]);
        ctx.moveTo(txX, txY);
        ctx.lineTo(rxX, rxY);
        ctx.strokeStyle = COLORS.signal.direct;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Router -> RX path (when person is hidden AND wifi is connected)
      if (!personVisible && !wifiDisconnected) {
        ctx.beginPath();
        ctx.setLineDash([5, 4]);
        ctx.moveTo(routerX, routerY);
        ctx.lineTo(rxX, rxY);
        ctx.strokeStyle = "rgba(106,140,117,0.25)"; // Router color with transparency
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.setLineDash([]);

        // Router signal particles
        for (let i = 0; i < 5; i++) {
          const progress = (t * 0.3 + i / 5) % 1;
          const px = routerX + (rxX - routerX) * progress;
          const py = routerY + (rxY - routerY) * progress;
          const perpX = -(rxY - routerY);
          const perpY = rxX - routerX;
          const len = Math.sqrt(perpX * perpX + perpY * perpY) || 1;
          const waveAmp = 2.5;
          const offset = Math.sin(progress * Math.PI * 3 + t * 2) * waveAmp;
          const fx = px + (perpX / len) * offset;
          const fy = py + (perpY / len) * offset;
          const alpha = Math.sin(progress * Math.PI) * 0.55;
          ctx.beginPath();
          ctx.arc(fx, fy, 2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(106,140,117,${alpha})`;
          ctx.fill();
        }
      }

      // Reflected path through person
      if (personVisible) {
        ctx.beginPath();
        ctx.setLineDash([3, 3]);
        ctx.moveTo(txX, txY);
        ctx.lineTo(pX, pY);
        ctx.lineTo(rxX, rxY);
        ctx.strokeStyle = isFall ? COLORS.path.fall : isSit ? COLORS.path.sit : COLORS.path.stand;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Signal particles (only when person is visible)
      if (personVisible) {
        const particleBase = isFall ? COLORS.signalFall.particle : COLORS.signal.particle;
        for (let i = 0; i < 5; i++) {
          const progress = (t * 0.3 + i / 5) % 1;
          const px = txX + (rxX - txX) * progress;
          const py = txY + (rxY - txY) * progress;
          const perpX = -(rxY - txY);
          const perpY = rxX - txX;
          const len = Math.sqrt(perpX * perpX + perpY * perpY) || 1;
          const waveAmp = isFall ? 5 + 3 * Math.sin(t * 3.5) : 2.5;
          const offset = Math.sin(progress * Math.PI * 3 + t * 2) * waveAmp;
          const fx = px + (perpX / len) * offset;
          const fy = py + (perpY / len) * offset;
          const alpha = Math.sin(progress * Math.PI) * 0.55;
          ctx.beginPath();
          ctx.arc(fx, fy, 2, 0, Math.PI * 2);
          ctx.fillStyle = `${particleBase}${alpha})`;
          ctx.fill();
        }
      }

      // ===== Person =====
      if (personVisible) {
        if (pose === "stand") {
          drawStanding(ctx, pX, pY, poseColors, t);
        } else if (pose === "sit") {
          drawSitting(ctx, pX, pY, poseColors, t);
        } else {
          drawFallen(ctx, pX, pY, poseColors, t);
        }
      }

      // ===== TX device =====
      const txAlpha = personVisible ? 1.0 : 0.35;
      ctx.globalAlpha = txAlpha;
      drawDevice(ctx, txX, txY, "TX", COLORS.tx, "Transmitter", "h = 1.0m", "right");
      ctx.globalAlpha = 1.0;

      // ===== RX device =====
      drawDevice(ctx, rxX, rxY, "RX", COLORS.rx, "Receiver", "h = 0.5m", "left");

      // ===== Router device =====
      drawDevice(ctx, routerX, routerY, "RT", COLORS.router, "Router", "h = 2.0m", "right");

      animFrameRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [dimensions, pose, personPos, personVisible, wifiDisconnected]);

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <img
        src={bathroomImg}
        alt="Bathroom layout"
        className="w-full h-full object-cover rounded-md"
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full cursor-crosshair"
        onClick={handleClick}
        title="Click to move person"
      />
    </div>
  );
}

// ---- Drawing helpers ----

function drawDevice(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  label: string,
  colors: { fill: string; stroke: string; label: string; labelLight: string },
  name: string,
  height: string,
  labelSide: "left" | "right"
) {
  const s = 30;
  
  // Soft shadow
  ctx.beginPath();
  ctx.roundRect(x - s / 2 + 1.5, y - s / 2 + 1.5, s, s, 5);
  ctx.fillStyle = "rgba(0,0,0,0.1)";
  ctx.fill();
  // Box
  ctx.beginPath();
  ctx.roundRect(x - s / 2, y - s / 2, s, s, 5);
  ctx.fillStyle = colors.fill;
  ctx.fill();
  ctx.strokeStyle = colors.stroke;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Label in box
  ctx.fillStyle = "#fff";
  ctx.font = "bold 10px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x, y);

  // Text labels beside the device
  const tx = labelSide === "right" ? x + s / 2 + 6 : x - s / 2 - 6;
  const align = labelSide === "right" ? "left" : "right";
  ctx.textAlign = align as CanvasTextAlign;
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#1a1a1a";
  ctx.font = "bold 10px sans-serif";
  ctx.fillText(name, tx, y - 6);
  ctx.fillStyle = "#333333";
  ctx.font = "9px sans-serif";
  ctx.fillText(height, tx, y + 7);
}

function drawStanding(
  ctx: CanvasRenderingContext2D,
  pX: number, pY: number,
  c: { fill: string; stroke: string; text: string },
  t: number
) {
  ctx.save();
  const breathe = Math.sin(t * 2) * 0.6;

  // Drop shadow
  ctx.beginPath();
  ctx.ellipse(pX, pY + 18, 9, 3, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,0.12)";
  ctx.fill();

  // Legs — short rounded capsules
  ctx.fillStyle = c.stroke;
  ctx.beginPath();
  ctx.roundRect(pX - 7.5, pY + 10, 5, 10, 2.5);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(pX + 2.5, pY + 10, 5, 10, 2.5);
  ctx.fill();

  // Bean body — pill-shaped torso
  ctx.beginPath();
  ctx.ellipse(pX, pY + 2 + breathe, 11, 14, 0, 0, Math.PI * 2);
  ctx.fillStyle = c.fill;
  ctx.fill();
  ctx.strokeStyle = c.stroke;
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Arms — tapered rounded capsules
  ctx.fillStyle = c.stroke;
  ctx.beginPath();
  ctx.roundRect(pX - 16, pY - 3 + breathe, 5, 12, 2.5);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(pX + 11, pY - 3 + breathe, 5, 12, 2.5);
  ctx.fill();

  // Big round head
  ctx.beginPath();
  ctx.arc(pX, pY - 16 + breathe, 12, 0, Math.PI * 2);
  ctx.fillStyle = c.fill;
  ctx.fill();
  ctx.strokeStyle = c.stroke;
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Kawaii eyes — big shiny
  ctx.fillStyle = c.stroke;
  ctx.beginPath();
  ctx.ellipse(pX - 4, pY - 17 + breathe, 2.5, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(pX + 4, pY - 17 + breathe, 2.5, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  // Eye shine
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(pX - 3, pY - 18 + breathe, 1.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(pX + 5, pY - 18 + breathe, 1.2, 0, Math.PI * 2);
  ctx.fill();

  // Tiny smile
  ctx.beginPath();
  ctx.arc(pX, pY - 13 + breathe, 3.5, 0.15, Math.PI - 0.15);
  ctx.strokeStyle = c.stroke;
  ctx.lineWidth = 1;
  ctx.lineCap = "round";
  ctx.stroke();

  // Rosy cheeks
  ctx.fillStyle = c.stroke + "30";
  ctx.beginPath();
  ctx.ellipse(pX - 7, pY - 14 + breathe, 2.5, 1.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(pX + 7, pY - 14 + breathe, 2.5, 1.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawSitting(
  ctx: CanvasRenderingContext2D,
  pX: number, pY: number,
  c: { fill: string; stroke: string; text: string },
  t: number
) {
  ctx.save();
  const breathe = Math.sin(t * 1.8) * 0.4;

  // Drop shadow
  ctx.beginPath();
  ctx.ellipse(pX, pY + 16, 11, 3.5, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,0.1)";
  ctx.fill();

  // Legs — bent forward, short capsules angled out
  ctx.fillStyle = c.stroke;
  ctx.save();
  ctx.translate(pX - 6, pY + 8);
  ctx.rotate(-0.3);
  ctx.beginPath();
  ctx.roundRect(-2.5, 0, 5, 10, 2.5);
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.translate(pX + 6, pY + 8);
  ctx.rotate(0.3);
  ctx.beginPath();
  ctx.roundRect(-2.5, 0, 5, 10, 2.5);
  ctx.fill();
  ctx.restore();

  // Squished bean body (shorter when sitting)
  ctx.beginPath();
  ctx.ellipse(pX, pY + 2 + breathe, 12, 11, 0, 0, Math.PI * 2);
  ctx.fillStyle = c.fill;
  ctx.fill();
  ctx.strokeStyle = c.stroke;
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Arms resting at sides — short capsules angled down
  ctx.fillStyle = c.stroke;
  ctx.save();
  ctx.translate(pX - 13, pY + breathe);
  ctx.rotate(-0.25);
  ctx.beginPath();
  ctx.roundRect(-2.5, 0, 5, 10, 2.5);
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.translate(pX + 13, pY + breathe);
  ctx.rotate(0.25);
  ctx.beginPath();
  ctx.roundRect(-2.5, 0, 5, 10, 2.5);
  ctx.fill();
  ctx.restore();

  // Big round head
  ctx.beginPath();
  ctx.arc(pX, pY - 14 + breathe, 12, 0, Math.PI * 2);
  ctx.fillStyle = c.fill;
  ctx.fill();
  ctx.strokeStyle = c.stroke;
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Kawaii eyes — half-closed / relaxed
  ctx.fillStyle = c.stroke;
  ctx.beginPath();
  ctx.ellipse(pX - 4, pY - 15 + breathe, 2.5, 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(pX + 4, pY - 15 + breathe, 2.5, 2, 0, 0, Math.PI * 2);
  ctx.fill();
  // Eye shine
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(pX - 3, pY - 15.5 + breathe, 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(pX + 5, pY - 15.5 + breathe, 1, 0, Math.PI * 2);
  ctx.fill();

  // Gentle flat smile
  ctx.beginPath();
  ctx.moveTo(pX - 3, pY - 11 + breathe);
  ctx.quadraticCurveTo(pX, pY - 9.5 + breathe, pX + 3, pY - 11 + breathe);
  ctx.strokeStyle = c.stroke;
  ctx.lineWidth = 1;
  ctx.lineCap = "round";
  ctx.stroke();

  // Rosy cheeks
  ctx.fillStyle = c.stroke + "30";
  ctx.beginPath();
  ctx.ellipse(pX - 7, pY - 12 + breathe, 2.5, 1.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(pX + 7, pY - 12 + breathe, 2.5, 1.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawFallen(
  ctx: CanvasRenderingContext2D,
  pX: number, pY: number,
  c: { fill: string; stroke: string; text: string },
  t: number
) {
  ctx.save();

  // Pulsing alert ring
  const pulseAlpha = 0.12 + 0.12 * Math.sin(t * 5);
  const pulseR = 26 + 4 * Math.sin(t * 3.5);
  ctx.beginPath();
  ctx.arc(pX, pY, pulseR, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(181,107,95,${pulseAlpha})`;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Second pulse ring
  const pulse2 = 0.08 + 0.08 * Math.sin(t * 4 + 1);
  ctx.beginPath();
  ctx.arc(pX, pY, pulseR + 7, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(181,107,95,${pulse2})`;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Drop shadow — elongated
  ctx.beginPath();
  ctx.ellipse(pX, pY + 6, 20, 4, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,0.12)";
  ctx.fill();

  // Legs — horizontal capsules
  ctx.fillStyle = c.stroke;
  ctx.beginPath();
  ctx.roundRect(pX + 12, pY - 6, 10, 5, 2.5);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(pX + 12, pY + 1, 10, 5, 2.5);
  ctx.fill();

  // Bean body — horizontal
  ctx.beginPath();
  ctx.ellipse(pX + 2, pY - 1, 14, 9, 0, 0, Math.PI * 2);
  ctx.fillStyle = c.fill;
  ctx.fill();
  ctx.strokeStyle = c.stroke;
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Arms — sprawled capsules
  ctx.fillStyle = c.stroke;
  ctx.save();
  ctx.translate(pX - 4, pY - 9);
  ctx.rotate(-0.3);
  ctx.beginPath();
  ctx.roundRect(-2.5, -9, 5, 9, 2.5);
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.translate(pX - 4, pY + 7);
  ctx.rotate(0.3);
  ctx.beginPath();
  ctx.roundRect(-2.5, 0, 5, 9, 2.5);
  ctx.fill();
  ctx.restore();

  // Big round head — tilted to side (center at pX-16, pY-1)
  ctx.beginPath();
  ctx.arc(pX - 16, pY - 1, 11, 0, Math.PI * 2);
  ctx.fillStyle = c.fill;
  ctx.fill();
  ctx.strokeStyle = c.stroke;
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // X eyes — vertically stacked (one above the other) to match lying-down orientation
  // Head center is at (pX-16, pY-1); eyes centered on the same x, stacked on y
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 1.5;
  ctx.lineCap = "round";
  // Top eye X (center: pX-16, pY-4.5)
  ctx.beginPath();
  ctx.moveTo(pX - 17.5, pY - 6);
  ctx.lineTo(pX - 14.5, pY - 3);
  ctx.moveTo(pX - 14.5, pY - 6);
  ctx.lineTo(pX - 17.5, pY - 3);
  ctx.stroke();
  // Bottom eye X (center: pX-16, pY+1.5)
  ctx.beginPath();
  ctx.moveTo(pX - 17.5, pY);
  ctx.lineTo(pX - 14.5, pY + 3);
  ctx.moveTo(pX - 14.5, pY);
  ctx.lineTo(pX - 17.5, pY + 3);
  ctx.stroke();

  // Dizzy swirl to the left of the head (the "up" direction when lying horizontally)
  const swirlX = pX - 30;
  const swirlY = pY - 1;
  ctx.strokeStyle = c.stroke + "88";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < 20; i++) {
    const angle = (i / 20) * Math.PI * 2.5 + t * 3;
    const r = 2 + i * 0.2;
    const sx = swirlX + Math.cos(angle) * r * 0.6;
    const sy = swirlY + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  }
  ctx.stroke();

  ctx.restore();
}