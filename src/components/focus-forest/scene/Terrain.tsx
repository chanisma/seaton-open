// Terrain.tsx - 원형 로우폴리 언덕 지형 (중앙은 평탄한 클리어링)

import { useMemo } from 'react';
import * as THREE from 'three';

function buildTerrainGeometry(): THREE.BufferGeometry {
  // 세분화된 평면 → 원형 섬: 내부 정점이 있어야 변위와 면 단위 색 모자이크가 산다
  const geo = new THREE.PlaneGeometry(160, 160, 64, 64).toNonIndexed();
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const dark = new THREE.Color('#3c7443');
  const base = new THREE.Color('#4c8a4f');
  const c = new THREE.Color();

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const r = Math.sqrt(x * x + z * z);
    // 중앙 반경 12 평탄 유지, 완만한 언덕
    const edgeFactor = Math.min(1, Math.max(0, (r - 12) / 20));
    let y =
      (Math.sin(x * 0.15) * Math.cos(z * 0.13) + Math.sin(x * 0.05 + z * 0.07) * 1.5) *
      0.9 *
      edgeFactor;
    // 반경 68 밖은 섬 가장자리처럼 아래로 말아 내림 (안개 속으로)
    if (r > 68) y -= (r - 68) * 0.6;
    pos.setY(i, y);
  }

  for (let face = 0; face < pos.count / 3; face++) {
    const t = Math.abs(Math.sin(face * 127.1) * 43758.5453) % 1;
    c.lerpColors(dark, base, 0.35 + 0.65 * t);
    for (let v = 0; v < 3; v++) c.toArray(colors, (face * 3 + v) * 3);
  }

  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

export const Terrain = () => {
  const geometry = useMemo(buildTerrainGeometry, []);
  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial vertexColors flatShading roughness={1} metalness={0} />
    </mesh>
  );
};
