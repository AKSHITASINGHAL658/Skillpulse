"use client";

import React from "react";

export const IndianMotifBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* 1. Top-Right Sacred Mandala Watermark (Slow Drifting Cosmic Wheel) */}
      <svg
        className="absolute -top-44 -right-44 w-[720px] h-[720px] opacity-[0.032] text-amber-300 animate-[spin_240s_linear_infinite]"
        viewBox="0 0 400 400"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.6"
        aria-hidden="true"
      >
        {/* Concentric Celestial Rings */}
        <circle cx="200" cy="200" r="190" strokeDasharray="3 3" />
        <circle cx="200" cy="200" r="182" strokeWidth="0.4" />
        <circle cx="200" cy="200" r="160" strokeDasharray="1 3" />
        <circle cx="200" cy="200" r="140" strokeWidth="0.5" />
        <circle cx="200" cy="200" r="115" strokeDasharray="4 4" />
        <circle cx="200" cy="200" r="85" strokeWidth="0.5" />
        <circle cx="200" cy="200" r="55" strokeDasharray="2 2" />
        <circle cx="200" cy="200" r="28" strokeWidth="0.5" />
        <circle cx="200" cy="200" r="4" fill="currentColor" />

        {/* 12-Fold Outer Sacred Petals */}
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
          <g key={`outer-${deg}`} transform={`rotate(${deg} 200 200)`}>
            <ellipse cx="200" cy="200" rx="90" ry="24" strokeWidth="0.5" />
            <path d="M 200 10 L 204 38 L 196 38 Z" fill="currentColor" fillOpacity="0.4" />
            <line x1="200" y1="10" x2="200" y2="70" strokeDasharray="2 3" />
          </g>
        ))}

        {/* 24-Fold Inner Yantra Star Lines */}
        {[
          0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165,
          180, 195, 210, 225, 240, 255, 270, 285, 300, 315, 330, 345
        ].map((deg) => (
          <line
            key={`ray-${deg}`}
            x1="200"
            y1="115"
            x2="200"
            y2="140"
            transform={`rotate(${deg} 200 200)`}
            strokeWidth="0.4"
          />
        ))}

        {/* 8-Fold Core Lotus Petals */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
          <ellipse
            key={`inner-${deg}`}
            cx="200"
            cy="200"
            rx="45"
            ry="14"
            transform={`rotate(${deg} 200 200)`}
            strokeWidth="0.5"
          />
        ))}
      </svg>

      {/* 2. Bottom-Left Minimalist Kolam / Yantra Geometric Field */}
      <div className="absolute -bottom-24 -left-24 w-[500px] h-[500px] pointer-events-none">
        {/* Kolam Dot-Matrix Grid */}
        <div className="absolute inset-0 opacity-[0.028] bg-[radial-gradient(#f59e0b_1.2px,transparent_1.2px)] [background-size:24px_24px]" />

        {/* Delicate Yantra Interlocking Geometry */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.03] text-teal-300"
          viewBox="0 0 300 300"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          aria-hidden="true"
        >
          {/* Centered Sacred Hexagram / Yantra Triangles */}
          <polygon points="150,40 250,210 50,210" strokeDasharray="3 3" />
          <polygon points="150,260 250,90 50,90" strokeDasharray="3 3" />
          <polygon points="150,65 225,195 75,195" />
          <polygon points="150,235 225,105 75,105" />
          <circle cx="150" cy="150" r="110" strokeDasharray="2 4" />
          <circle cx="150" cy="150" r="75" />
          <circle cx="150" cy="150" r="40" strokeDasharray="1 2" />
          <circle cx="150" cy="150" r="3" fill="currentColor" />

          {/* Stepped Architectural Temple Gateways (Gopuram Lintel Motifs) */}
          <path d="M 30 150 L 270 150" strokeWidth="0.3" />
          <path d="M 150 30 L 150 270" strokeWidth="0.3" />
          <rect x="110" y="110" width="80" height="80" strokeWidth="0.4" transform="rotate(45 150 150)" />
        </svg>
      </div>

      {/* 3. Subtle Jali Geometric Pattern (Center Right Ambient Watermark) */}
      <div 
        className="absolute top-1/3 -right-16 w-80 h-96 opacity-[0.018] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(rgba(234, 179, 8, 0.4) 1px, transparent 0), radial-gradient(rgba(13, 148, 136, 0.4) 1px, transparent 0)`,
          backgroundSize: "32px 32px",
          backgroundPosition: "0 0, 16px 16px",
        }}
      />
    </div>
  );
};
