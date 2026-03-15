"use client";

import { useState } from "react";
import { User, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import InputField from "./InputField";

interface LoginCardProps {
  onSubmit: (username: string, password: string, remember: boolean) => void;
  loading?: boolean;
}

export default function LoginCard({ onSubmit, loading }: LoginCardProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(username, password, remember);
  }

  return (
    <div className="w-full max-w-[450px] bg-[#0F172A] border border-[#1E293B] rounded-xl p-10 shadow-2xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-2 mb-2">
          <h2 className="text-2xl font-bold text-white">Bem-vindo de volta</h2>
          <p className="text-sm text-slate-400">
            Faça login para acessar o painel de monitoramento
          </p>
        </div>

        {/* Username */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-300">Usuário</label>
          <InputField
            icon={<User size={18} />}
            type="text"
            placeholder="Digite seu usuário"
            value={username}
            onChange={setUsername}
          />
        </div>

        {/* Password */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-slate-300">Senha</label>
          <InputField
            icon={<Lock size={18} />}
            type={showPassword ? "text" : "password"}
            placeholder="Digite sua senha"
            value={password}
            onChange={setPassword}
            endIcon={showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            onEndIconClick={() => setShowPassword(!showPassword)}
          />
        </div>

        {/* Remember me & Forgot */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="w-[19px] h-[19px] rounded bg-[#1E293B] border-[#475569] accent-[#F3DE3D] cursor-pointer"
            />
            <span className="text-sm text-slate-400">Lembrar-me</span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 w-full h-14 bg-[#F3DE3D] hover:bg-[#f5e96b] text-[#1E1461] font-semibold rounded-lg transition-colors shadow-lg shadow-[#F3DE3D]/20 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? "Entrando..." : "Entrar"}
          {!loading && <ArrowRight size={18} />}
        </button>
      </form>
    </div>
  );
}
