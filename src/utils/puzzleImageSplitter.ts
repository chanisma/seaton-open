import type { PuzzleGridSize, SplitImageResult } from '@project-types/puzzle.types';

/**
 * 그리드 크기 문자열을 rows/cols로 파싱
 */
export function parseGridSize(gridSize: PuzzleGridSize): { rows: number; cols: number } {
  const [cols, rows] = gridSize.split('x').map(Number);
  return { rows, cols };
}

/**
 * 이미지 파일을 Canvas에 로드
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('이미지를 로드할 수 없습니다.'));
    };
    img.src = URL.createObjectURL(file);
  });
}

/**
 * URL에서 이미지 로드
 */
function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('이미지를 로드할 수 없습니다.'));
    img.src = url;
  });
}

/**
 * Canvas를 Blob으로 변환
 */
function canvasToBlob(
  canvas: HTMLCanvasElement,
  type = 'image/webp',
  quality = 0.85
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => {
        if (blob) resolve(blob);
        else reject(new Error('이미지 조각 생성에 실패했습니다.'));
      },
      type,
      quality
    );
  });
}

/**
 * 이미지 파일을 퍼즐 조각으로 분할
 *
 * @param file - 원본 이미지 파일
 * @param gridSize - 그리드 크기 ('3x4' 또는 '4x3')
 * @returns 분할된 이미지 Blob 배열 (왼쪽→오른쪽, 위→아래 순서)
 */
export async function splitImageFile(
  file: File,
  gridSize: PuzzleGridSize
): Promise<SplitImageResult> {
  const img = await loadImage(file);
  return splitImage(img, gridSize);
}

/**
 * URL 이미지를 퍼즐 조각으로 분할
 */
export async function splitImageFromUrl(
  url: string,
  gridSize: PuzzleGridSize
): Promise<SplitImageResult> {
  const img = await loadImageFromUrl(url);
  return splitImage(img, gridSize);
}

/**
 * HTMLImageElement를 퍼즐 조각으로 분할하는 내부 함수
 */
async function splitImage(
  img: HTMLImageElement,
  gridSize: PuzzleGridSize
): Promise<SplitImageResult> {
  const { rows, cols } = parseGridSize(gridSize);
  const pieceWidth = Math.floor(img.width / cols);
  const pieceHeight = Math.floor(img.height / rows);

  const pieces: Blob[] = [];
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas 컨텍스트를 생성할 수 없습니다.');
  }

  canvas.width = pieceWidth;
  canvas.height = pieceHeight;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      ctx.clearRect(0, 0, pieceWidth, pieceHeight);
      ctx.drawImage(
        img,
        col * pieceWidth,
        row * pieceHeight,
        pieceWidth,
        pieceHeight,
        0,
        0,
        pieceWidth,
        pieceHeight
      );

      const blob = await canvasToBlob(canvas);
      pieces.push(blob);
    }
  }

  return { pieces, rows, cols };
}

/**
 * 조각 인덱스에서 행/열 위치 계산
 */
export function getPositionFromIndex(index: number, cols: number): { row: number; col: number } {
  return {
    row: Math.floor(index / cols),
    col: index % cols,
  };
}

/**
 * 이미지 파일 유효성 검사
 */
export function validateImageFile(file: File): string | null {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(file.type)) {
    return 'JPG, PNG, WebP 형식의 이미지만 업로드할 수 있습니다.';
  }

  if (file.size > maxSize) {
    return '이미지 크기는 5MB 이하여야 합니다.';
  }

  return null;
}
