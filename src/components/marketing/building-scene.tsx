"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import * as THREE from "three";

const variantLabels = ["Residential build", "Community school", "High-rise tower"];

type BuildingVariant = {
  group: THREE.Group;
  parts: THREE.Mesh[];
};

export function BuildingScene() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [variantIndex, setVariantIndex] = useState(0);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || window.innerWidth < 900) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xeaf2ec, 15, 31);
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(13, 9.5, 16);
    camera.lookAt(0, 3.7, 0);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.15));
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.dataset.webgl = "true";
    host.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xf7fff9, 0x7a8c78, 2.2));
    const sun = new THREE.DirectionalLight(0xfff4d7, 3.8);
    sun.position.set(7, 13, 8);
    sun.castShadow = true;
    scene.add(sun);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(32, 32),
      new THREE.MeshStandardMaterial({ color: 0xdde8df, roughness: 0.92 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.08;
    ground.receiveShadow = true;
    scene.add(ground);

    const concrete = new THREE.MeshStandardMaterial({ color: 0xd8d2c4, roughness: 0.8 });
    const wall = new THREE.MeshStandardMaterial({ color: 0xf6f0e2, roughness: 0.72 });
    const brick = new THREE.MeshStandardMaterial({ color: 0xb87552, roughness: 0.82 });
    const timber = new THREE.MeshStandardMaterial({ color: 0xa86e42, roughness: 0.72 });
    const glass = new THREE.MeshPhysicalMaterial({
      color: 0x74abc2,
      metalness: 0.05,
      roughness: 0.18,
      transparent: true,
      opacity: 0.82,
    });
    const darkGlass = new THREE.MeshPhysicalMaterial({
      color: 0x39778d,
      metalness: 0.08,
      roughness: 0.16,
      transparent: true,
      opacity: 0.88,
    });
    const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x315f4c, roughness: 0.65 });

    function createVariant(builder: (add: (
      size: [number, number, number],
      position: [number, number, number],
      material: THREE.Material,
    ) => THREE.Mesh, group: THREE.Group) => void): BuildingVariant {
      const group = new THREE.Group();
      group.rotation.y = -0.32;
      const parts: THREE.Mesh[] = [];
      const add = (
        size: [number, number, number],
        position: [number, number, number],
        material: THREE.Material,
      ) => {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
        mesh.position.set(...position);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        group.add(mesh);
        parts.push(mesh);
        return mesh;
      };
      builder(add, group);
      group.visible = false;
      scene.add(group);
      return { group, parts };
    }

    const home = createVariant((add) => {
      add([7.4, 0.35, 5.6], [0, 0.16, 0], concrete);
      [0.55, 3.2].forEach((base, levelIndex) => {
        add([7.1, 0.24, 5.3], [0, base, 0], concrete);
        const y = base + 1.25;
        add([7.05, 2.25, 0.22], [0, y, -2.54], wall);
        add([0.22, 2.25, 5.05], [-3.41, y, 0], wall);
        add([0.22, 2.25, 5.05], [3.41, y, 0], wall);
        add([2.1, 2.25, 0.22], [-2.47, y, 2.54], wall);
        add([2.1, 2.25, 0.22], [2.47, y, 2.54], wall);
        add([1.15, 2.25, 0.22], [0, y, 2.54], wall);
        [-2.15, 0, 2.15].forEach((x) => add([1.2, 1.15, 0.09], [x, y + 0.05, -2.68], glass));
        [-1.3, 1.3].forEach((x) => add([0.12, 2.4, 0.12], [x, y, 2.66], timber));
        if (levelIndex === 1) add([3.2, 0.16, 1.05], [0, base + 2.3, 2.88], concrete);
      });
      add([7.9, 0.25, 6.1], [0, 6.28, 0], roofMaterial);
    });

    const school = createVariant((add, group) => {
      group.scale.setScalar(0.86);
      add([10.8, 0.38, 5.4], [0, 0.18, 0], concrete);
      [0.58, 2.85].forEach((base) => {
        add([10.4, 0.24, 5.1], [0, base, 0], concrete);
        add([10.25, 1.95, 0.24], [0, base + 1.05, -2.46], brick);
        add([0.24, 1.95, 4.9], [-5, base + 1.05, 0], wall);
        add([0.24, 1.95, 4.9], [5, base + 1.05, 0], wall);
        [-4, -2, 0, 2, 4].forEach((x) => add([1.25, 1.08, 0.1], [x, base + 1.08, -2.61], glass));
      });
      add([10.65, 0.28, 5.4], [0, 5.16, 0], roofMaterial);
      add([2.1, 3.9, 0.25], [0, 2.6, 2.52], wall);
      add([1.25, 2.35, 0.12], [0, 1.45, 2.68], darkGlass);
      add([6.5, 0.22, 1.25], [0, 4.55, 2.9], concrete);
    });

    const tower = createVariant((add, group) => {
      group.scale.setScalar(0.8);
      add([6.4, 0.42, 5.4], [0, 0.2, 0], concrete);
      for (let level = 0; level < 7; level += 1) {
        const base = 0.58 + level * 1.42;
        add([5.9, 0.2, 4.9], [0, base, 0], concrete);
        [-2.72, 2.72].forEach((x) => add([0.22, 1.3, 4.55], [x, base + 0.7, 0], concrete));
        [-1.75, 0, 1.75].forEach((x) => {
          add([1.35, 1.05, 0.1], [x, base + 0.7, -2.5], darkGlass);
          add([1.35, 1.05, 0.1], [x, base + 0.7, 2.5], glass);
        });
      }
      add([6.2, 0.3, 5.2], [0, 10.58, 0], roofMaterial);
      add([1.4, 0.18, 1.4], [-1.7, 10.85, -1.35], concrete);
    });

    const variants = [home, school, tower];
    const crane = new THREE.Group();
    crane.position.set(-5.7, 0, -1.3);
    const mastMaterial = new THREE.MeshStandardMaterial({ color: 0xd6a731, roughness: 0.65 });
    const mast = new THREE.Mesh(new THREE.BoxGeometry(0.22, 9.8, 0.22), mastMaterial);
    mast.position.y = 4.9;
    crane.add(mast);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.18, 0.18), mastMaterial);
    arm.position.set(3.05, 9.4, 0);
    crane.add(arm);
    const cable = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 3.8),
      new THREE.MeshBasicMaterial({ color: 0x4e5a51 }),
    );
    cable.position.set(5.25, 7.4, 0);
    crane.add(cable);
    scene.add(crane);

    let activeTimeline: gsap.core.Timeline | undefined;
    let cancelled = false;

    const playVariant = (index: number) => {
      if (cancelled) return;
      variants.forEach((variant) => {
        variant.group.visible = false;
      });
      const variant = variants[index];
      variant.group.visible = true;
      variant.group.rotation.y = -0.32;
      variant.parts.forEach((part) => {
        part.userData.finalY ??= part.position.y;
        part.position.y = 0;
        part.scale.y = 0.02;
      });
      setVariantIndex(index);

      activeTimeline = gsap.timeline({
        onComplete: () => playVariant((index + 1) % variants.length),
      });
      variant.parts.forEach((part, partIndex) => {
        activeTimeline?.to(part.scale, { y: 1, duration: 0.34, ease: "power2.out" }, partIndex * 0.035);
        activeTimeline?.to(
          part.position,
          { y: part.userData.finalY as number, duration: 0.44, ease: "power2.out" },
          partIndex * 0.035,
        );
      });
      activeTimeline.to(crane.rotation, { y: 0.14, duration: 1.5, yoyo: true, repeat: 1 }, 0.7);
      activeTimeline.to({}, { duration: 2.2 });
      activeTimeline.to(variant.group.rotation, { y: -0.18, duration: 0.8, ease: "power1.inOut" });
      activeTimeline.set(variant.group, { visible: false });
    };
    playVariant(0);

    const resize = () => {
      const { width, height } = host.getBoundingClientRect();
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    let frame = 0;
    let previousFrame = 0;
    const render = (time: number) => {
      if (time - previousFrame >= 33 && !document.hidden) {
        renderer.render(scene, camera);
        previousFrame = time;
      }
      frame = window.requestAnimationFrame(render);
    };
    frame = window.requestAnimationFrame(render);

    return () => {
      cancelled = true;
      observer.disconnect();
      window.cancelAnimationFrame(frame);
      activeTimeline?.kill();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
      delete host.dataset.webgl;
    };
  }, []);

  return (
    <div className="building-scene" ref={hostRef} aria-hidden="true">
      <div className="building-scene-fallback">
        <span className="fallback-crane-mast" />
        <span className="fallback-crane-arm" />
        <span className="fallback-floor floor-one" />
        <span className="fallback-floor floor-two" />
        <span className="fallback-floor floor-three" />
        <span className="fallback-window window-one" />
        <span className="fallback-window window-two" />
        <span className="fallback-window window-three" />
        <span className="fallback-window window-four" />
      </div>
      <span className="building-scene-variant">{variantLabels[variantIndex]}</span>
    </div>
  );
}
