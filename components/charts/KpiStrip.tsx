import KpiCard, { type KpiTarget } from "./KpiCard";
import type { KpiId } from "../../lib/charts/registry";

type KpiItem = {
  kpiId: string;
  value: number | null;
  target?: KpiTarget;
};

export default function KpiStrip({ items }: { items: KpiItem[] }) {
  if (!items.length) return null;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${items.length}, 1fr)`,
        gap: 16,
      }}
    >
      {items.map(({ kpiId, value, target }) => (
        <KpiCard key={kpiId} kpiId={kpiId as KpiId} value={value} target={target} />
      ))}
    </div>
  );
}
