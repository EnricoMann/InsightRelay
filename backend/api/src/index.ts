import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fastifyCors from '@fastify/cors';
import { env } from './lib/env';
import { query } from './lib/db';
import { redis } from './lib/redis';

const app: FastifyInstance = Fastify({ logger: true });

app.register(fastifyCors, { origin: '*' });

// Simple healthcheck for DB + Redis
app.get('/health', async () => {
  const { rows } = await query<{ now: string }>('SELECT NOW() as now');
  const pong = await redis.ping();
  return { status: 'ok', db: rows[0].now, redis: pong };
});

// Trending endpoint with cache and source filter
app.get(
  '/trending',
  async (req: FastifyRequest, reply: FastifyReply) => {
    const { window = '24h', source = 'all' } = req.query as { window?: string; source?: string };
    const cacheKey = `trending:${window}:${source}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      reply.header('X-Cache', 'HIT');
      return JSON.parse(cached);
    }

    const sql = `
      SELECT DISTINCT ON (i.id)
        i.id,
        i.title,
        i.url,
        i.source_key,
        COALESCE(i.points, 0) AS points,
        tm.trending_score,
        tm.computed_at
      FROM trend_metrics tm
      JOIN items i ON i.id = tm.item_id
      WHERE tm.time_window = $1
      ${source && source !== 'all' ? 'AND i.source_key = $2' : ''}
      ORDER BY i.id, tm.computed_at DESC, tm.trending_score DESC
      LIMIT 50;
    `;

    const params = source && source !== 'all' ? [window, source] : [window];
    const { rows } = await query(sql, params);

    await redis.setex(cacheKey, 60, JSON.stringify(rows)); // Cache por 60s
    reply.header('X-Cache', 'MISS');
    return rows;
  }
);

app
  .listen({ port: env.api.port, host: env.api.host })
  .then(() => {
    app.log.info(`API running on http://${env.api.host}:${env.api.port}`);
  })
  .catch((err: Error) => {
    app.log.error(err);
    process.exit(1);
  });