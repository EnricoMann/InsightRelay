import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.PGHOST ?? 'db', // usa 'db' como fallback seguro no Docker
  port: Number(process.env.PGPORT ?? 5432),
  user: process.env.PGUSER ?? 'postgres',
  password: process.env.PGPASSWORD ?? 'postgres',
  database: process.env.PGDATABASE ?? 'insightrelay',
});

pool.connect()
  .then(() => console.log(`[db] Connected to PostgreSQL at ${process.env.PGHOST ?? 'db'}:${process.env.PGPORT ?? 5432}`))
  .catch(err => console.error('[db] Connection failed:', err));

export async function query<T>(sql: string, params?: any[]): Promise<{ rows: T[] }> {
  const result = await pool.query(sql, params);
  return { rows: result.rows as T[] };
}