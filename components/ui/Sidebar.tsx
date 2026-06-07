"use client";

import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/app/auth/AuthContext";
import Logo from "./Logo";
import { DASHBOARDS } from "@/lib/dashboards";
import {
  BarChart2,
  TrendingUp,
  Truck,
  Target,
  Users,
  Settings,
  LogOut,
} from "lucide-react";

const DASHBOARD_META: Record<string, { icon: React.ReactNode; href: string }> = {
  dash_operacional: { icon: <BarChart2 size={18} />, href: "/dashboard/operacional" },
  dash_financeiro:  { icon: <TrendingUp size={18} />, href: "/dashboard/financeiro" },
  dash_frota:       { icon: <Truck size={18} />, href: "/dashboard/frota" },
  metas:            { icon: <Target size={18} />, href: "/dashboard/metas" },
  usuarios:         { icon: <Users size={18} />, href: "/admin/usuarios" },
  configuracoes:    { icon: <Settings size={18} />, href: "/admin/configuracoes" },
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const visibleDashboards = DASHBOARDS.filter((d) => {
    if (d.id === "usuarios" || d.id === "configuracoes") return user?.role === "ADMIN";
    return true;
  });

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <aside className="flex flex-col h-screen w-60 shrink-0 bg-[#0F172A] border-r border-[#1E293B]">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-[#1E293B]">
        <Logo className="h-8 w-auto" />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">
        {visibleDashboards.map((d) => {
          const meta = DASHBOARD_META[d.id];
          if (!meta) return null;
          const active = isActive(meta.href);
          return (
            <button
              key={d.id}
              onClick={() => router.push(meta.href)}
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-left transition-colors cursor-pointer
                ${active
                  ? "bg-[#1E1461] text-[#FFFFFF]"
                  : "text-slate-400 hover:bg-[#1E293B] hover:text-white"
                }`}
            >
              {meta.icon}
              <span>{d.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Usuário + Sair */}
      <div className="border-t border-[#1E293B] px-4 py-4 flex flex-col gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm text-white font-medium truncate">
            {user?.name ?? user?.email}
          </span>
          <span className="text-xs text-slate-500">{user?.role}</span>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </aside>
  );
}
