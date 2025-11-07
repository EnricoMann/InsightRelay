export const env = {
  // API
  api: {
    port: parseInt(process.env.API_PORT || '8080', 10),
    host: process.env.API_HOST || '0.0.0.0'
  },

  // PostgreSQL
  pg: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    database: process.env.POSTGRES_DB || 'insightrelay'
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379', 10)
  },

  // BullMQ (filas)
  bullPrefix: process.env.BULLMQ_PREFIX || 'insightrelay',

  // Coleta automática (cron job)
  cron: process.env.COLLECT_INTERVAL_CRON || '*/5 * * * *',

  // APIs externas
  github: {
    token: process.env.GITHUB_TOKEN || '',
    apiUrl: process.env.GITHUB_API_URL || 'https://api.github.com'
  },

  devto: {
    apiUrl: process.env.DEVTO_API_URL || 'https://dev.to/api/articles'
  },

  hackernews: {
    apiUrl: process.env.HACKERNEWS_API_URL || 'https://hacker-news.firebaseio.com/v0'
  }
};