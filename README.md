# GitHub Profile Analyzer 🔍

A **Node.js + Express + MySQL** backend service that analyzes GitHub user profiles using the public GitHub REST API and stores useful insights in a MySQL database.

---

## ✨ Features

- **Profile Analysis** — Fetches public GitHub profile data and computes enriched insights
- **Smart Insights** — Total stars, top languages, profile completeness score, follower ratio, and more
- **Persistent Storage** — All analysis results are stored in MySQL for later retrieval
- **Pagination & Search** — Browse stored profiles with page/limit controls and keyword search
- **Refresh Support** — Re-analyze a profile to get the latest data without creating duplicates
- **Input Validation** — Every request is validated before processing
- **Error Handling** — Consistent, informative JSON error responses

---

## 🛠 Tech Stack

| Layer         | Technology      |
| ------------- | --------------- |
| Runtime       | Node.js         |
| Framework     | Express.js      |
| Database      | MySQL           |
| HTTP Client   | Axios           |
| Validation    | express-validator |
| DB Driver     | mysql2          |

---

## 📁 Project Structure

```
BACKEND/
├── server.js                    # Entry point
├── package.json
├── .env.example                 # Environment variable template
├── .gitignore
├── schema.sql                   # Database schema
├── README.md
├── config/
│   └── db.js                    # MySQL connection pool
├── controllers/
│   └── userController.js        # Request handlers
├── routes/
│   └── userRoutes.js            # Route definitions
├── services/
│   └── githubService.js         # GitHub API + insight computation
├── models/
│   └── userModel.js             # Database queries
├── middlewares/
│   ├── errorHandler.js          # Centralized error handling
│   └── validators.js            # Input validation
└── utils/
    └── helpers.js               # Shared utility functions
```

---

## 🚀 Setup Instructions

### Prerequisites

- **Node.js** v18 or higher — [Download](https://nodejs.org/)
- **MySQL** 8.0+ — [Download](https://dev.mysql.com/downloads/)

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd BACKEND
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up the Database

Open MySQL and run the schema file:

```bash
mysql -u root -p < schema.sql
```

Or paste the contents of `schema.sql` into your MySQL client (MySQL Workbench, phpMyAdmin, etc.).

### 4. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and fill in your MySQL credentials:

```env
PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=github_analyzer

# Optional — increases GitHub API rate limit from 60 to 5000 req/hr
GITHUB_TOKEN=your_github_personal_access_token
```

### 5. Start the Server

```bash
# Production
npm start

# Development (auto-restart on file changes)
npm run dev
```

You should see:

```
✅  MySQL connected successfully
🚀  Server is running on http://localhost:3000
```

---

## 📡 API Endpoints

### Health Check

| Method | Endpoint       | Description          |
| ------ | -------------- | -------------------- |
| GET    | `/api/health`  | Check if API is live |

**Response:**
```json
{
  "success": true,
  "message": "GitHub Profile Analyzer API is running 🚀",
  "timestamp": "2026-06-13T10:00:00.000Z"
}
```

---

### Analyze a GitHub Profile

| Method | Endpoint                          | Description                              |
| ------ | --------------------------------- | ---------------------------------------- |
| POST   | `/api/users/:username/analyze`    | Fetch, analyze, and store a GitHub profile |

**Example:**
```bash
curl -X POST http://localhost:3000/api/users/torvalds/analyze
```

**Response (201):**
```json
{
  "success": true,
  "message": "Profile \"torvalds\" analyzed and saved successfully",
  "data": {
    "id": 1,
    "username": "torvalds",
    "name": "Linus Torvalds",
    "followers": 228000,
    "public_repos": 7,
    "total_stars": 185000,
    "top_languages": { "C": 4, "C++": 1 },
    "profile_completeness": 50,
    "recently_active": true,
    "..."
  }
}
```

---

### List All Analyzed Profiles

| Method | Endpoint       | Description                     |
| ------ | -------------- | ------------------------------- |
| GET    | `/api/users`   | Get all stored profiles (paginated) |

**Query Parameters:**

| Param    | Type   | Default | Description            |
| -------- | ------ | ------- | ---------------------- |
| `page`   | int    | 1       | Page number            |
| `limit`  | int    | 10      | Results per page       |
| `search` | string | —       | Search by name/location/company |

**Example:**
```bash
curl http://localhost:3000/api/users?page=1&limit=5&search=torvalds
```

---

### Get a Single Profile

| Method | Endpoint              | Description                    |
| ------ | --------------------- | ------------------------------ |
| GET    | `/api/users/:username` | Get stored data for one user   |

**Example:**
```bash
curl http://localhost:3000/api/users/torvalds
```

---

### Refresh a Profile

| Method | Endpoint                          | Description                          |
| ------ | --------------------------------- | ------------------------------------ |
| POST   | `/api/users/:username/refresh`    | Re-analyze and update stored profile |

**Example:**
```bash
curl -X POST http://localhost:3000/api/users/torvalds/refresh
```

---

### Delete a Profile

| Method | Endpoint              | Description              |
| ------ | --------------------- | ------------------------ |
| DELETE | `/api/users/:username` | Remove a stored profile  |

**Example:**
```bash
curl -X DELETE http://localhost:3000/api/users/torvalds
```

---

## 📊 Insights Computed

| Insight                    | Description                                     |
| -------------------------- | ----------------------------------------------- |
| Public Repos               | Total public repositories                       |
| Public Gists               | Total public gists                              |
| Followers / Following      | Social metrics                                  |
| Total Stars                | Sum of stars across all public repos             |
| Total Forks                | Sum of forks across all public repos             |
| Most Starred Repo          | Repository with the highest star count           |
| Top Languages              | Top 5 programming languages by repo count        |
| Avg Stars per Repo         | Mean star count per repository                   |
| Follower-to-Following Ratio | Engagement metric                              |
| Account Age                | How old the GitHub account is (in years)         |
| Profile Completeness       | Percentage of profile fields filled (0–100%)     |
| Recently Active            | Whether any repo was updated in the last 90 days |

---

## 🗄 Database Schema

See [`schema.sql`](schema.sql) for the full CREATE TABLE statement.

**Key columns in `github_profiles`:**

```
id, username, name, bio, avatar_url, html_url, location, company,
blog, email, public_repos, public_gists, followers, following,
account_created_at, account_age_years, total_stars, total_forks,
most_starred_repo_name, most_starred_repo_stars, top_languages,
avg_stars_per_repo, follower_following_ratio, profile_completeness,
recently_active, analyzed_at, updated_at
```

---

## ⚠️ Rate Limiting

The GitHub API allows **60 requests/hour** without authentication. To increase this to **5,000 requests/hour**, add a personal access token to your `.env`:

1. Go to [GitHub → Settings → Developer Settings → Personal Access Tokens](https://github.com/settings/tokens)
2. Generate a new token (no scopes needed for public data)
3. Add it to your `.env` file as `GITHUB_TOKEN`

---

## 📝 License

ISC
