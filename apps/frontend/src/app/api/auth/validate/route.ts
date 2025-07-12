import { NextRequest, NextResponse } from 'next/server';
import { isTokenValid, extractTokenFromBearer } from '@/utils/jwt';

export async function GET(request: NextRequest) {
  try {
    // 요청 헤더에서 Authorization 토큰 추출
    const authorization = request.headers.get('authorization');
    console.log('Authorization header:', authorization ? `Bearer ${authorization.substring(7, 20)}...` : 'missing');
    
    if (!authorization) {
      console.log('토큰 없음 - 401 반환');
      return NextResponse.json(
        { message: '인증 토큰이 필요합니다' },
        { status: 401 }
      );
    }

    // Bearer 토큰에서 실제 JWT 토큰 추출
    const token = extractTokenFromBearer(authorization);
    console.log('Extracted token:', token.substring(0, 20) + '...');
    
    // 클라이언트에서 JWT 토큰 유효성 검증
    const valid = isTokenValid(token);
    console.log('Token validation result:', valid);
    
    if (valid) {
      console.log('토큰 유효 - 200 반환');
      return NextResponse.json({ valid: true });
    } else {
      console.log('토큰 무효 - 401 반환');
      return NextResponse.json(
        { message: '토큰이 유효하지 않습니다' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Token validation API error:', error);
    return NextResponse.json(
      { message: '토큰 검증 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}