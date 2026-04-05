# Templr - GitHub-First Architecture

Templr is a high-performance template gallery that uses a **GitHub-First Architecture** for metadata persistence and **Supabase** for media storage.

## Architecture Overview

1.  **Metadata (GitHub):** All template JSON files and the central `registry.json` are stored in a GitHub repository. This ensures "unlimited" scalability and high availability via CDNs (jsDelivr).
2.  **Media (Supabase):** Images, ZIP files, and other assets are uploaded to Supabase Storage.
3.  **Backend (Express):** Acts as a secure proxy for GitHub writes and Supabase uploads.
4.  **Frontend (React):** Fetches metadata directly from GitHub CDN for maximum speed.

## Required Environment Variables

Set these in your AI Studio environment:

### GitHub Integration (Backend)
- `GITHUB_TOKEN`: A Personal Access Token with `repo` scope.
- `GITHUB_OWNER`: Your GitHub username or organization name.
- `GITHUB_REPO`: The name of the repository to store metadata (e.g., `templr-metadata`).

### GitHub Integration (Frontend)
- `VITE_GITHUB_OWNER`: Same as above.
- `VITE_GITHUB_REPO`: Same as above.

### Supabase Integration
- `VITE_SUPABASE_URL`: Your Supabase project URL.
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key.
- `SUPABASE_SERVICE_ROLE_KEY`: (Backend only) For administrative tasks if needed.

## Setup Steps

1.  **Create a GitHub Repo:** Create a new repository (e.g., `templr-metadata`).
2.  **Configure Env Vars:** Add the variables listed above to your AI Studio project settings.
3.  **Supabase Bucket:** Ensure you have a public bucket named `assets` in your Supabase project.
4.  **Enjoy:** Your app is now ready to scale!
