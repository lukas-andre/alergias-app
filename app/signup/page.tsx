/**
 * Signup Page
 *
 * Dedicated registration page for new users.
 * Sends email confirmation and provides clear next steps.
 */
"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Heart, UserPlus, CheckCircle2 } from "lucide-react";
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

export default function SignupPage() {
  const supabase = useSupabase();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validate password match
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden. Por favor, verifica e intenta nuevamente.");
      setLoading(false);
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      setLoading(false);
      return;
    }

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "No pudimos crear tu cuenta. Por favor, intenta nuevamente."
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

      {/* Signup Card */}
      <Card className="w-full max-w-md shadow-xl">
        {success ? (
          // Success State
          <>
            <CardHeader className="space-y-2 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-success-soft flex items-center justify-center mb-4">
                <CheckCircle2 className="w-10 h-10 text-success" />
              </div>
              <CardTitle className="font-display text-3xl font-bold text-neutral-900">
                ¡Cuenta Creada!
              </CardTitle>
              <CardDescription className="text-neutral-600">
                Te hemos enviado un correo de confirmación
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-primary-soft border border-primary-light">
                <h3 className="font-semibold text-primary-900 mb-2">
                  Próximos pasos:
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-neutral-700">
                  <li>Revisa tu bandeja de entrada ({email})</li>
                  <li>Haz clic en el enlace de confirmación</li>
                  <li>Serás redirigido automáticamente al onboarding</li>
                  <li>Completa tu perfil de alergias (7 pasos, 5 minutos)</li>
                </ol>
              </div>

              <p className="text-xs text-neutral-500 text-center">
                Si no ves el correo en unos minutos, revisa tu carpeta de spam.
              </p>
            </CardContent>

            <CardFooter className="flex flex-col gap-3">
              <Link href="/login" className="w-full">
                <Button variant="default" className="w-full">
                  Ir a Iniciar Sesión
                </Button>
              </Link>
              <Link href="/" className="w-full">
                <Button variant="ghost" className="w-full">
                  Volver al Inicio
                </Button>
              </Link>
            </CardFooter>
          </>
        ) : (
          // Form State
          <>
            <CardHeader className="space-y-2 text-center">
              <CardTitle className="font-display text-3xl font-bold text-neutral-900">
                Crear Cuenta
              </CardTitle>
              <CardDescription className="text-neutral-600">
                Únete a AlergiasCL y protege tu salud con inteligencia artificial
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
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    disabled={loading}
                    className="w-full"
                    minLength={6}
                  />
                  <p className="text-xs text-neutral-500">
                    Usa al menos 6 caracteres con una combinación de letras y números.
                  </p>
                </div>

                {/* Confirm Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-neutral-900">
                    Confirmar Contraseña
                  </Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Repite tu contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    disabled={loading}
                    className="w-full"
                    minLength={6}
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-3 rounded-lg bg-danger-soft border border-danger-light">
                    <p className="text-sm text-danger-dark">{error}</p>
                  </div>
                )}

                {/* Disclaimer */}
                <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200">
                  <p className="text-xs text-neutral-600">
                    <strong>Nota importante:</strong> AlergiasCL es un asistente de apoyo. No
                    sustituye el consejo médico profesional. Siempre consulta con tu especialista.
                  </p>
                </div>
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
                      Creando cuenta...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5 mr-2" />
                      Crear Cuenta
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
                      ¿Ya tienes cuenta?
                    </span>
                  </div>
                </div>

                {/* Login Link */}
                <Link href="/login" className="w-full">
                  <Button variant="outline" className="w-full" type="button">
                    Iniciar Sesión
                  </Button>
                </Link>
              </CardFooter>
            </form>
          </>
        )}
      </Card>

      {/* Footer Note */}
      <div className="absolute bottom-6 text-center text-sm text-neutral-500">
        <p>
          Al crear una cuenta, aceptas nuestros términos de uso y privacidad.
        </p>
      </div>
    </div>
  );
}
