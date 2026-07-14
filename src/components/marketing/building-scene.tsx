"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { gsap } from "gsap";

export function BuildingScene() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || window.innerWidth < 900) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xeaf2ec, 13, 28);
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(11, 8.5, 14);
    camera.lookAt(0, 2.7, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.15));
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xf7fff9, 0x7a8c78, 2.2));
    const sun = new THREE.DirectionalLight(0xfff4d7, 3.8);
    sun.position.set(7, 13, 8);
    sun.castShadow = true;
    scene.add(sun);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 30),
      new THREE.MeshStandardMaterial({ color: 0xdde8df, roughness: 0.92 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.08;
    ground.receiveShadow = true;
    scene.add(ground);

    const building = new THREE.Group();
    building.rotation.y = -0.32;
    scene.add(building);

    const concrete = new THREE.MeshStandardMaterial({ color: 0xd8d2c4, roughness: 0.8 });
    const wall = new THREE.MeshStandardMaterial({ color: 0xf6f0e2, roughness: 0.72 });
    const timber = new THREE.MeshStandardMaterial({ color: 0xa86e42, roughness: 0.72 });
    const glass = new THREE.MeshPhysicalMaterial({
      color: 0x74abc2,
      metalness: 0.05,
      roughness: 0.18,
      transparent: true,
      opacity: 0.82,
    });
    const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x315f4c, roughness: 0.65 });
    const animatedParts: THREE.Object3D[] = [];

    function box(
      size: [number, number, number],
      position: [number, number, number],
      material: THREE.Material,
      animate = true,
    ) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
      mesh.position.set(...position);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      building.add(mesh);
      if (animate) animatedParts.push(mesh);
      return mesh;
    }

    box([7.4, 0.35, 5.6], [0, 0.16, 0], concrete);
    const levels = [0.55, 3.2];
    levels.forEach((base, levelIndex) => {
      box([7.1, 0.24, 5.3], [0, base, 0], concrete);
      const y = base + 1.25;
      box([7.05, 2.25, 0.22], [0, y, -2.54], wall);
      box([0.22, 2.25, 5.05], [-3.41, y, 0], wall);
      box([0.22, 2.25, 5.05], [3.41, y, 0], wall);
      box([2.1, 2.25, 0.22], [-2.47, y, 2.54], wall);
      box([2.1, 2.25, 0.22], [2.47, y, 2.54], wall);
      box([1.15, 2.25, 0.22], [0, y, 2.54], wall);
      [-2.15, 0, 2.15].forEach((x) => {
        const windowMesh = box([1.2, 1.15, 0.09], [x, y + 0.05, -2.68], glass);
        windowMesh.userData.window = true;
      });
      [-1.3, 1.3].forEach((x) => {
        box([0.12, 2.4, 0.12], [x, y, 2.66], timber);
      });
      if (levelIndex === 0) {
        box([1.15, 2.05, 0.12], [0, y - 0.12, 2.67], timber);
      } else {
        box([3.2, 0.16, 1.05], [0, base + 2.3, 2.88], concrete);
      }
    });
    box([7.5, 0.32, 5.7], [0, 5.95, 0], concrete);
    const roof = box([7.9, 0.25, 6.1], [0, 6.28, 0], roofMaterial);
    roof.rotation.z = 0.015;
    box([1.4, 0.16, 1.4], [-2.45, 6.52, -1.6], roofMaterial);

    const crane = new THREE.Group();
    crane.position.set(-5.4, 0, -1.3);
    const mastMaterial = new THREE.MeshStandardMaterial({ color: 0xd6a731, roughness: 0.65 });
    const mast = new THREE.Mesh(new THREE.BoxGeometry(0.22, 7.4, 0.22), mastMaterial);
    mast.position.y = 3.7;
    crane.add(mast);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.18, 0.18), mastMaterial);
    arm.position.set(2.55, 7.1, 0);
    crane.add(arm);
    const cable = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 3.5),
      new THREE.MeshBasicMaterial({ color: 0x4e5a51 }),
    );
    cable.position.set(4.7, 5.25, 0);
    crane.add(cable);
    scene.add(crane);

    const timeline = gsap.timeline({ repeat: reducedMotion ? 0 : -1, repeatDelay: 2.4 });
    animatedParts.forEach((part, index) => {
      const finalY = part.position.y;
      if (!reducedMotion) {
        part.scale.y = 0.02;
        part.position.y = 0;
        timeline.to(
          part.scale,
          { y: 1, duration: 0.38, ease: "power2.out" },
          index * 0.055,
        );
        timeline.to(
          part.position,
          { y: finalY, duration: 0.48, ease: "power2.out" },
          index * 0.055,
        );
      }
    });
    if (!reducedMotion) {
      timeline.to(crane.rotation, { y: 0.12, duration: 2.1, yoyo: true, repeat: 1 }, 0.8);
    }

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
        building.rotation.y += 0.001;
        renderer.render(scene, camera);
        previousFrame = time;
      }
      frame = window.requestAnimationFrame(render);
    };
    frame = window.requestAnimationFrame(render);

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
      timeline.kill();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
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
    </div>
  );
}
