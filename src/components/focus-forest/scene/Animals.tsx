// Animals.tsx - 단일 씬 안에서 렌더링되는 GLB 동물
// 개별 Canvas 없음. 로드 실패한 동물은 ErrorBoundary가 조용히 스킵.

import { Component, Suspense, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js';

import type { AnimalInstance, AnimalType } from '@/types/focusForest.types';

const glbPath = (type: AnimalType) => `/GLB%20format/animal-${type}.glb`;

const WALK_SPEED = 2.2; // world units / s
const TARGET_SIZE = 3.2; // 최대 치수 정규화 목표

class AnimalErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function AnimalModel({ animal }: { animal: AnimalInstance }) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(glbPath(animal.type));
  const cloned = useMemo(() => skeletonClone(scene), [scene]);
  const mixer = useMemo(() => new THREE.AnimationMixer(cloned), [cloned]);

  // 크기 정규화(최대 치수 → TARGET_SIZE), 바닥 y=0, 그림자, 애니메이션 재생
  useEffect(() => {
    const box = new THREE.Box3().setFromObject(cloned);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) {
      cloned.scale.setScalar(TARGET_SIZE / maxDim);
      const box2 = new THREE.Box3().setFromObject(cloned);
      cloned.position.y -= box2.min.y;
    }
    cloned.traverse(obj => {
      if ((obj as THREE.Mesh).isMesh) obj.castShadow = true;
    });
    if (animations.length > 0) mixer.clipAction(animations[0]).play();
    return () => {
      mixer.stopAllAction();
    };
  }, [cloned, animations, mixer]);

  // 배회 상태 — 리렌더 없이 ref로만 관리
  const wander = useRef({
    mode: 'idle' as 'idle' | 'walk',
    until: 0, // clock 시간 기준; 0이면 첫 프레임에 idle 대기시간 설정
    target: new THREE.Vector3(),
    heading: (animal.direction * Math.PI) / 180,
  });
  const popScale = useRef(0);
  const moveDir = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    mixer.update(delta);
    const group = groupRef.current;
    if (!group) return;
    const t = state.clock.elapsedTime;
    const w = wander.current;

    // 등장/퇴장 팝 스케일 (재질 투명도 조작 없이 스케일로 처리)
    const targetPop = animal.isVisible ? 1 : 0;
    popScale.current += (targetPop - popScale.current) * (1 - Math.exp(-4 * delta));
    group.scale.setScalar(Math.max(0.001, popScale.current));

    if (w.until === 0) w.until = t + 3 + Math.random() * 8;

    if (t >= w.until) {
      if (w.mode === 'idle') {
        // 새 목표: 현재 위치에서 6~14 유닛, 섬 중심 반경 45 이내
        const angle = Math.random() * Math.PI * 2;
        const dist = 6 + Math.random() * 8;
        w.target.set(
          THREE.MathUtils.clamp(group.position.x + Math.cos(angle) * dist, -45, 45),
          0,
          THREE.MathUtils.clamp(group.position.z + Math.sin(angle) * dist, -45, 45)
        );
        w.mode = 'walk';
        w.until = t + 20; // 도착 시 idle 전환되므로 상한만
      } else {
        w.mode = 'idle';
        w.until = t + 8 + Math.random() * 12; // 긴 정지 위주 (방해 최소화)
      }
    }

    if (w.mode === 'walk') {
      moveDir.subVectors(w.target, group.position);
      moveDir.y = 0;
      const distance = moveDir.length();
      if (distance < 0.3) {
        w.mode = 'idle';
        w.until = t + 8 + Math.random() * 12;
      } else {
        moveDir.normalize();
        group.position.addScaledVector(moveDir, Math.min(WALK_SPEED * delta, distance));
        const targetHeading = Math.atan2(moveDir.x, moveDir.z);
        let diff = targetHeading - w.heading;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        w.heading += diff * (1 - Math.exp(-5 * delta));
        group.rotation.y = w.heading;
      }
    }
  });

  return (
    <group
      ref={groupRef}
      position={[animal.x - 50, 0, animal.y - 50]}
      rotation={[0, wander.current.heading, 0]}
    >
      <primitive object={cloned} />
    </group>
  );
}

export const Animals = ({ animals }: { animals: AnimalInstance[] }) => (
  <>
    {animals.map(animal => (
      <AnimalErrorBoundary key={animal.id}>
        <Suspense fallback={null}>
          <AnimalModel animal={animal} />
        </Suspense>
      </AnimalErrorBoundary>
    ))}
  </>
);
