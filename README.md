#  InsightRelay — Trending Developer Insights

<img width="1137" height="896" alt="insightrelay" src="https://github.com/user-attachments/assets/8e4073ae-4c9a-4a0e-8059-e50f71c71196" />


InsightRelay is a full-stack application that **collects and visualizes trending developer content** from:
- **Hacker News**
- **GitHub Trending**
- **Dev.to**

The project leverages **Docker**, **BullMQ**, and **Redis** for background jobs and **Next.js** for the web dashboard.

---

##  Tech Stack

**Backend**
- Node.js  
- TypeScript  
- Express  
- BullMQ (Job Queue)  
- PostgreSQL  
- Redis  

**Frontend**
- Next.js  
- React  
- TailwindCSS  

**Infrastructure**
- Docker & Docker Compose  

**Data Sources**
- GitHub REST API  
- Hacker News API  
- Dev.to API  

---

##  Architecture Overview

The system consists of **six containerized services**:

1. **Database (`db`)** — PostgreSQL for persistent storage.  
2. **Redis (`redis`)** — Message broker for BullMQ queues.  
3. **API (`api`)** — Backend that serves data to the frontend and manages queues.  
4. **Worker Collector** — Periodically fetches new data from APIs.  
5. **Worker Processor** — Cleans and stores collected data into the database.  
6. **Dashboard** — Next.js frontend to display trends visually.

---

## 🐳 Local Development

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- Node.js v18+ (for local scripts)
- Git

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/EnricoMann/InsightRelay.git

# 2. Navigate to the project directory
cd InsightRelay

# 3. Start all services
docker compose up --build
```

Once containers are running:
- Frontend: http://localhost:3000  
- API: http://localhost:8080  

---

##  Environment Variables

Copy `.env.example` to `.env` and adjust as needed:

```bash
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=insightrelay
REDIS_HOST=redis
REDIS_PORT=6379
BULLMQ_PREFIX=insightrelay
COLLECT_INTERVAL_CRON=*/5 * * * *
GITHUB_TOKEN=your_github_token_here
```

Frontend (`frontend/.env.local`):

```bash
NEXT_PUBLIC_API_URL=http://localhost:8080
```

---

##  Features

-  **Automated trending data collection** via background workers.  
-  **Unified dashboard** showing cross-platform insights.  
-  **Cron-based collectors** for periodic updates.  
-  **Full Docker environment** for quick setup.  

---

##  License

This project is licensed under the **MIT License** — see the [LICENSE](./LICENSE) file for details.

---

##  Author

Built by [**Enrico Mann**](https://github.com/EnricoMann)

 **Connect with me:**
- [GitHub](https://github.com/EnricoMann)
- [LinkedIn](https://www.linkedin.com/in/enrico-mann)
