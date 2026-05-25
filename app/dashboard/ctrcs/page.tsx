import { sql } from '@/lib/db';

export const revalidate = 86400; // 1 dia — bate com o cron diário do ETL

type CtrcRow = {
  numero_ctrc: string | null;
  data_emissao_raw: string | null;
  valor_frete: number | string | null;
  remetente_nome: string | null;
  destinatario_nome: string | null;
};

function formatCurrency(value: number | string | null): string {
  if (value === null || value === undefined) return '—';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (Number.isNaN(num)) return '—';
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default async function CtrcsPage() {
  // Resiliente: falha de query (Neon frio, view com dado sujo) renderiza o estado
  // vazio em vez de derrubar o prerender/build inteiro.
  let rows: CtrcRow[] = [];
  try {
    rows = (await sql`
      SELECT numero_ctrc, data_emissao_raw, valor_frete, remetente_nome, destinatario_nome
      FROM v_ctrc_emitidos
      WHERE extracted_at = (
        SELECT MAX(extracted_at) FROM ssw_extractions
        WHERE report_pasta = 'ctrc' AND report_codigo = 174
      )
      ORDER BY data_emissao_raw DESC NULLS LAST
      LIMIT 100
    `) as CtrcRow[];
  } catch (err) {
    console.error("[dashboard/ctrcs] falha ao consultar v_ctrc_emitidos:", err);
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold mb-4">CTRCs emitidos</h1>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-600">
          Sem dados ainda. O pipeline roda toda segunda 04:00 BRT.
        </p>
      ) : (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left p-2">CTRC</th>
              <th className="text-left p-2">Emissão</th>
              <th className="text-right p-2">Valor</th>
              <th className="text-left p-2">Remetente</th>
              <th className="text-left p-2">Destinatário</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={`${r.numero_ctrc ?? 'n'}-${i}`} className="border-b">
                <td className="p-2">{r.numero_ctrc ?? '—'}</td>
                <td className="p-2">{r.data_emissao_raw ?? '—'}</td>
                <td className="p-2 text-right">{formatCurrency(r.valor_frete)}</td>
                <td className="p-2">{r.remetente_nome ?? '—'}</td>
                <td className="p-2">{r.destinatario_nome ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
