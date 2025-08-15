import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const categoryId = searchParams.get('categoryId');
    const completed = searchParams.get('completed');

    // 요청 헤더에서 Authorization 토큰 추출
    const authorization = request.headers.get('authorization');
    if (!authorization) {
      return NextResponse.json(
        { message: '인증 토큰이 필요합니다' },
        { status: 401 }
      );
    }

    // 쿼리 파라미터 구성
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    if (categoryId) queryParams.append('categoryId', categoryId);
    if (completed) queryParams.append('completed', completed);

    const queryString = queryParams.toString();
    const url = `http://localhost:3001/todos${queryString ? `?${queryString}` : ''}`;

    // 백엔드 서버로 요청 전달
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization,
      },
    });

    const data = await response.json();
    
    // 디버깅을 위한 로깅
    console.log('Frontend API Route GET - Backend response status:', response.status);
    console.log('Frontend API Route GET - Backend response data:', data);
    console.log('Frontend API Route GET - data.todos type:', typeof data.todos);
    console.log('Frontend API Route GET - data.todos value:', data.todos);

    // 백엔드 응답을 그대로 프론트엔드로 전달
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Todo list API error:', error);
    return NextResponse.json(
      { message: '할일 목록을 불러오는 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 요청 헤더에서 Authorization 토큰 추출
    const authorization = request.headers.get('authorization');
    if (!authorization) {
      return NextResponse.json(
        { message: '인증 토큰이 필요합니다' },
        { status: 401 }
      );
    }

    // 백엔드 서버로 요청 전달
    const response = await fetch('http://localhost:3001/todos', {
      method: 'POST',
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
    console.error('Todo create API error:', error);
    return NextResponse.json(
      { message: '할일 생성 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // 요청 헤더에서 Authorization 토큰 추출
    const authorization = request.headers.get('authorization');
    if (!authorization) {
      return NextResponse.json(
        { message: '인증 토큰이 필요합니다' },
        { status: 401 }
      );
    }

    // 백엔드 서버로 요청 전달 (모든 할일 삭제)
    const response = await fetch('http://localhost:3001/todos', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization,
      },
    });

    const data = await response.json();

    // 백엔드 응답을 그대로 프론트엔드로 전달
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Todo delete all API error:', error);
    return NextResponse.json(
      { message: '모든 할일 삭제 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}