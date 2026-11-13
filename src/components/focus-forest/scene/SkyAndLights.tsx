// SkyAndLights.tsx - 낮/밤 사이클: 하늘·안개·태양광·반구광을 키프레임 lerp로 전환
// 오버레이 div 대신 실제 씬 조명이 변한다. goldenHour=true면 목표 달성 연출로 고정.

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

import { DAY_CYCLE_S } from '../useForestSimulation';

export interface DayNightSample {
  sky: THREE.Color;
  fog: THREE.Color;
  sun: THREE.Color;
  sunIntensity: number;
  hemiIntensity: number;
  fireflyStrength: number; // 0~1, 밤에만 1
}

interface Keyframe {
  time: number;
  sky: string;
  fog: string;
  sun: string;
  sunIntensity: number;
  hemiIntensity: number;
  fireflyStrength: number;
}

// dawn 0 / day 140 / sunset 300 / night 440 (600초 주기, 스펙 고정값)
const KEYFRAMES: Keyframe[] = [
  {
    time: 0,
    sky: '#f2b27d',
    fog: '#f7cba0',
    sun: '#ffb36b',
    sunIntensity: 0.9,
    hemiIntensity: 0.45,
    fireflyStrength: 0,
  },
  {
    time: 140,
    sky: '#9ed6ff',
    fog: '#cfe8ff',
    sun: '#fff3df',
    sunIntensity: 1.5,
    hemiIntensity: 0.7,
    fireflyStrength: 0,
  },
  {
    time: 300,
    sky: '#ff9e6d',
    fog: '#ffbe94',
    sun: '#ff8a4a',
    sunIntensity: 1.0,
    hemiIntensity: 0.5,
    fireflyStrength: 0,
  },
  {
    time: 440,
    sky: '#0e1a3a',
    fog: '#16234a',
    sun: '#8fb4ff',
    sunIntensity: 0.3,
    hemiIntensity: 0.18,
    fireflyStrength: 1,
  },
];

// 페이즈 경계 직전에만 다음 키프레임으로 블렌드하는 전환창 (페이즈 유지용)
const TRANSITION_S = 45;

// 목표 달성(골든아워) 연출 프리셋
const GOLDEN: Keyframe = {
  time: 0,
  sky: '#ffb75e',
  fog: '#ffd9a0',
  sun: '#ffc46b',
  sunIntensity: 1.3,
  hemiIntensity: 0.6,
  fireflyStrength: 0,
};

const tmpA = new THREE.Color();
const tmpB = new THREE.Color();

function applyKeyframePair(a: Keyframe, b: Keyframe, t: number, out: DayNightSample): void {
  out.sky.lerpColors(tmpA.set(a.sky), tmpB.set(b.sky), t);
  out.fog.lerpColors(tmpA.set(a.fog), tmpB.set(b.fog), t);
  out.sun.lerpColors(tmpA.set(a.sun), tmpB.set(b.sun), t);
  out.sunIntensity = a.sunIntensity + (b.sunIntensity - a.sunIntensity) * t;
  out.hemiIntensity = a.hemiIntensity + (b.hemiIntensity - a.hemiIntensity) * t;
  out.fireflyStrength = a.fireflyStrength + (b.fireflyStrength - a.fireflyStrength) * t;
}

export function createDayNightSample(): DayNightSample {
  return {
    sky: new THREE.Color(),
    fog: new THREE.Color(),
    sun: new THREE.Color(),
    sunIntensity: 1,
    hemiIntensity: 0.6,
    fireflyStrength: 0,
  };
}

export function sampleDayNight(
  cycleSeconds: number,
  goldenHour: boolean,
  out: DayNightSample
): DayNightSample {
  if (goldenHour) {
    applyKeyframePair(GOLDEN, GOLDEN, 0, out);
    return out;
  }
  const cycle = ((cycleSeconds % DAY_CYCLE_S) + DAY_CYCLE_S) % DAY_CYCLE_S;
  for (let i = 0; i < KEYFRAMES.length; i++) {
    const a = KEYFRAMES[i];
    const b = KEYFRAMES[(i + 1) % KEYFRAMES.length];
    const end = i === KEYFRAMES.length - 1 ? DAY_CYCLE_S : b.time;
    if (cycle >= a.time && cycle < end) {
      // 페이즈 유지 후 경계 직전 TRANSITION_S 동안만 블렌드
      const blendStart = end - TRANSITION_S;
      const t = cycle <= blendStart ? 0 : (cycle - blendStart) / TRANSITION_S;
      applyKeyframePair(a, b, t, out);
      return out;
    }
  }
  applyKeyframePair(KEYFRAMES[0], KEYFRAMES[0], 0, out);
  return out;
}

interface SkyAndLightsProps {
  elapsedSeconds: number;
  goldenHour: boolean;
}

export const SkyAndLights = ({ elapsedSeconds, goldenHour }: SkyAndLightsProps) => {
  const scene = useThree(state => state.scene);
  const sunRef = useRef<THREE.DirectionalLight>(null);
  const hemiRef = useRef<THREE.HemisphereLight>(null);
  const target = useMemo(createDayNightSample, []);
  // 초기값은 현재 시각 기준으로 한 번 샘플링
  const current = useMemo(
    () => sampleDayNight(elapsedSeconds, false, createDayNightSample()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // 배경/안개 객체는 한 번만 설치하고 색만 매 프레임 갱신
  useEffect(() => {
    scene.background = current.sky;
    scene.fog = new THREE.Fog(current.fog, 60, 190);
    return () => {
      scene.background = null;
      scene.fog = null;
    };
  }, [scene, current]);

  useFrame((_, delta) => {
    sampleDayNight(elapsedSeconds, goldenHour, target);
    // 지수 감쇠로 부드럽게 목표값 추적 (골든아워 진입은 조금 빠르게)
    const k = 1 - Math.exp(-(goldenHour ? 1.2 : 0.5) * delta);
    current.sky.lerp(target.sky, k);
    current.fog.lerp(target.fog, k);
    current.sun.lerp(target.sun, k);
    current.sunIntensity += (target.sunIntensity - current.sunIntensity) * k;
    current.hemiIntensity += (target.hemiIntensity - current.hemiIntensity) * k;

    if (scene.fog) scene.fog.color.copy(current.fog);
    if (sunRef.current) {
      sunRef.current.color.copy(current.sun);
      sunRef.current.intensity = current.sunIntensity;
    }
    if (hemiRef.current) hemiRef.current.intensity = current.hemiIntensity;
  });

  return (
    <>
      <hemisphereLight ref={hemiRef} args={['#cfe8ff', '#3c7443', 0.6]} />
      <directionalLight
        ref={sunRef}
        position={[40, 55, 25]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-70}
        shadow-camera-right={70}
        shadow-camera-top={70}
        shadow-camera-bottom={-70}
        shadow-camera-near={10}
        shadow-camera-far={160}
      />
      <ambientLight intensity={0.25} />
    </>
  );
};
