'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

type TrendItem = {
  title: string;
  url: string;
  source_key: string;
  points: number;
  trending_score: number;
  computed_at: string;
};

export default function Home() {
  const [data, setData] = useState<TrendItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<string>('all');
  const sources = ['all', 'hn', 'gh', 'dev'];

  async function fetchData() {
    try {
      const url =
        source === 'all'
          ? `${process.env.NEXT_PUBLIC_API_URL}/trending?window=24h`
          : `${process.env.NEXT_PUBLIC_API_URL}/trending?window=24h&source=${source}`;
      const res = await axios.get(url);
      setData(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [source]);

  if (loading) {
    return <div className="text-gray-400 text-center mt-20">Loading trends...</div>;
  }

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center py-10">
      <h1 className="text-3xl font-bold mb-6 text-orange-400">InsightRelay — Trending Now</h1>

      <div className="flex gap-3 mb-8">
        {sources.map(s => (
          <button
            key={s}
            onClick={() => setSource(s)}
            className={`px-4 py-2 border rounded-lg font-semibold transition ${
              source === s
                ? 'bg-orange-400 text-black border-orange-400'
                : 'border-orange-400 text-orange-400 hover:bg-orange-400 hover:text-black'
            }`}
          >
            {s === 'all' ? 'All' : s.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="w-full max-w-3xl space-y-3">
        {data.map((item, i) => (
          <a
            key={i}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block border border-gray-800 rounded-lg hover:bg-gray-900 transition p-4"
          >
            <div className="flex justify-between">
              <h2 className="text-lg font-semibold">{item.title}</h2>
              <span className="text-orange-400 font-mono text-sm">
                {item.points} pts
              </span>
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {source === 'all' && (
                <span className="uppercase text-gray-400 mr-2">{item.source_key}</span>
              )}
              score {item.trending_score.toFixed(2)} · {dayjs(item.computed_at).fromNow()}
            </div>
          </a>
        ))}
      </div>

      <footer className="mt-10 text-gray-600 text-sm">
        Auto-refreshing every 60 seconds
      </footer>
    </main>
  );
}