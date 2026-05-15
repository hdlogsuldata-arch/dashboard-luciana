import "dotenv/config";
import {
  getAgingSeries,
  getDespesasSeries,
  getTopClientesSeries,
  getOTDSeries,
} from "@/lib/data/neon-series";

async function main() {
  for (const [label, fn] of [
    ["FIN_001 aging", getAgingSeries],
    ["FIN_007 despesas", getDespesasSeries],
    ["FIN_012 top clientes", getTopClientesSeries],
    ["OPR_001 OTD", getOTDSeries],
  ] as const) {
    const series = await fn();
    console.log(`\n=== ${label} === (${series.length} séries)`);
    for (const s of series.slice(0, 6)) {
      console.log(
        `  "${s.name}": ${s.points.length}pts → ` +
          s.points.map((p) => `[${p.x}]=${Math.round(p.y)}`).join("  "),
      );
    }
  }
  process.exit(0);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
