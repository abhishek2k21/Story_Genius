# Story Genius 🎬

**Story Genius** is an advanced AI-powered platform that transforms written stories into cinematic videos. By combining narrative understanding with generative video technology, it offers a complete "Script-to-Screen" workflow for creators.

## 🚀 Unique Value Propositions

1.  **Story-First Approach**: The AI understands narrative structure, not just prompts.
2.  **Thinking AI**: visualizing the agent's decision-making process (Genre, Tone, Character Arcs) before generation.
3.  **Consistent Characters**: Maintains visual identity across scenes.
4.  **Intelligent Assembly**: Cinematic transitions and pacing based on emotional context.

## 🏗️ System Architecture

Story Genius operates as a high-performance monorepo using **Turborepo** to orchestrate multiple services.

```mermaid
graph TD
    User[User] -->|Interacts| Web[Next.js App (Web)]
    Web -->|API Requests| API[Express/Hono API]
    API -->|Jobs| Queue[Redis BullMQ]
    
    subgraph "Processing Layer"
        Queue -->|Consumes| Worker[Video/AI Workers]
        Worker -->|Analysis| AI[Vertex AI / OpenAI]
        Worker -->|Rendering| Video[FFmpeg / Runway / Pika]
    end
    
    Worker -->|Stores Assets| Storage[MinIO / S3]
    Worker -->|Updates State| DB[(PostgreSQL)]
    
    API -->|Reads State| DB
    Web -->|Visualizes| DB
```

### Shared Packages (`/packages`)

*   **`ai`**: The Intelligence Core.
    *   Handles Prompt Engineering, LLM Integration, and Narrative Analysis.
*   **`video`**: The Production Engine.
    *   Wrappers for FFmpeg and Video Generation Models.
*   **`database`**: The Source of Truth.
    *   Prisma ORM schema and database clients (PostgreSQL).
*   **`queue`**: Asynchronous Processing.
    *   Job definitions for video rendering and AI analysis (BullMQ/Redis).
*   **`storage`**: Asset Management.
    *   Abstraction layer for handling video/image assets (S3/Local).
*   **`ui`**: Design System.
    *   Shared React components and design tokens.

## 🔌 Service Ports

| Service | Port | Description |
| :--- | :--- | :--- |
| **Web App** | `3000` | The user interface (Next.js) |
| **API Server** | `3001` | Backend logic and orchestration |
| **PostgreSQL** | `5433` | Primary relational database |
| **Redis** | `6379` | Job queues and caching |
| **MinIO** | `9000` | Local S3-compatible object storage |

## ⚙️ Configuration

Configuration is managed via environment variables. Create a `.env` file in `apps/web` and `apps/api` based on `.env.example`.

### Key Variables (apps/web/.env)
```bash
# Core
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
API_URL=http://localhost:3001

# Database & Cache
DATABASE_URL="postgresql://user:pass@localhost:5433/db"
REDIS_URL="redis://localhost:6379"

# Feature Flags & API Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_... # Authentication
RUNWAY_API_KEY=key_... # Video Gen
ELEVENLABS_API_KEY=sk_... # Audio Gen
GOOGLE_APPLICATION_CREDENTIALS=... # AI Analysis
```

## 🧠 How It Works: The Pipeline

1.  **Ingestion**: User submits text. The API creates a `Project` record and enqueues an `ANALYSIS_JOB`.
2.  **Cognitive Analysis**: The `ai` package uses LLMs (Gemini/Vertex) to deconstruct the story into scenes, characters, and emotional beats.
3.  **Visualization Plan**: For each scene, the AI generates a "Visual Prompt" optimized for video models (e.g., "Cinematic wide shot, cyber-noir lighting").
4.  **Asset Generation**: 
    *   **Video**: Request sent to RunwayML/Pika via `video` package.
    *   **Audio**: ElevenLabs generates dialogue; Suno/Udio generates score.
5.  **Assembly**: FFmpeg stitches assets together based on the scene timing, adding transitions and effects.
6.  **Delivery**: Final video is uploaded to Object Storage and streamed back to the Web Dashboard.

## 🛠️ User Journey

1.  **Write/Import**: Users draft stories in a rich-text editor or import from URL.
2.  **Analyze**: AI "reads" the story, extracting characters, locations, and emotional beats.
3.  **Refine (Studio)**: Users review the scene breakdown, adjusting dialogue and action.
4.  **Direct**: Global visual style selection (Cinematic, Anime, etc.) and aspect ratio config.
5.  **Preview**: A/B testing mechanism to choose the best look for key scenes.
6.  **Generate**: Real-time rendering dashboard tracking scene-by-scene progress.
7.  **Result**: Engagement analytics and social-ready export suggestions.

## 📦 Getting Started

### Prerequisites
*   Node.js 18+
*   pnpm
*   Docker (for Redis/Postgres)

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment
cp .env.example .env

# Start development server
pnpm dev
```

## 🤝 Contributing
Built with ❤️ by the Story Genius Team.
