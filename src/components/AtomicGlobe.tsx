"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import {
  buildFlightArcs,
  buildLandParticlePositions,
  latLngToVector3,
} from "@/lib/globeGeometry";

// Demo inventory is fixed to Larnaca, Cyprus - see src/lib/rentsyst.ts.
const SEARCH_FOCUS = { lat: 34.916, lng: 33.62 };

// Decorative flight paths radiating from the search location.
const FLIGHT_DESTINATIONS = [
  { lat: 51.5074, lng: -0.1278 }, // London
  { lat: 48.8566, lng: 2.3522 }, // Paris
  { lat: 41.9028, lng: 12.4964 }, // Rome
  { lat: 50.1109, lng: 8.6821 }, // Frankfurt
  { lat: 55.7558, lng: 37.6173 }, // Moscow
  { lat: 25.2048, lng: 55.2708 }, // Dubai
  { lat: 30.0444, lng: 31.2357 }, // Cairo
  { lat: 41.0082, lng: 28.9784 }, // Istanbul
];

const IDLE_ROTATE_SPEED = 0.035; // radians/sec
const ZOOM_DURATION_MS = 650;
const ZOOM_CAMERA_Z = 2.4;
const IDLE_CAMERA_Z = 3.3;
const FLIGHT_PULSE_SPEED = 0.18; // fraction of arc traveled per second

function createGlowSprite(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  );
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.4, "rgba(255,214,170,0.9)");
  gradient.addColorStop(1, "rgba(255,140,60,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

export default function AtomicGlobe() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      50,
      container.clientWidth / container.clientHeight,
      0.1,
      100,
    );
    camera.position.z = IDLE_CAMERA_Z;
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    const positions = buildLandParticlePositions(22000);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const sprite = createGlowSprite();
    const material = new THREE.PointsMaterial({
      size: 0.018,
      map: sprite,
      color: 0xff8a3d,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geometry, material);
    globeGroup.add(points);

    // Animated flight-path arcs. All arcs share one geometry/one draw call;
    // the traveling glow is driven entirely by a single uTime uniform in
    // the fragment shader, so adding more arcs costs no extra per-frame
    // CPU work.
    const arcs = buildFlightArcs(SEARCH_FOCUS, FLIGHT_DESTINATIONS);
    const arcsGeometry = new THREE.BufferGeometry();
    arcsGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(arcs.positions, 3),
    );
    arcsGeometry.setAttribute(
      "aProgress",
      new THREE.BufferAttribute(arcs.progress, 1),
    );
    arcsGeometry.setAttribute("aSeed", new THREE.BufferAttribute(arcs.seed, 1));

    const arcsMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(0xffb066) },
      },
      vertexShader: `
        attribute float aProgress;
        attribute float aSeed;
        varying float vProgress;
        varying float vSeed;
        void main() {
          vProgress = aProgress;
          vSeed = aSeed;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor;
        varying float vProgress;
        varying float vSeed;
        void main() {
          float pulsePos = fract(uTime * ${FLIGHT_PULSE_SPEED.toFixed(3)} + vSeed);
          float dist = abs(vProgress - pulsePos);
          dist = min(dist, 1.0 - dist);
          float pulse = smoothstep(0.14, 0.0, dist);
          float intensity = 0.14 + pulse * 0.9;
          gl_FragColor = vec4(uColor, intensity);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const flightLines = new THREE.LineSegments(arcsGeometry, arcsMaterial);
    globeGroup.add(flightLines);

    // Face the globe toward a neutral starting longitude so the initial
    // idle view isn't blank ocean.
    globeGroup.rotation.y = -0.4;

    let frameId: number;
    let lastTime = performance.now();
    let zoomStart: number | null = null;
    let zoomFromRotationY = globeGroup.rotation.y;
    let zoomToRotationY = globeGroup.rotation.y;
    let zoomFromZ = camera.position.z;

    function onZoomRequest() {
      const [tx, , tz] = latLngToVector3(
        SEARCH_FOCUS.lat,
        SEARCH_FOCUS.lng,
        1,
      );
      // Rotation.y (radians) that brings this point to face the camera
      // at +Z: solve tx*cos(theta) + tz*sin(theta) = 0 for the root that
      // leaves worldZ positive (facing the camera, not away from it).
      const targetAngle = Math.atan2(-tx, tz);

      const currentY = globeGroup.rotation.y;
      // Shortest angular path from the globe's current (possibly
      // many-times-wrapped) rotation to the target angle mod 2π.
      const twoPi = Math.PI * 2;
      const currentMod = ((currentY % twoPi) + twoPi) % twoPi;
      const targetMod = ((targetAngle % twoPi) + twoPi) % twoPi;
      let delta = targetMod - currentMod;
      if (delta > Math.PI) delta -= twoPi;
      if (delta < -Math.PI) delta += twoPi;

      zoomFromRotationY = currentY;
      zoomToRotationY = currentY + delta;
      zoomFromZ = camera.position.z;
      zoomStart = performance.now();
    }

    if (!prefersReducedMotion) {
      window.addEventListener("trydrive:zoom-search", onZoomRequest);
    }

    function animate(now: number) {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      if (zoomStart !== null) {
        const t = Math.min(1, (now - zoomStart) / ZOOM_DURATION_MS);
        const eased = easeOutCubic(t);
        globeGroup.rotation.y =
          zoomFromRotationY + (zoomToRotationY - zoomFromRotationY) * eased;
        camera.position.z = zoomFromZ + (ZOOM_CAMERA_Z - zoomFromZ) * eased;
        if (t >= 1) zoomStart = null;
      } else if (!prefersReducedMotion) {
        globeGroup.rotation.y += dt * IDLE_ROTATE_SPEED;
      }

      if (!prefersReducedMotion) {
        arcsMaterial.uniforms.uTime.value += dt;
      }

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    }

    frameId = requestAnimationFrame(animate);
    if (prefersReducedMotion) {
      // Render a single static frame instead of looping.
      renderer.render(scene, camera);
      cancelAnimationFrame(frameId);
    }

    const resizeObserver = new ResizeObserver(() => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      window.removeEventListener("trydrive:zoom-search", onZoomRequest);
      geometry.dispose();
      material.dispose();
      sprite.dispose();
      arcsGeometry.dispose();
      arcsMaterial.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-[5] overflow-hidden"
    />
  );
}
