import Logo from "./Logo";
import StatsIndicator from "./StatsIndicator";

interface BrandingSectionProps {
  title?: string;
  description?: string;
}

export default function BrandingSection({
  title = "Eficiência e Controle Operacional",
  description = "Gerencie sua frota com precisão cirúrgica. Monitore indicadores e mantenha o controle total com dashboards inteligentes e relatórios automatizados.",
}: BrandingSectionProps) {
  return (
    <div className="flex flex-col justify-center items-start gap-8 max-w-md">
      <Logo className="h-16 w-auto" />

      <div className="flex flex-col gap-4">
        <h1 className="text-3xl lg:text-4xl font-bold text-white leading-tight">
          {title}
        </h1>
        <p className="text-slate-400 text-base leading-relaxed">
          {description}
        </p>
      </div>

      <div className="flex items-center gap-8 mt-4">
        <StatsIndicator value="24/7" label="Monitoramento" />
        <div className="w-px h-12 bg-[#334155]" />
        <StatsIndicator value="100%" label="Rastreabilidade" />
      </div>
    </div>
  );
}
