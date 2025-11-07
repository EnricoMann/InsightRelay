import { Worker, QueueEvents } from 'bullmq';
import { env } from './lib/env';
import { query } from './lib/db';

const connection = {
  host: env.redis.host,
  port: env.redis.port,
  maxRetriesPerRequest: null
};

const queueName = 'ingest';
const prefix = env.bullPrefix;

type IngestJob = {
  source_key: string;
  external_id: string;
  title: string;
  url?: string;
  author?: string;
  points?: number;
  comments?: number;
  posted_at?: string;
};

async function upsertItem(j: IngestJob): Promise<number> {
  try {
    const sql = `
      INSERT INTO items (source_key, external_id, title, url, author, points, comments, posted_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      ON CONFLICT (source_key, external_id) DO UPDATE
        SET title = EXCLUDED.title,
            url = EXCLUDED.url,
            author = EXCLUDED.author,
            points = EXCLUDED.points,
            comments = EXCLUDED.comments,
            posted_at = EXCLUDED.posted_at
      RETURNING id;
    `;
    const { rows } = await query<{ id: number }>(sql, [
      j.source_key,
      j.external_id,
      j.title ?? '(no title)',
      j.url ?? null,
      j.author ?? null,
      j.points ?? 0,
      j.comments ?? 0,
      j.posted_at ?? new Date().toISOString()
    ]);
    return rows[0].id;
  } catch (err) {
    console.error('[processor] upsertItem error:', err);
    throw err;
  }
}

function computeTrendingScore(points: number, comments: number, postedAt?: string): number {
  const posted = postedAt ? new Date(postedAt).getTime() : Date.now();
  const hours = Math.max(1, (Date.now() - posted) / 36e5);
  const score = (points / hours) + Math.log10(comments + 1);
  return Number(score.toFixed(6));
}

async function recordTrending(itemId: number, window: string, score: number) {
  try {
    await query(
      `INSERT INTO trend_metrics (item_id, time_window, trending_score)
       VALUES ($1,$2,$3);`,
      [itemId, window, score]
    );
  } catch (err) {
    console.error(`[processor] recordTrending error (${window}):`, err);
    throw err;
  }
}

const worker = new Worker<IngestJob>(
  queueName,
  async job => {
    try {
      const id = await upsertItem(job.data);
      const score1h = computeTrendingScore(job.data.points || 0, job.data.comments || 0, job.data.posted_at);
      await recordTrending(id, '1h', score1h);

      const score24h = computeTrendingScore(
        (job.data.points || 0) * 0.7,
        job.data.comments || 0,
        job.data.posted_at
      );
      await recordTrending(id, '24h', score24h);
    } catch (err) {
      console.error(`[processor] job ${job.id} failed:`, err);
      throw err;
    }
  },
  { connection, prefix }
);

const qe = new QueueEvents(queueName, { connection, prefix });
qe.on('completed', ({ jobId }) => console.log(`[processor] completed job ${jobId}`));
qe.on('failed', ({ jobId, failedReason }) =>
  console.error(`[processor] failed job ${jobId}: ${failedReason}`)
);

console.log('[processor] worker started');