"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { 
  Button, 
  Input, 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
} from "@calendar-todo/ui";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { LoginRequest } from "@calendar-todo/shared-types";

const FormSchema = z.object({
  email: z
    .string()
    .min(1, { message: "이메일을 입력해주세요" })
    .email({ message: "올바른 이메일 형식이 아닙니다" }),
  password: z
    .string()
    .min(1, { message: "비밀번호를 입력해주세요" }),
});

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    setIsLoading(true);

    try {
      const loginData: LoginRequest = {
        email: data.email,
        password: data.password,
      };

      await login(loginData);
      
      // 로그인 성공 시 메인 페이지로 이동
      router.push('/');
    } catch (error) {
      console.error('로그인 오류:', error);
      
      // 에러 메시지 파싱
      const errorMessage = error instanceof Error ? error.message : '로그인 중 오류가 발생했습니다';
      
      // Form 레벨에서 에러 설정
      form.setError("root", {
        message: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="text-center pb-8">
        <CardTitle className="text-2xl">로그인</CardTitle>
        <CardDescription className="text-base">
          계정 정보를 입력하여 로그인하세요
        </CardDescription>
      </CardHeader>
      <CardContent className="px-8 pb-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="text-base">이메일</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="example@email.com"
                      disabled={isLoading}
                      className="h-12 text-base mt-3"
                      error={!!fieldState.error}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="text-base">비밀번호</FormLabel>
                  <FormControl>
                    <div className="relative mt-3">
                      <Input
                        {...field}
                        type={showPassword ? "text" : "password"}
                        placeholder="비밀번호를 입력하세요"
                        disabled={isLoading}
                        className="pr-10 h-12 text-base"
                        error={!!fieldState.error}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                      >
                        {showPassword ? (
                          <EyeOffIcon className="h-4 w-4" />
                        ) : (
                          <EyeIcon className="h-4 w-4" />
                        )}
                        <span className="sr-only">
                          {showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                        </span>
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-between">
              <a
                href="/forgot-password"
                className="text-base text-muted-foreground underline underline-offset-4 hover:text-primary"
              >
                비밀번호를 잊으셨나요?
              </a>
            </div>

            {form.formState.errors.root && (
              <div className="text-sm text-red-600 text-center">
                {form.formState.errors.root.message}
              </div>
            )}

            <Button type="submit" className="w-full h-12 text-base" disabled={isLoading}>
              {isLoading ? "로그인 중..." : "로그인"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
