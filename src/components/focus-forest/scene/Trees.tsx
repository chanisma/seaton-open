// Trees.tsx - 타입(family)별 InstancedMesh 나무 렌더러
// 성장 스케일은 useFrame damping으로 부드럽게 목표값을 추적한다

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import type { TreePosition } from '@/types/focusForest.types';

import {
  createTreeGeometry,
  FAMILY_BY_TREE_TYPE,
  TREE_FAMILIES,
  TREE_MATERIAL,
  type TreeFamily,
} from './treeGeometries';

const MAX_INSTANCES = 130; // 숲 완성 120 + 여유

// 절제된 오버슈트 성장 이징
function easeOutBack(t: number): number {
  const c1 = 1.1;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

// variant별 은은한 tint (vertex color에 곱해짐)
const TINTS = [
  '#ffffff',
  '#f2ffe8',
  '#e4f5d8',
  '#fff4d8',
  '#e8f0ff',
  '#f0ffe0',
  '#e0ffe8',
  '#fef0e0',
].map(c => new THREE.Color(c));

const dummy = new THREE.Object3D();

interface FamilyMeshProps {
  family: TreeFamily;
  trees: TreePosition[];
  immediate: boolean;
}

const FamilyMesh = ({ family, trees, immediate }: FamilyMeshProps) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const geometry = useMemo(() => createTreeGeometry(family), [family]);
  // 인스턴스별 표시 스케일 (id → 현재 표시값)
  const displayScale = useRef(new Map<string, number>());

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const k = 1 - Math.exp(-3 * delta);

    trees.forEach((tree, i) => {
      const target = tree.growthStage;
      const prev = displayScale.current.get(tree.id) ?? 0;
      const value = immediate ? target : prev + (target - prev) * k;
      displayScale.current.set(tree.id, value);

      const grow = easeOutBack(Math.max(0, Math.min(1, value)));
      const s = Math.max(0.001, grow) * (0.8 + (tree.variant % 8) * 0.05);
      dummy.position.set(tree.x - 50, 0, tree.y - 50);
      dummy.rotation.set(0, tree.variant * 0.785 + tree.x * 0.1, 0);
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, TINTS[tree.variant % TINTS.length]);
    });

    mesh.count = trees.length;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    // 숲 리셋 등으로 사라진 나무의 스케일 캐시 정리
    if (displayScale.current.size > trees.length + 20) {
      const ids = new Set(trees.map(t => t.id));
      for (const id of displayScale.current.keys()) {
        if (!ids.has(id)) displayScale.current.delete(id);
      }
    }
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, TREE_MATERIAL, MAX_INSTANCES]}
      castShadow
      receiveShadow
      frustumCulled={false}
    />
  );
};

interface TreesProps {
  trees: TreePosition[];
  /** true면 damping 없이 즉시 목표 스케일로 표시 (정적 프리뷰용) */
  immediate?: boolean;
}

export const Trees = ({ trees, immediate = false }: TreesProps) => {
  const byFamily = useMemo(() => {
    const map: Record<TreeFamily, TreePosition[]> = {
      broadLarge: [],
      conifer: [],
      broadSmall: [],
      shrub: [],
      sapling: [],
    };
    for (const t of trees) map[FAMILY_BY_TREE_TYPE[t.type]].push(t);
    return map;
  }, [trees]);

  return (
    <>
      {TREE_FAMILIES.map(family => (
        <FamilyMesh key={family} family={family} trees={byFamily[family]} immediate={immediate} />
      ))}
    </>
  );
};
