import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const resolvedParams = await params;
    const categoryId = resolvedParams.id;

    // 요청 헤더에서 Authorization 토큰 추출
    const authorization = request.headers.get('authorization');
    if (!authorization) {
      return NextResponse.json(
        { message: '인증 토큰이 필요합니다' },
        { status: 401 }
      );
    }

    // 백엔드 서버로 요청 전달
    const response = await fetch(`http://localhost:3001/user-settings/categories/${categoryId}/filter`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    // 백엔드 응답을 그대로 프론트엔드로 전달
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Category filter update API error:', error);
    return NextResponse.json(
      { message: '카테고리 필터 업데이트 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}