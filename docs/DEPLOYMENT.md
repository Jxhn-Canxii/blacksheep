# Deployment Guide: Black Sheep Collective

This document outlines the procedures for deploying the Black Sheep platform across different environments.

---

## 1. Local Development (`localhost`)
Run the application on your local machine for testing and development.

### Prerequisites
- Node.js 20.x+
- A `.env.local` file with Supabase credentials.

### Steps
1.  **Install Dependencies**:
    ```bash
    npm install
    ```
2.  **Run Development Server**:
    ```bash
    npm run dev
    ```
3.  **Access**: Open [http://localhost:3000](http://localhost:3000)

---

## 2. Vercel Deployment (Production)
Optimized for serverless environments with automatic scaling.

### Prerequisites
- GitHub repository connected to Vercel.
- Environment variables configured in the Vercel Dashboard.

### Deployment Steps
1.  **Connect Repo**: Link your repository to a new Vercel project.
2.  **Environment Variables**:
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    - `SUPABASE_SERVICE_ROLE_KEY`
    - `APP_ENV=production`
3.  **Build Settings**: Use the default Next.js preset.
4.  **Deploy**: Vercel will automatically trigger a build on every `git push`.

---

## 3. Docker Deployment (Self-Hosted)
Containerized deployment for VPS or private cloud providers.

### Prerequisites
- Docker and Docker Compose installed.

### Build and Run
1.  **Build Image**:
    ```bash
    docker build -t blacksheep-app .
    ```
2.  **Run Container**:
    ```bash
    docker run -p 3000:3000 \
      -e NEXT_PUBLIC_SUPABASE_URL=your_url \
      -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key \
      blacksheep-app
    ```

### Using Docker Compose
Create a `docker-compose.yml` (recommended):
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
```
Run with: `docker-compose up -d`

---

## 4. Automated CI/CD (GitHub Actions)
The platform is configured with a automated pipeline in `.github/workflows/deploy.yml`.

### Workflow Features
- **Quality Check**: Runs ESLint and TypeScript type checking on every PR and push.
- **Vercel Deployment**: Automatically builds and deploys to Vercel production on every push to `main`.
- **Docker Validation**: Performs a dry-run build of the Docker image to ensure container compatibility.

### Required GitHub Secrets
To enable the CI/CD pipeline, add these secrets to your GitHub Repository (**Settings > Secrets and variables > Actions**):
- `VERCEL_TOKEN`: Your Vercel Personal Access Token.
- `VERCEL_ORG_ID`: Your Vercel Organization ID.
- `VERCEL_PROJECT_ID`: Your Vercel Project ID.
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Anon Key.

---

## 5. Environment Switching Logic
The platform uses a custom proxy hub (`src/proxy.ts`) that detects the environment via the `APP_ENV` variable.
- **Local**: Disables HSTS and strict CSP to prevent SSL errors on localhost.
- **Production**: Enables full security headers (HSTS, CSP, Permissions-Policy).
