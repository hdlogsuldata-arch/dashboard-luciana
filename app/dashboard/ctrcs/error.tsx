'use client';

export default function CtrcsError({ error }: { error: Error & { digest?: string } }) {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold mb-4 text-red-700">
        Erro ao carregar CTRCs
      </h1>
      <p className="text-sm text-gray-700 mb-2">
        O dashboard não conseguiu ler do banco. Causas comuns:
      </p>
      <ul className="text-sm text-gray-700 list-disc pl-6 mb-4">
        <li>Migrations ainda não aplicadas (rodar o workflow ETL pela primeira vez)</li>
        <li>Variável <code className="font-mono">DATABASE_URL</code> não configurada no Vercel</li>
        <li>Banco Neon suspenso por inatividade — primeira request acorda</li>
      </ul>
      <details className="text-xs text-gray-500">
        <summary>Detalhes técnicos</summary>
        <pre className="mt-2 whitespace-pre-wrap">{error.message}</pre>
      </details>
    </main>
  );
}
