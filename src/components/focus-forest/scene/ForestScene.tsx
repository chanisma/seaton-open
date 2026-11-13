// ForestScene.tsx - Focus Forest 3D 씬 진입점 (단일 Canvas)
// 카메라: 3/4 부감 고정 + 느린 자동 궤도. 사용자 조작 없음(집중 모드).
// WebGL 실패/컨텍스트 로스 시 폴백 카드 표시 — 타이머·기록은 상위에서 계속 동작.

import {
  Component,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import type { AnimalType, ForestStage, TreePosition } from '@/types/focusForest.types';

import { useForestSimulation } from '../useForestSimulation';
import { Animals } from './Animals';
import { Fireflies } from './Fireflies';
import { SkyAndLights } from './SkyAndLights';
import { Terrain } from './Terrain';
import { Trees } from './Trees';

export interface ForestSceneProps {
  elapsedSeconds: number;
  isFocusing: boolean;
  currentForestIndex: number;
  goldenHour?: boolean;
  savedTrees?: TreePosition[];
  onForestComplete?: (forestIndex: number) => void;
  onAnimalAppear?: (type: AnimalType) => void;
  onAnimalLeave?: (type: AnimalType) => void;
  onTreeCountChange?: (grownCount: number) => void;
  onTreesChange?: (trees: TreePosition[]) => void;
}

// 단계별 카메라 거리 — 숲이 클수록 멀리서 (기존 2D scale 축소의 3D 대응)
const STAGE_RADIUS: Record<ForestStage, number> = { small: 55, medium: 75, large: 95 };
const ORBIT_PERIOD_S = 800; // 한 바퀴 약 13.3분 (거의 인지 불가한 드리프트)
// 카메라 극각(polar angle) — Y축(수직)에서 잰 각. 55°는 지평선 위 고도각 약 35°(= 90 − 55)에 해당.
const POLAR_ANGLE = (55 * Math.PI) / 180;

const CameraRig = ({ stage }: { stage: ForestStage }) => {
  const radiusRef = useRef(STAGE_RADIUS[stage]);

  useFrame((state, delta) => {
    const target = STAGE_RADIUS[stage];
    radiusRef.current += (target - radiusRef.current) * (1 - Math.exp(-0.6 * delta));
    // 카메라는 실제 시계 기준 (관리자 배속과 무관하게 항상 느리게)
    const angle = (state.clock.elapsedTime * Math.PI * 2) / ORBIT_PERIOD_S;
    const r = radiusRef.current;
    const y = r * Math.cos(POLAR_ANGLE);
    const horizontal = r * Math.sin(POLAR_ANGLE);
    state.camera.position.set(Math.sin(angle) * horizontal, y, Math.cos(angle) * horizontal);
    state.camera.lookAt(0, 2, 0);
  });

  return null;
};

// 숲 완성 시 중앙에서 피어오르는 골든 파티클 (모달 없이 은은한 연출)
const BURST_COUNT = 140;
const BURST_DURATION_S = 4;

const CompleteBurst = ({ onDone }: { onDone: () => void }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);
  const startRef = useRef<number | null>(null);
  const doneRef = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const { origins, velocities, positions } = useMemo(() => {
    const origins = new Float32Array(BURST_COUNT * 3);
    const velocities = new Float32Array(BURST_COUNT * 3);
    for (let i = 0; i < BURST_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * 6;
      origins[i * 3] = Math.cos(angle) * r;
      origins[i * 3 + 1] = 0.5;
      origins[i * 3 + 2] = Math.sin(angle) * r;
      velocities[i * 3] = Math.cos(angle) * (2 + Math.random() * 3);
      velocities[i * 3 + 1] = 6 + Math.random() * 7;
      velocities[i * 3 + 2] = Math.sin(angle) * (2 + Math.random() * 3);
    }
    return { origins, velocities, positions: origins.slice() };
  }, []);

  useFrame(state => {
    if (startRef.current === null) startRef.current = state.clock.elapsedTime;
    const age = state.clock.elapsedTime - startRef.current;
    if (age > BURST_DURATION_S) {
      if (!doneRef.current) {
        doneRef.current = true;
        onDoneRef.current();
      }
      return;
    }
    const geo = pointsRef.current?.geometry;
    if (!geo) return;
    const pos = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < BURST_COUNT; i++) {
      pos.setXYZ(
        i,
        origins[i * 3] + velocities[i * 3] * age,
        Math.max(0.2, origins[i * 3 + 1] + velocities[i * 3 + 1] * age - 2.5 * age * age),
        origins[i * 3 + 2] + velocities[i * 3 + 2] * age
      );
    }
    pos.needsUpdate = true;
    if (materialRef.current) {
      materialRef.current.opacity = Math.max(0, 1 - age / BURST_DURATION_S);
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        size={1.1}
        color="#ffd76b"
        transparent
        opacity={1}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

class SceneErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

const SceneFallback = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-emerald-950 to-gray-950">
    <div className="text-center px-6">
      <p className="text-white/90 text-lg font-semibold mb-2">3D 숲을 표시할 수 없어요</p>
      <p className="text-white/60 text-sm leading-relaxed">
        그래픽 환경 문제로 씬을 그릴 수 없지만,
        <br />
        타이머와 집중 기록은 계속 작동합니다.
      </p>
    </div>
  </div>
);

export const ForestScene = ({
  elapsedSeconds,
  isFocusing,
  currentForestIndex,
  goldenHour = false,
  savedTrees,
  onForestComplete,
  onAnimalAppear,
  onAnimalLeave,
  onTreeCountChange,
  onTreesChange,
}: ForestSceneProps) => {
  const [burstKey, setBurstKey] = useState<number | null>(null);
  const [webglFailed, setWebglFailed] = useState(false);

  const onForestCompleteRef = useRef(onForestComplete);
  onForestCompleteRef.current = onForestComplete;

  const handleForestComplete = useCallback((forestIndex: number) => {
    setBurstKey(Date.now());
    onForestCompleteRef.current?.(forestIndex);
  }, []);

  const sim = useForestSimulation({
    elapsedSeconds,
    isFocusing,
    savedTrees,
    currentForestIndex,
    onForestComplete: handleForestComplete,
    onAnimalAppear,
    onAnimalLeave,
  });

  // 성장 완료 수 통지
  const onTreeCountChangeRef = useRef(onTreeCountChange);
  onTreeCountChangeRef.current = onTreeCountChange;
  useEffect(() => {
    onTreeCountChangeRef.current?.(sim.grownTreeCount);
  }, [sim.grownTreeCount]);

  // 나무 배치 변화 시에만 저장 통지 (매초 성장 파생값 저장 방지)
  const onTreesChangeRef = useRef(onTreesChange);
  onTreesChangeRef.current = onTreesChange;
  const treesRef = useRef(sim.trees);
  treesRef.current = sim.trees;
  useEffect(() => {
    onTreesChangeRef.current?.(treesRef.current);
  }, [sim.trees.length]);

  if (webglFailed) return <SceneFallback />;

  return (
    <SceneErrorBoundary fallback={<SceneFallback />}>
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ fov: 45, near: 0.5, far: 400, position: [0, 45, 55] }}
        style={{ position: 'absolute', inset: 0 }}
        onCreated={({ gl }) => {
          gl.shadowMap.type = THREE.PCFShadowMap;
          gl.domElement.addEventListener('webglcontextlost', e => {
            e.preventDefault();
            setWebglFailed(true);
          });
        }}
      >
        <SkyAndLights elapsedSeconds={elapsedSeconds} goldenHour={goldenHour} />
        <CameraRig stage={sim.forestStage} />
        <Terrain />
        <Trees trees={sim.trees} />
        <Animals animals={sim.animals} />
        <Fireflies elapsedSeconds={elapsedSeconds} goldenHour={goldenHour} />
        {burstKey !== null && <CompleteBurst key={burstKey} onDone={() => setBurstKey(null)} />}
      </Canvas>
    </SceneErrorBoundary>
  );
};
