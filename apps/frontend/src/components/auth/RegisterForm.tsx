"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { RegisterRequest } from "@calendar-todo/shared-types";

const FormSchema = z.object({
  email: z
    .string()
    .min(1, { message: "이메일을 입력해주세요" })
    .email({ message: "올바른 이메일 형식이 아닙니다" }),
  password: z
    .string()
    .min(8, { message: "비밀번호는 최소 8자 이상이어야 합니다" })
    .regex(/^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~ ]+$/, {
      message: "비밀번호는 영문 대소문자, 숫자, 기본 특수문자만 사용할 수 있습니다"
    }),
  confirmPassword: z
    .string()
    .min(1, { message: "비밀번호 확인을 입력해주세요" }),
  name: z
    .string()
    .min(1, { message: "이름을 입력해주세요" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "비밀번호가 일치하지 않습니다",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof FormSchema>;

export function RegisterForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
    },
  });

  const registerUser = async (data: RegisterRequest) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '회원가입 중 오류가 발생했습니다');
    }

    return response.json();
  };

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);

    try {
      const registerData: RegisterRequest = {
        email: data.email,
        password: data.password,
        name: data.name,
      };

      await registerUser(registerData);

      // 회원가입 성공 시 성공 페이지로 리다이렉션
      router.push('/register/success');
    } catch (error) {
      console.error('회원가입 오류:', error);

      // 에러 메시지 파싱
      const errorMessage = error instanceof Error ? error.message : '회원가입 중 오류가 발생했습니다';

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
        <CardTitle className="text-2xl">회원가입</CardTitle>
        <CardDescription className="text-base">
          새 계정을 만들어 할일 관리를 시작하세요
        </CardDescription>
      </CardHeader>
      <CardContent className="px-8 pb-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="text-base">이름</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="이름을 입력하세요"
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
                        placeholder="비밀번호 (8자 이상, 영문/숫자/특수문자)"
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

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="text-base">비밀번호 확인</FormLabel>
                  <FormControl>
                    <div className="relative mt-3">
                      <Input
                        {...field}
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="비밀번호를 다시 입력하세요"
                        disabled={isLoading}
                        className="pr-10 h-12 text-base"
                        error={!!fieldState.error}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        disabled={isLoading}
                      >
                        {showConfirmPassword ? (
                          <EyeOffIcon className="h-4 w-4" />
                        ) : (
                          <EyeIcon className="h-4 w-4" />
                        )}
                        <span className="sr-only">
                          {showConfirmPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                        </span>
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.formState.errors.root && (
              <div className="text-sm text-red-600 text-center bg-red-50 p-3 rounded-md">
                {form.formState.errors.root.message}
              </div>
            )}

            <Button type="submit" className="w-full h-12 text-base" disabled={isLoading}>
              {isLoading ? "회원가입 중..." : "회원가입"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
