"use client";

import React, { useRef, useState } from "react";

interface BentoCardProps {
  children: React.ReactNode;
  className?: string;
  enableTilt?: boolean;
}

export function BentoCard({ children, className = "", enableTilt = true }: BentoCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [spotlightPos, setSpotlightPos] = useState({ x: -1000, y: -1000 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setSpotlightPos({ x, y });

    if (enableTilt) {
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const tiltX = ((y - centerY) / centerY) * -4; // Subtle max 4 deg
      const tiltY = ((x - centerX) / centerX) * 4;
      setRotateX(tiltX);
      setRotateY(tiltY);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
    setSpotlightPos({ x: -1000, y: -1000 });
  };

  return (
    <div
      ref={cardRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: enableTilt && isHovered
          ? `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-2px)`
          : "perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)",
        transition: isHovered
          ? "transform 0.1s ease-out, box-shadow 0.25s ease"
          : "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease",
      }}
      className={`relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111622]/80 p-6 backdrop-blur-xl transition-all duration-300 hover:border-amber-400/25 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.75),0_0_1px_1px_rgba(234,179,8,0.06)] ${className}`}
    >
      {/* Indo-Western Architectural Lintel Top Highlight */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/30 via-white/20 to-transparent" />
      <div className="pointer-events-none absolute top-0 left-6 right-6 h-[1.5px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />

      {/* Subtle Carved Corner Accents */}
      <div className="pointer-events-none absolute top-1.5 left-1.5 w-1.5 h-1.5 border-t border-l border-amber-400/20" />
      <div className="pointer-events-none absolute top-1.5 right-1.5 w-1.5 h-1.5 border-t border-r border-amber-400/20" />

      {/* Dynamic Cursor Spotlight Radial Effect (Kesar Gold + Peacock Teal) */}
      <div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(400px circle at ${spotlightPos.x}px ${spotlightPos.y}px, rgba(234, 179, 8, 0.08), rgba(20, 184, 166, 0.04), transparent 70%)`,
        }}
      />

      {/* Card Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
