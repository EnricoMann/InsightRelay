import { Queue } from 'bullmq';
import { env } from './env';
import { redis } from './redis';

export const ingestQueue = new Queue('ingest', {
  connection: redis,
  prefix: env.bullPrefix
});
