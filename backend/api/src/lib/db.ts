import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.PGHOST ?? 'db',  // usa o nome do serviço Docker
  port: Number(process.env.PGPORT ?? 5432),
  user: process.env.PGUSER ?? 'postgres',
  password: process.env.PGPASSWORD ?? 'postgres',
  database: process.env.PGDATABASE ?? 'insightrelay',
});

export async function query<T>(sql: string, params?: any[]): Promise<{ rows: T[] }> {
  const result = await pool.query(sql, params);
  return { rows: result.rows as T[] };
}