"use client";

import BrandingSection from "./BrandingSection";
import LoginCard from "./LoginCard";
import { useState } from "react";
import { useAuth } from "@/app/auth/AuthContext";

export default function TelaDeLog() {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(
    username: string,
    password: string,
    remember: boolean
  ) {
    setIsLoading(true);
    setError("");
    try {
      await login(username, password, remember);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";
      console.log("Erro no login:", err);
      if (message === "Credenciais inválidas") {
        setError("Email ou senha incorretos.");
      } else {
        setError("Ocorreu um erro, tente novamente.");
      }
      setIsLoading(false);
    }
  }

  return (
    <div
      className="relative min-h-screen w-full flex items-center justify-center overflow-hidden"
      style={{ background: "linear-gradient(135deg, #141220 0%, #1E1461 60%, #141220 100%)" }}
    >
      {/* Glow central sutil */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(30,20,97,0.55) 0%, transparent 80%)",
        }}
      />

      {/* Layout de duas colunas */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center gap-16 lg:gap-24">
        {/* Coluna esquerda — branding */}
        <div className="flex-1 flex justify-center md:justify-start">
          <BrandingSection />
        </div>

        {/* Divisória vertical — visível só em desktop */}
        <div className="hidden md:block w-px self-stretch bg-[#334155] opacity-50" />

        {/* Coluna direita — card de login */}
        <div className="flex-1 flex justify-center md:justify-end">
          <LoginCard onSubmit={handleLogin} loading={isLoading} error={error} />
        </div>
      </div>
    </div>
  );
}
