/**
 * Landing Page - Smart Auth-Aware Homepage
 *
 * Shows different CTAs based on user state:
 * - Not authenticated: "Comenzar" → /signup
 * - Authenticated + no onboarding: "Completar Configuración" → /onboarding
 * - Authenticated + completed: "Ir al Escáner" → /scan
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Scan, ShieldCheck, Heart, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSupabase } from "@/components/SupabaseProvider";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type UserState = "loading" | "unauthenticated" | "needs_onboarding" | "ready";

export default function Home() {
  const supabase = useSupabase();
  const router = useRouter();
  const [userState, setUserState] = useState<UserState>("loading");

  useEffect(() => {
    async function checkUserState() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setUserState("unauthenticated");
        return;
      }

      // Check onboarding status
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("onboarding_completed_at")
        .eq("user_id", session.user.id)
        .single();

      setUserState(profile?.onboarding_completed_at ? "ready" : "needs_onboarding");
    }

    checkUserState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCTA = () => {
    switch (userState) {
      case "unauthenticated":
        router.push("/signup");
        break;
      case "needs_onboarding":
        router.push("/onboarding");
        break;
      case "ready":
        router.push("/scan");
        break;
    }
  };

  const getCTALabel = () => {
    switch (userState) {
      case "unauthenticated":
        return "Comenzar Ahora";
      case "needs_onboarding":
        return "Completar Configuración";
      case "ready":
        return "Ir al Escáner";
      default:
        return "Cargando...";
    }
  };

  const getCTAIcon = () => {
    switch (userState) {
      case "unauthenticated":
        return <Heart className="w-5 h-5 ml-2" />;
      case "needs_onboarding":
        return <ShieldCheck className="w-5 h-5 ml-2" />;
      case "ready":
        return <Scan className="w-5 h-5 ml-2" />;
      default:
        return <Loader2 className="w-5 h-5 ml-2 animate-spin" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Heart className="w-8 h-8 text-primary" />
          <span className="font-display text-2xl font-bold text-primary">
            AlergiasCL
          </span>
        </div>
        {userState === "unauthenticated" && (
          <Link href="/login">
            <Button variant="ghost" className="text-primary hover:text-primary">
              Iniciar Sesión
            </Button>
          </Link>
        )}
        {userState === "ready" && (
          <Link href="/profile">
            <Button variant="ghost" className="text-primary hover:text-primary">
              Mi Perfil
            </Button>
          </Link>
        )}
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16 md:py-24">
        <section className="text-center space-y-8 max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-soft rounded-full">
            <span className="text-sm font-semibold text-primary-900">
              ✨ Nueva versión disponible
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-display text-4xl md:text-6xl font-bold text-neutral-900 leading-tight">
            Tu asistente personal para{" "}
            <span className="text-primary">identificar alérgenos</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-neutral-600 max-w-2xl mx-auto leading-relaxed">
            Escanea etiquetas de productos chilenos y recibe evaluaciones de
            riesgo personalizadas en segundos. Protege tu salud con inteligencia
            artificial.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button
              onClick={handleCTA}
              disabled={userState === "loading"}
              size="lg"
              className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-shadow"
            >
              {getCTALabel()}
              {getCTAIcon()}
            </Button>

            <a
              href="https://github.com/your-repo/alergias-app"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                Ver Código
              </Button>
            </a>
          </div>

          {/* Trust Badge */}
          {userState === "ready" && (
            <p className="text-sm text-neutral-600">
              ✅ Tu perfil está completo y listo para escanear
            </p>
          )}
          {userState === "needs_onboarding" && (
            <p className="text-sm text-warning-dark font-medium">
              ⚠️ Completa tu configuración para recibir evaluaciones personalizadas
            </p>
          )}
        </section>

        {/* Features Grid */}
        <section className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mt-24">
          <div className="text-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent-scan/10 mb-4">
              <Scan className="w-8 h-8 text-accent-scan" />
            </div>
            <h3 className="font-display text-xl font-semibold text-neutral-900 mb-2">
              Escaneo Inteligente
            </h3>
            <p className="text-neutral-600">
              Tecnología de visión por computadora analiza etiquetas completas,
              incluyendo ingredientes, advertencias y E-numbers.
            </p>
          </div>

          <div className="text-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-display text-xl font-semibold text-neutral-900 mb-2">
              Perfil Personalizado
            </h3>
            <p className="text-neutral-600">
              Configura tus alergias, intolerancias y dietas. El sistema evalúa
              cada producto según tu perfil individual.
            </p>
          </div>

          <div className="text-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent-fresh/10 mb-4">
              <Users className="w-8 h-8 text-accent-fresh" />
            </div>
            <h3 className="font-display text-xl font-semibold text-neutral-900 mb-2">
              Para Toda la Familia
            </h3>
            <p className="text-neutral-600">
              Modos especiales para niños, embarazo y personas con riesgo de
              anafilaxis. Protección adaptada a cada miembro.
            </p>
          </div>
        </section>

        {/* How It Works */}
        <section className="max-w-4xl mx-auto mt-24 space-y-8">
          <h2 className="font-display text-3xl font-bold text-center text-neutral-900">
            ¿Cómo funciona?
          </h2>

          <div className="space-y-6">
            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold text-lg text-neutral-900 mb-1">
                  Crea tu perfil
                </h3>
                <p className="text-neutral-600">
                  Completa el onboarding de 7 pasos: dietas, alergias,
                  intolerancias y nivel de estrictitud. Toma solo 5 minutos.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold text-lg text-neutral-900 mb-1">
                  Escanea productos
                </h3>
                <p className="text-neutral-600">
                  Toma una foto de la etiqueta o pega el texto de ingredientes.
                  La IA extrae y analiza toda la información relevante.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold text-lg text-neutral-900 mb-1">
                  Recibe tu evaluación
                </h3>
                <p className="text-neutral-600">
                  Obtén un semáforo de riesgo (bajo/medio/alto), lista de
                  ingredientes problemáticos y recomendaciones personalizadas.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 text-center text-neutral-600 border-t border-neutral-200 mt-24">
        <p className="text-sm">
          &copy; 2025 AlergiasCL. Hecho con ❤️ para la comunidad de personas con
          alergias.
        </p>
        <p className="text-xs mt-2 text-neutral-500">
          Este es un asistente de apoyo, no sustituye el consejo médico profesional.
        </p>
      </footer>
    </div>
  );
}
