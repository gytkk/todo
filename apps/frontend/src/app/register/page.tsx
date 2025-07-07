import Link from 'next/link';
import { Button } from '@calendar-todo/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@calendar-todo/ui';

export default function RegisterPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-2xl">회원가입</CardTitle>
            <CardDescription className="text-base">
              새 계정을 만들어 할일 관리를 시작하세요
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8 space-y-6">
            <div className="text-center py-8">
              <p className="text-base text-muted-foreground mb-6">
                회원가입 기능은 준비 중입니다.
              </p>
              <p className="text-base text-muted-foreground mb-8">
                로그인 페이지에서 계정으로 로그인해주세요.
              </p>
              <Link href="/login">
                <Button className="w-full h-12 text-base">
                  로그인 페이지로 이동
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}