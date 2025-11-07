import { Queue } from 'bullmq'
import { CronJob } from 'cron'
import fetch from 'node-fetch'
import { redis } from './lib/redis'
import { env } from './lib/env'

const ingestQueue = new Queue('ingest', {
  connection: redis,
  prefix: env.bullPrefix,
})

// Keywords to detect tech-related posts from Hacker News
const techKeywords = [
  'AI', 'Machine Learning', 'Python', 'JavaScript', 'TypeScript', 'Cloud', 'AWS',
  'Kubernetes', 'Docker', 'Linux', 'React', 'Node', 'DevOps', 'Open Source', 'Data',
  'PostgreSQL', 'Neural', 'GPU', 'CLI', 'Programming', 'API', 'LangChain', 'Rust',
  'Backend', 'Frontend', 'Database', 'Security', 'LLM', 'Framework', 'Library'
]

// -----------------------------------------------------------------------------
// 📰 HACKER NEWS
// -----------------------------------------------------------------------------

async function collectHackerNewsTop() {
  const base = 'https://hacker-news.firebaseio.com/v0'
  const ids = (await (await fetch(`${base}/topstories.json`)).json()) as number[]
  const top = ids.slice(0, 50)
  const jobs = []

  for (const id of top) {
    const item = (await (await fetch(`${base}/item/${id}.json`)).json()) as {
      id: number
      title: string
      by?: string
      url?: string
      score?: number
      descendants?: number
      time?: number
    }

    if (!item?.title) continue

    // Filter out non-tech content
    const isTech = techKeywords.some(k => item.title.toLowerCase().includes(k.toLowerCase()))
    if (!isTech) continue

    jobs.push(
      ingestQueue.add(
        'ingest-item',
        {
          source_key: 'hn',
          external_id: String(item.id),
          title: item.title,
          url: item.url || `https://news.ycombinator.com/item?id=${item.id}`,
          author: item.by,
          points: item.score || 0,
          comments: item.descendants || 0,
          posted_at: new Date((item.time || 0) * 1000).toISOString(),
        },
        { removeOnComplete: 1000, removeOnFail: 1000 }
      )
    )
  }

  await Promise.all(jobs)
  console.log(`[collector] Enqueued ${jobs.length} Hacker News tech items`)
}

// -----------------------------------------------------------------------------
// 🧑‍💻 GITHUB TRENDING (official API)
// -----------------------------------------------------------------------------

async function collectGitHubTrending() {
  // Define time window: last 7 days (you can adjust)
  const since = new Date()
  since.setDate(since.getDate() - 7)
  const sinceStr = since.toISOString().split('T')[0]

  const url = `https://api.github.com/search/repositories?q=created:>${sinceStr}&sort=stars&order=desc&per_page=30`
  console.log(`[collector] Fetching GitHub trending-like repositories from official API`)

  const headers: Record<string, string> = {
    'User-Agent': 'InsightRelay',
    'Accept': 'application/vnd.github.v3+json'
  }

  // Add authentication if token is available
  if (env.github.token) {
    headers['Authorization'] = `Bearer ${env.github.token}`
  }

  const response = await fetch(url, { headers })

  if (!response.ok) {
    throw new Error(`GitHub API responded with status ${response.status}`)
  }

  const data = (await response.json()) as any
  const repos = data.items || []

  const jobs = repos.map((repo: any) =>
    ingestQueue.add(
      'ingest-item',
      {
        source_key: 'gh',
        external_id: repo.full_name,
        title: `${repo.full_name} (${repo.language || 'Unknown'})`,
        url: repo.html_url,
        author: repo.owner.login,
        points: repo.stargazers_count,
        comments: repo.forks_count,
        posted_at: repo.created_at
      },
      { removeOnComplete: 1000, removeOnFail: 1000 }
    )
  )

  await Promise.all(jobs)
  console.log(`[collector] Enqueued ${repos.length} GitHub repositories from official API`)
}

// -----------------------------------------------------------------------------
// 📝 DEV.TO ARTICLES
// -----------------------------------------------------------------------------

async function collectDevtoArticles() {
  const url = 'https://dev.to/api/articles?top=1&per_page=30'
  const articles = (await (await fetch(url)).json()) as {
    id: number
    title: string
    url: string
    readable_publish_date: string
    user: { name: string }
    public_reactions_count: number
    comments_count: number
  }[]

  const jobs = []

  for (const art of articles) {
    const isTech = techKeywords.some(k => art.title.toLowerCase().includes(k.toLowerCase()))
    if (!isTech) continue

    jobs.push(
      ingestQueue.add(
        'ingest-item',
        {
          source_key: 'dev',
          external_id: String(art.id),
          title: art.title,
          url: art.url,
          author: art.user?.name,
          points: art.public_reactions_count,
          comments: art.comments_count,
          posted_at: new Date(art.readable_publish_date).toISOString(),
        },
        { removeOnComplete: 1000, removeOnFail: 1000 }
      )
    )
  }

  await Promise.all(jobs)
  console.log(`[collector] Enqueued ${jobs.length} Dev.to articles`)
}

// -----------------------------------------------------------------------------
// ⏰ CRON JOB
// -----------------------------------------------------------------------------

const job = new CronJob(env.cron, async () => {
  try {
    console.log('[collector] Running collection cycle...')
    await collectHackerNewsTop()
    await collectGitHubTrending()
    await collectDevtoArticles()
    console.log('[collector] Cycle complete ✅')
  } catch (err) {
    console.error('[collector] error during collection:', err)
  }
})

job.start()
console.log(`[collector] Started with cron "${env.cron}"`)