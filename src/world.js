// ============================================================
// WORLD.JS — renderer, scene, bloom, lights, atmosphere.
// ============================================================

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export function initWorld(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0c0913);
  scene.fog = new THREE.Fog(0x120c1e, 16, 62);

  const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 220);
  camera.position.set(0, 4, 12);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.55, // strength
    0.85, // radius
    0.62, // threshold
  );
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // ------- lights -------
  const hemi = new THREE.HemisphereLight(0x9a86ff, 0x1c1228, 0.62);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffe9c4, 1.0);
  sun.position.set(14, 24, 10);
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0x5a3fd0, 0.35);
  fill.position.set(-10, 8, -14);
  scene.add(fill);

  // ------- flicker machinery -------
  let flickerT = 0;
  function flicker(duration = 0.9) { flickerT = duration; }

  const baseExposure = renderer.toneMappingExposure;
  function update(dt) {
    if (flickerT > 0) {
      flickerT -= dt;
      const f = Math.random() < 0.4 ? 0.55 + Math.random() * 0.2 : 1.05;
      renderer.toneMappingExposure = baseExposure * f;
      if (flickerT <= 0) renderer.toneMappingExposure = baseExposure;
    }
  }

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    composer.setSize(w, h);
    bloom.setSize(w, h);
  }
  window.addEventListener('resize', resize);

  return { renderer, scene, camera, composer, bloom, flicker, update };
}
