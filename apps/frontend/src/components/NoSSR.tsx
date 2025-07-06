"use client";

import { ReactNode, useEffect, useState } from 'react';

interface NoSSRProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * NoSSR 컴포넌트 - 클라이언트에서만 렌더링
 * 하이드레이션 불일치를 방지합니다
 */
export function NoSSR({ children, fallback = null }: NoSSRProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}