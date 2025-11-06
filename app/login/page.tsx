/**
 * Login Page
 *
 * Dedicated authentication page for existing users.
 * Supports redirect query param for post-login navigation.
 */
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Heart, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSupabase } from "@/components/SupabaseProvider";

export default function LoginPage() {
  const supabase = useSupabase();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || null;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      // Redirect to custom path or let middleware handle smart routing
      if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "No pudimos iniciar sesión. Verifica tus credenciales."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 flex items-center justify-center px-4 py-12">
      {/* Header with Logo */}
      <div className="absolute top-6 left-6">
        <Link href="/" className="flex items-center gap-2">
          <Heart className="w-8 h-8 text-primary" />
          <span className="font-display text-2xl font-bold text-primary">
            AlergiasCL
          </span>
        </Link>
      </div>

      {/* Login Card */}
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="font-display text-3xl font-bold text-neutral-900">
            Iniciar Sesión
          </CardTitle>
          <CardDescription className="text-neutral-600">
            Ingresa con tu cuenta para acceder a tu perfil y escáner
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-neutral-900">
                Correo Electrónico
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={loading}
                className="w-full"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-neutral-900">
                Contraseña
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                disabled={loading}
                className="w-full"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-lg bg-danger-soft border border-danger-light">
                <p className="text-sm text-danger-dark">{error}</p>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full text-lg py-6"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Ingresando...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5 mr-2" />
                  Iniciar Sesión
                </>
              )}
            </Button>

            {/* Divider */}
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-neutral-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-neutral-500">
                  ¿No tienes cuenta?
                </span>
              </div>
            </div>

            {/* Sign Up Link */}
            <Link href="/signup" className="w-full">
              <Button variant="outline" className="w-full" type="button">
                Crear Cuenta Nueva
              </Button>
            </Link>
          </CardFooter>
        </form>
      </Card>

      {/* Footer Note */}
      <div className="absolute bottom-6 text-center text-sm text-neutral-500">
        <p>
          Al iniciar sesión, aceptas nuestros términos de uso y privacidad.
        </p>
      </div>
    </div>
  );
}
