interface StatsIndicatorProps {
  value: string;
  label: string;
}

export default function StatsIndicator({ value, label }: StatsIndicatorProps) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-2xl font-bold text-[#F3DE3D]">{value}</span>
      <span className="text-sm text-slate-400">{label}</span>
    </div>
  );
}
