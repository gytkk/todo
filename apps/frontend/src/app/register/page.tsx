import Link from 'next/link';
import { RegisterForm } from '@/components/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-8">
          {/* Logo/Header */}
          <div className="flex flex-col items-center gap-3 text-center">
            <h1 className="text-3xl font-semibold tracking-tight">
              할일 캘린더
            </h1>
          </div>

          {/* Register Form */}
          <RegisterForm />

          {/* Footer */}
          <div className="text-center text-base text-muted-foreground">
            <p>
              이미 계정이 있으신가요?{' '}
              <Link href="/login" className="font-medium underline underline-offset-4 hover:text-primary">
                로그인
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}