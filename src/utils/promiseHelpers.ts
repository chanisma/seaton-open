/**
 * Promise에 타임아웃을 적용하는 헬퍼 함수
 * @param promise 실행할 Promise
 * @param ms 타임아웃 시간 (밀리초)
 * @param errorMessage 타임아웃 에러 메시지
 */
export const withTimeout = <T>(
  promise: PromiseLike<T>,
  ms: number,
  errorMessage = 'Operation timed out'
): Promise<T> => {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(errorMessage)), ms)
  );
  return Promise.race([promise, timeout]);
};
