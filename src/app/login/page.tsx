"use client";

import { useState, Suspense, useEffect } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "../../../convex/_generated/api";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

function LoginForm() {
  const { signIn } = useAuthActions();
  const { isAuthenticated } = useConvexAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");
  const hasAdmins = useQuery(api.admin.hasAdmins);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const isSignUp = !!inviteToken || !hasAdmins;
      const flow = isSignUp ? "signUp" : "signIn";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const args: any = { email, password, flow };
      if (inviteToken) args.inviteToken = inviteToken;
      
      await signIn("password", args);
      // The useEffect above will handle the redirect once authenticated
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(err);
      
      let message = err?.message || "An unexpected error occurred.";
      message = message.replace(/Uncaught Error: /g, "").trim();
      
      if (message.includes("already exists")) {
        message = "An account with this email already exists. Please sign in instead of using an invite link.";
      } else if (
        message.includes("Invalid email or password") || 
        message.includes("Invalid credentials") ||
        message.includes("InvalidAccountId") ||
        message.includes("InvalidSecret")
      ) {
        message = "Invalid email or password.";
      }
      
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (hasAdmins === undefined) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-50">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-zinc-50">
      <Card className="w-full max-w-sm border-zinc-200 shadow-sm">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-semibold tracking-tight">
            {hasAdmins ? "Admin Login" : "Admin Setup"}
          </CardTitle>
          <CardDescription className="text-zinc-500">
            {hasAdmins 
              ? "Enter your credentials to access the dashboard." 
              : "Create the very first admin account to secure the dashboard."}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="text-sm font-medium text-red-500 text-center bg-red-50 p-2 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading 
                ? (hasAdmins ? "Signing in..." : "Creating account...") 
                : (hasAdmins ? "Sign in" : "Create Admin Account")}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center bg-zinc-50">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
