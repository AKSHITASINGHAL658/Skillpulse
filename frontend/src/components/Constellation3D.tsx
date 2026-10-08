"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface SkillNode {
  id: number;
  name: string;
  category: string;
  x: number;
  y: number;
  z: number;
  size: number;
  color: string;
  connections: number[];
}

export function Constellation3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredSkill, setHoveredSkill] = useState<SkillNode | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 280;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0d14, 0.0035);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.z = 130;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 2. Skill Nodes definitions (Top Skills in Indian Tech Market)
    const skillsData: SkillNode[] = [
      { id: 0, name: "AWS", category: "Cloud", x: -45, y: 15, z: 0, size: 3.2, color: "#EAB308", connections: [1, 2, 6] },
      { id: 1, name: "Docker", category: "DevOps", x: -20, y: 30, z: -10, size: 2.8, color: "#6366F1", connections: [2, 5] },
      { id: 2, name: "Kubernetes", category: "DevOps", x: 10, y: 25, z: 10, size: 3.0, color: "#38BDF8", connections: [5] },
      { id: 3, name: "Python", category: "Language", x: -35, y: -20, z: 15, size: 3.4, color: "#14B8A6", connections: [4, 7] },
      { id: 4, name: "PyTorch", category: "AI/ML", x: -5, y: -30, z: -5, size: 2.6, color: "#EC4899", connections: [7] },
      { id: 5, name: "Kafka", category: "Backend", x: 35, y: 15, z: -15, size: 2.7, color: "#E2D4C0", connections: [6] },
      { id: 6, name: "PostgreSQL", category: "Database", x: 15, y: -5, z: -20, size: 3.0, color: "#60A5FA", connections: [7, 8] },
      { id: 7, name: "Java / Spring", category: "Backend", x: 45, y: -15, z: 10, size: 3.1, color: "#F59E0B", connections: [8] },
      { id: 8, name: "React / Next", category: "Frontend", x: -10, y: 0, z: 25, size: 3.3, color: "#0D9488", connections: [3, 0] },
    ];

    const group = new THREE.Group();
    scene.add(group);

    // 3. Kolam / Yantra Dot-Matrix Symmetry & Radial Celestial Guides
    // 3a. Equidistant Micro-Dot Matrix Lattice
    const dotSpacing = 16;
    const dotGridX = 14;
    const dotGridY = 8;
    const kolamPositions: number[] = [];

    for (let ix = -dotGridX / 2; ix <= dotGridX / 2; ix++) {
      for (let iy = -dotGridY / 2; iy <= dotGridY / 2; iy++) {
        kolamPositions.push(ix * dotSpacing, iy * dotSpacing, -25);
      }
    }

    const kolamGeo = new THREE.BufferGeometry();
    kolamGeo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(kolamPositions, 3)
    );
    const kolamMat = new THREE.PointsMaterial({
      size: 1.4,
      color: 0xeab308,
      transparent: true,
      opacity: 0.16,
    });
    const kolamPoints = new THREE.Points(kolamGeo, kolamMat);
    group.add(kolamPoints);

    // 3b. Concentric Yantra Circular Radial Guides
    const radialRadii = [28, 56, 84];
    radialRadii.forEach((r, idx) => {
      const ringCurve = new THREE.EllipseCurve(0, 0, r, r, 0, 2 * Math.PI, false, 0);
      const ringPoints = ringCurve.getPoints(64);
      const ringGeo = new THREE.BufferGeometry().setFromPoints(
        ringPoints.map((p) => new THREE.Vector3(p.x, p.y, -24))
      );
      const ringLineMat = new THREE.LineBasicMaterial({
        color: idx === 1 ? 0x0d9488 : 0xeab308,
        transparent: true,
        opacity: 0.12,
      });
      const ringLine = new THREE.LineLoop(ringGeo, ringLineMat);
      group.add(ringLine);
    });

    // 4. Create Glowing Skill Nodes
    const nodeMeshes: THREE.Mesh[] = [];
    const sphereGeo = new THREE.SphereGeometry(1, 24, 24);

    skillsData.forEach((s) => {
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(s.color),
        emissive: new THREE.Color(s.color),
        emissiveIntensity: 0.7,
        roughness: 0.2,
        metalness: 0.8,
      });

      const mesh = new THREE.Mesh(sphereGeo, mat);
      mesh.scale.setScalar(s.size);
      mesh.position.set(s.x, s.y, s.z);
      mesh.userData = { skill: s, originalScale: s.size, originalIntensity: 0.7 };
      group.add(mesh);
      nodeMeshes.push(mesh);

      // Outer glass aura ring
      const ringGeo = new THREE.RingGeometry(s.size * 1.35, s.size * 1.55, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(s.color),
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(s.x, s.y, s.z);
      ring.rotation.x = Math.PI / 3;
      group.add(ring);
    });

    // 5. Connective Base DAG Line Edges
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x94a3b8,
      transparent: true,
      opacity: 0.18,
      linewidth: 1,
    });

    skillsData.forEach((source) => {
      source.connections.forEach((targetIdx) => {
        const target = skillsData[targetIdx];
        if (target) {
          const points = [
            new THREE.Vector3(source.x, source.y, source.z),
            new THREE.Vector3(target.x, target.y, target.z),
          ];
          const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
          const line = new THREE.Line(lineGeo, lineMat);
          group.add(line);
        }
      });
    });

    // 6. Dynamic Golden-Ochre Bezier Curve Group (For Node Hover)
    const hoverCurvesGroup = new THREE.Group();
    group.add(hoverCurvesGroup);

    // 7. Ambient Particle Dust
    const particleCount = 100;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePos[i] = (Math.random() - 0.5) * 160;
      particlePos[i + 1] = (Math.random() - 0.5) * 100;
      particlePos[i + 2] = (Math.random() - 0.5) * 80;
    }
    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePos, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 1.2,
      color: 0xeab308,
      transparent: true,
      opacity: 0.28,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    group.add(particles);

    // 8. Lighting (Warm Ochre Directional + Peacock Teal Accent)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfef08a, 1.6);
    dirLight.position.set(50, 50, 80);
    scene.add(dirLight);

    const peacockLight = new THREE.PointLight(0x0d9488, 2.2, 220);
    peacockLight.position.set(-60, -40, 40);
    scene.add(peacockLight);

    // 9. Raycaster & Mouse Interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-1000, -1000);
    let targetRotX = 0;
    let targetRotY = 0;
    let currentRotX = 0;
    let currentRotY = 0;
    let currentHoveredMesh: THREE.Mesh | null = null;

    // Helper: Build Golden Bezier Curves to Prerequisites
    const updateHoverBezierCurves = (mesh: THREE.Mesh | null) => {
      // Clear previous hover curves
      while (hoverCurvesGroup.children.length > 0) {
        const obj = hoverCurvesGroup.children[0];
        hoverCurvesGroup.remove(obj);
      }

      if (!mesh) {
        setHoveredSkill(null);
        return;
      }

      const skill: SkillNode = mesh.userData.skill;
      setHoveredSkill(skill);

      const sourcePos = mesh.position;

      // Draw delicate golden-ochre bezier curves connecting to each connected prerequisite
      skill.connections.forEach((targetIdx) => {
        const target = skillsData[targetIdx];
        if (!target) return;

        const targetPos = new THREE.Vector3(target.x, target.y, target.z);

        // Compute curved midpoint bulging upwards in 3D
        const midPos = new THREE.Vector3()
          .addVectors(sourcePos, targetPos)
          .multiplyScalar(0.5);
        midPos.z += 14;
        midPos.y += 6;

        const curve = new THREE.QuadraticBezierCurve3(sourcePos, midPos, targetPos);
        const curvePoints = curve.getPoints(40);
        const curveGeo = new THREE.BufferGeometry().setFromPoints(curvePoints);

        // Radiant Golden-Ochre Bezier line
        const curveMat = new THREE.LineBasicMaterial({
          color: 0xf59e0b,
          transparent: true,
          opacity: 0.85,
          linewidth: 2,
        });
        const curveLine = new THREE.Line(curveGeo, curveMat);
        hoverCurvesGroup.add(curveLine);

        // Glowing pulse particles along the bezier curve
        const pulseCount = 3;
        const pulsePos = new Float32Array(pulseCount * 3);
        for (let p = 0; p < pulseCount; p++) {
          const pt = curve.getPoint((p + 1) / (pulseCount + 1));
          pulsePos[p * 3] = pt.x;
          pulsePos[p * 3 + 1] = pt.y;
          pulsePos[p * 3 + 2] = pt.z;
        }
        const pulseGeo = new THREE.BufferGeometry();
        pulseGeo.setAttribute("position", new THREE.BufferAttribute(pulsePos, 3));
        const pulseMat = new THREE.PointsMaterial({
          size: 3.2,
          color: 0xfde047,
          transparent: true,
          opacity: 0.9,
        });
        const pulsePoints = new THREE.Points(pulseGeo, pulseMat);
        hoverCurvesGroup.add(pulsePoints);
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

      mouse.x = x;
      mouse.y = y;

      const normX = (e.clientX - rect.left) / rect.width - 0.5;
      const normY = (e.clientY - rect.top) / rect.height - 0.5;
      targetRotY = normX * 0.45;
      targetRotX = normY * 0.35;
    };

    window.addEventListener("mousemove", handleMouseMove);

    // 10. Animation Loop
    let animationFrameId: number;
    const startTime = performance.now();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsed = (performance.now() - startTime) * 0.001;

      // Smooth camera/group rotation interpolation
      currentRotX += (targetRotX - currentRotX) * 0.04;
      currentRotY += (targetRotY - currentRotY) * 0.04;

      group.rotation.x = currentRotX + Math.sin(elapsed * 0.25) * 0.03;
      group.rotation.y = currentRotY + elapsed * 0.035;

      // Subtle breathing for nodes
      nodeMeshes.forEach((mesh, i) => {
        mesh.position.y += Math.sin(elapsed * 1.5 + i) * 0.025;
      });

      // Raycasting for interactive node hover
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(nodeMeshes);

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        if (hit !== currentHoveredMesh) {
          if (currentHoveredMesh) {
            currentHoveredMesh.scale.setScalar(currentHoveredMesh.userData.originalScale);
            (currentHoveredMesh.material as THREE.MeshStandardMaterial).emissiveIntensity =
              currentHoveredMesh.userData.originalIntensity;
          }
          currentHoveredMesh = hit;
          currentHoveredMesh.scale.setScalar(currentHoveredMesh.userData.originalScale * 1.3);
          (currentHoveredMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.3;
          updateHoverBezierCurves(currentHoveredMesh);
        }
      } else if (currentHoveredMesh) {
        currentHoveredMesh.scale.setScalar(currentHoveredMesh.userData.originalScale);
        (currentHoveredMesh.material as THREE.MeshStandardMaterial).emissiveIntensity =
          currentHoveredMesh.userData.originalIntensity;
        currentHoveredMesh = null;
        updateHoverBezierCurves(null);
      }

      renderer.render(scene, camera);
    };

    animate();

    // 11. Resize Handler
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-[270px] sm:h-[310px] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111622]/80 backdrop-blur-xl shadow-2xl lintel-border">
      {/* Indo-Western Architectural Lintel Top Highlight */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 via-teal-400/30 to-transparent z-20" />
      <div className="pointer-events-none absolute top-0 left-12 right-12 h-[1.5px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent z-20" />

      {/* 3D WebGL Canvas */}
      <div ref={containerRef} className="absolute inset-0 z-0 cursor-grab active:cursor-grabbing" />

      {/* Floating Glass Editorial Overlay */}
      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-6 sm:p-7 bg-gradient-to-t from-[#0A0D14]/90 via-transparent to-transparent">
        <div className="flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 border border-amber-500/20 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-[10px] font-mono tracking-wide uppercase text-amber-200">
                Spatial Prerequisite Mesh
              </span>
            </div>
            <h2 className="mt-2 text-xl sm:text-2xl font-medium tracking-tight text-[#EDEDED] flex items-center gap-2.5">
              <span>National Tech Skill Synergy Mesh</span>
            </h2>
            <p className="text-xs text-[#8F97A6] max-w-md mt-1">
              Recursive prerequisite DAG connecting cloud infra, backend microservices, and AI models across India&apos;s tech hubs.
            </p>
          </div>

          {/* Interactive Hovered Node Telemetry Badge */}
          {hoveredSkill ? (
            <div className="animate-in fade-in slide-in-from-right-2 duration-200 flex flex-col items-end rounded-xl bg-[#0A0D14]/85 border border-amber-400/30 p-2.5 shadow-xl backdrop-blur-md">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                <span className="text-xs font-semibold text-white">{hoveredSkill.name}</span>
                <span className="text-[10px] font-mono text-amber-300">({hoveredSkill.category})</span>
              </div>
              <span className="text-[10px] font-mono text-[#8F97A6] mt-0.5">
                {hoveredSkill.connections.length} Prerequisite Connections • Active Node
              </span>
            </div>
          ) : (
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#8F97A6]">Spatial Engine</span>
              <span className="text-xs font-mono text-[#EAB308]">Three.js WebGL 60FPS</span>
            </div>
          )}
        </div>

        {/* Bottom Legend Badges */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#8F97A6]">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#EAB308]" /> Cloud & Infra
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#14B8A6]" /> AI / ML & Data
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#6366F1]" /> DevOps Core
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#EC4899]" /> Modern Full Stack
          </span>
          <span className="ml-auto text-[10px] font-mono text-[#8F97A6]">
            Hover node to project golden bezier prerequisite curves
          </span>
        </div>
      </div>
    </div>
  );
}
