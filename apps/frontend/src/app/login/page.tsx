import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
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

          {/* Login Form */}
          <LoginForm />

          {/* Footer */}
          <div className="text-center text-base text-muted-foreground">
            <p>
              계정이 없으신가요?{' '}
              <a href="/register" className="font-medium underline underline-offset-4 hover:text-primary">
                회원가입
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
