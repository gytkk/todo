import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 백엔드 서버로 요청 전달
    const response = await fetch('http://localhost:3001/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    // 백엔드 응답을 그대로 프론트엔드로 전달
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Register API error:', error);
    return NextResponse.json(
      { message: '회원가입 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}