import Link from 'next/link';
import { Button } from '@calendar-todo/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@calendar-todo/ui';

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-2xl">비밀번호 찾기</CardTitle>
            <CardDescription className="text-base">
              계정 복구를 위한 안내를 받으세요
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8 space-y-6">
            <div className="text-center py-8">
              <p className="text-base text-muted-foreground mb-6">
                비밀번호 재설정 기능은 준비 중입니다.
              </p>
              <p className="text-base text-muted-foreground mb-8">
                로그인 페이지로 돌아가서 계정에 로그인해주세요.
              </p>
              <Link href="/login">
                <Button className="w-full h-12 text-base">
                  로그인 페이지로 돌아가기
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}