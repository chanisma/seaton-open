// treeGeometries.ts - 로우폴리 나무 프로시저럴 지오메트리 팩토리
// 모든 지오메트리는 바닥이 y=0, vertex color 포함 (재질 1개로 인스턴싱)

import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { TreeType } from '@/types/focusForest.types';

export type TreeFamily = 'broadLarge' | 'conifer' | 'broadSmall' | 'shrub' | 'sapling';

export const FAMILY_BY_TREE_TYPE: Record<TreeType, TreeFamily> = {
  large: 'broadLarge',
  medium: 'conifer',
  small: 'broadSmall',
  bush: 'shrub',
  sapling: 'sapling',
};

export const TREE_FAMILIES: TreeFamily[] = [
  'broadLarge',
  'conifer',
  'broadSmall',
  'shrub',
  'sapling',
];

const TRUNK_BROWN = new THREE.Color('#7a5230');
const GREEN_DARK = new THREE.Color('#2f6b3a');
const GREEN_MID = new THREE.Color('#3f8a4a');
const GREEN_LIGHT = new THREE.Color('#5aa85e');

// vertex color를 칠하고, merge 호환을 위해 uv를 제거한다.
// 인덱스 지오메트리(Cylinder/Cone/Sphere)와 비인덱스(Icosahedron detail 0)가 섞이면
// mergeGeometries가 null을 반환하므로 전부 비인덱스로 정규화한다 (flatShading이라 시각 결과 동일).
function paint(geo: THREE.BufferGeometry, color: THREE.Color): THREE.BufferGeometry {
  const nonIndexed = geo.index ? geo.toNonIndexed() : geo;
  const count = nonIndexed.attributes.position.count;
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) color.toArray(colors, i * 3);
  nonIndexed.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  nonIndexed.deleteAttribute('uv');
  return nonIndexed;
}

function trunk(radius: number, height: number): THREE.BufferGeometry {
  const geo = new THREE.CylinderGeometry(radius * 0.7, radius, height, 5);
  geo.translate(0, height / 2, 0);
  return paint(geo, TRUNK_BROWN);
}

function broadLarge(): THREE.BufferGeometry {
  const canopy = new THREE.IcosahedronGeometry(2.6, 0);
  canopy.scale(1, 1.15, 1);
  canopy.translate(0, 4.6, 0);
  const lower = new THREE.IcosahedronGeometry(1.6, 0);
  lower.translate(1.1, 3.4, 0.6);
  return mergeGeometries([trunk(0.5, 3), paint(canopy, GREEN_MID), paint(lower, GREEN_DARK)]);
}

function conifer(): THREE.BufferGeometry {
  const c1 = new THREE.ConeGeometry(2.2, 2.4, 6);
  c1.translate(0, 2.8, 0);
  const c2 = new THREE.ConeGeometry(1.7, 2.1, 6);
  c2.translate(0, 4.3, 0);
  const c3 = new THREE.ConeGeometry(1.1, 1.8, 6);
  c3.translate(0, 5.7, 0);
  return mergeGeometries([
    trunk(0.4, 2),
    paint(c1, GREEN_DARK),
    paint(c2, GREEN_MID),
    paint(c3, GREEN_LIGHT),
  ]);
}

function broadSmall(): THREE.BufferGeometry {
  const canopy = new THREE.IcosahedronGeometry(1.7, 0);
  canopy.scale(1, 1.1, 1);
  canopy.translate(0, 3.1, 0);
  return mergeGeometries([trunk(0.35, 2), paint(canopy, GREEN_LIGHT)]);
}

function shrub(): THREE.BufferGeometry {
  const body = new THREE.SphereGeometry(1.4, 6, 4);
  body.scale(1, 0.65, 1);
  body.translate(0, 0.9, 0);
  const side = new THREE.SphereGeometry(0.8, 6, 4);
  side.scale(1, 0.7, 1);
  side.translate(1.1, 0.55, 0.3);
  return mergeGeometries([paint(body, GREEN_MID), paint(side, GREEN_DARK)]);
}

function sapling(): THREE.BufferGeometry {
  const top = new THREE.ConeGeometry(0.7, 1.4, 6);
  top.translate(0, 1.6, 0);
  return mergeGeometries([trunk(0.15, 1), paint(top, GREEN_LIGHT)]);
}

export function createTreeGeometry(family: TreeFamily): THREE.BufferGeometry {
  switch (family) {
    case 'broadLarge':
      return broadLarge();
    case 'conifer':
      return conifer();
    case 'broadSmall':
      return broadSmall();
    case 'shrub':
      return shrub();
    case 'sapling':
      return sapling();
  }
}

// 모든 나무가 공유하는 단일 재질 (인스턴스 tint는 instanceColor로 곱해짐)
export const TREE_MATERIAL = new THREE.MeshStandardMaterial({
  vertexColors: true,
  flatShading: true,
  roughness: 0.9,
  metalness: 0,
});
