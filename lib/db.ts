import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

let _sql: NeonQueryFunction<false, false> | null = null;

function getSql(): NeonQueryFunction<false, false> {
  if (_sql) return _sql;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. Configure it in .env.local (dev) or Vercel env vars (prod/preview).',
    );
  }
  _sql = neon(url);
  return _sql;
}

export const sql: NeonQueryFunction<false, false> = new Proxy(
  ((..._args: unknown[]) => {
    throw new Error('sql should be called as a tagged template');
  }) as unknown as NeonQueryFunction<false, false>,
  {
    apply(_target, _thisArg, args) {
      return (getSql() as unknown as (...a: unknown[]) => unknown)(...args);
    },
  },
);
