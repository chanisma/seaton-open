// MiniForest3D.tsx - 정적 미니 숲 프리뷰 (frameloop="demand", 저해상도)
// 시작 화면의 현재 숲 카드와 숲 목록(ForestMap) 카드에서 사용

import { Component, useMemo, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';

import type { TreePosition } from '@/types/focusForest.types';

import { Terrain } from './Terrain';
import { Trees } from './Trees';

class PreviewErrorBoundary extends Component<
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

interface MiniForest3DProps {
  trees: TreePosition[];
  className?: string;
  /** WebGL 실패 시 대체 콘텐츠 */
  fallback?: ReactNode;
}

export const MiniForest3D = ({ trees, className, fallback = null }: MiniForest3DProps) => {
  // 프리뷰는 항상 완전 성장 상태로
  const grownTrees = useMemo(() => trees.map(t => ({ ...t, growthStage: 1 })), [trees]);

  return (
    <div className={className}>
      <PreviewErrorBoundary fallback={fallback}>
        <Canvas
          frameloop="demand"
          dpr={1}
          camera={{ fov: 45, near: 0.5, far: 400, position: [0, 52, 74] }}
          style={{ width: '100%', height: '100%' }}
          onCreated={({ camera }) => camera.lookAt(0, 0, 0)}
        >
          <color attach="background" args={['#bfe3ff']} />
          <hemisphereLight args={['#cfe8ff', '#3c7443', 0.8]} />
          <directionalLight position={[40, 55, 25]} intensity={1.3} color="#fff3df" />
          <Terrain />
          <Trees trees={grownTrees} immediate />
        </Canvas>
      </PreviewErrorBoundary>
    </div>
  );
};
