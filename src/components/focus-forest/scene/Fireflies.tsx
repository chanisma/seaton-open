// Fireflies.tsx - 야간에만 나타나는 반딧불이 (additive Points)

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { createDayNightSample, sampleDayNight } from './SkyAndLights';

const COUNT = 110;

export const Fireflies = ({
  elapsedSeconds,
  goldenHour = false,
}: {
  elapsedSeconds: number;
  goldenHour?: boolean;
}) => {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);
  const sample = useMemo(createDayNightSample, []);
  const strengthRef = useRef(0);

  // 기준 위치 + 드리프트 시드
  const { basePositions, seeds, positions } = useMemo(() => {
    const basePositions = new Float32Array(COUNT * 3);
    const seeds = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 5 + Math.random() * 43;
      basePositions[i * 3] = Math.cos(angle) * r;
      basePositions[i * 3 + 1] = 1 + Math.random() * 6;
      basePositions[i * 3 + 2] = Math.sin(angle) * r;
      seeds[i] = Math.random() * 100;
    }
    return { basePositions, seeds, positions: basePositions.slice() };
  }, []);

  useFrame(state => {
    sampleDayNight(elapsedSeconds, goldenHour, sample);
    // 밤 진입/이탈을 부드럽게
    strengthRef.current += (sample.fireflyStrength - strengthRef.current) * 0.02;
    const strength = strengthRef.current;

    if (materialRef.current) materialRef.current.opacity = strength * 0.9;
    if (!pointsRef.current || strength < 0.01) return;

    const t = state.clock.elapsedTime;
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = basePositions[i * 3] + Math.sin(t * 0.4 + seeds[i]) * 1.6;
      positions[i * 3 + 1] = basePositions[i * 3 + 1] + Math.sin(t * 0.7 + seeds[i] * 2) * 0.9;
      positions[i * 3 + 2] = basePositions[i * 3 + 2] + Math.cos(t * 0.5 + seeds[i]) * 1.6;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        size={0.8}
        color="#d8ffb0"
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
};
