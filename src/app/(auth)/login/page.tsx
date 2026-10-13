"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api-client";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const LoginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginInput = z.infer<typeof LoginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(LoginSchema) });

  const onSubmit = async (values: LoginInput) => {
    setServerError(null);
    try {
      await login(values.email, values.password);
      router.push("/dashboard");
    } catch (e) {
      if (e instanceof ApiError) setServerError(e.message);
      else setServerError("Login failed. Please try again.");
    }
  };

  return (
    <main id="main-content" className="mx-auto max-w-md py-10">
      <h1 className="sr-only">Log in to SmartOS</h1>
      <Card title="Log in">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3" aria-label="Login form">
          <Input label="Email" type="email" autoComplete="email" required error={errors.email?.message} {...register("email")} />
          <Input label="Password" type="password" autoComplete="current-password" required error={errors.password?.message} {...register("password")} />
          {serverError ? (
            <p role="alert" className="text-sm text-red-600">
              {serverError}
            </p>
          ) : null}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </Card>
    </main>
  );
}
