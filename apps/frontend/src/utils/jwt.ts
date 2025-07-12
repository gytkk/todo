/**
 * JWT 토큰 관련 유틸리티 함수들
 */

interface JWTPayload {
  exp: number;
  iat: number;
  sub: string;
  [key: string]: string | number | boolean | object | undefined;
}

/**
 * JWT 토큰을 디코딩하여 페이로드를 반환합니다.
 * @param token JWT 토큰 문자열
 * @returns 디코딩된 페이로드 또는 null
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    // JWT는 header.payload.signature 형태로 구성됨
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // payload 부분을 base64 디코딩
    const payload = parts[1];
    
    // base64url 디코딩을 위해 패딩 추가
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
    
    // JSON 파싱
    const decoded = JSON.parse(atob(padded));
    return decoded as JWTPayload;
  } catch (error) {
    console.error('JWT 디코딩 오류:', error);
    return null;
  }
}

/**
 * JWT 토큰이 유효한지(만료되지 않았는지) 확인합니다.
 * @param token JWT 토큰 문자열
 * @returns 토큰이 유효하면 true, 아니면 false
 */
export function isTokenValid(token: string): boolean {
  if (!token) {
    console.log('JWT 검증: 토큰 없음');
    return false;
  }

  const payload = decodeJWT(token);
  if (!payload || !payload.exp) {
    console.log('JWT 검증: 페이로드 없음 또는 만료 시간 없음');
    return false;
  }

  // 현재 시간과 만료 시간 비교 (exp는 초 단위, Date.now()는 밀리초 단위)
  const currentTime = Math.floor(Date.now() / 1000);
  const expireTime = payload.exp;

  // 1분의 여유시간을 두어 토큰 갱신을 미리 준비
  const bufferTime = 1 * 60; // 1분
  
  const isValid = expireTime > (currentTime + bufferTime);
  const remainingTime = expireTime - currentTime;
  
  console.log(`JWT 검증: 현재시간=${currentTime}, 만료시간=${expireTime}, 남은시간=${remainingTime}초, 유효=${isValid}`);
  
  return isValid;
}

/**
 * JWT 토큰의 만료 시간까지 남은 시간을 반환합니다.
 * @param token JWT 토큰 문자열
 * @returns 남은 시간(초) 또는 0
 */
export function getTokenExpirationTime(token: string): number {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) {
    return 0;
  }

  const currentTime = Math.floor(Date.now() / 1000);
  const expireTime = payload.exp;
  
  return Math.max(0, expireTime - currentTime);
}

/**
 * Bearer 토큰에서 실제 토큰 문자열을 추출합니다.
 * @param bearerToken "Bearer ..." 형태의 토큰
 * @returns 실제 JWT 토큰 문자열
 */
export function extractTokenFromBearer(bearerToken: string): string {
  if (bearerToken.startsWith('Bearer ')) {
    return bearerToken.substring(7);
  }
  return bearerToken;
}