import { CheckCircle } from 'lucide-react';
import { Button } from '@calendar-todo/ui';
import Link from 'next/link';

export default function RegisterSuccessPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-8">
          {/* Success Icon */}
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                회원가입 완료!
              </h1>
              <p className="text-muted-foreground">
                성공적으로 계정이 생성되었습니다.
              </p>
            </div>
          </div>

          {/* Success Message */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <p className="text-green-800 font-medium mb-2">
              환영합니다! 🎉
            </p>
            <p className="text-green-700 text-sm">
              이제 로그인하여 할일 캘린더를 사용할 수 있습니다.
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <Link href="/login" className="w-full">
              <Button className="w-full h-12 text-base">
                로그인하러 가기
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}