# FilePub

A simple HTML file upload and hosting application for pub.mathetes.io.

## Overview

FilePub allows authenticated admins to upload HTML files which are then publicly accessible via clean URLs. Files are stored in Vercel Blob for persistence across deployments.

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Vercel Blob** for file storage

## Key Routes

| Route | Purpose |
|-------|---------|
| `/` | Public file directory listing |
| `/login` | Admin authentication |
| `/admin` | Upload and manage files (protected) |
| `/view/[filename]` | Serve uploaded HTML files (no extension needed) |

## API Endpoints

- `GET /api/files` - List all uploaded files (public)
- `DELETE /api/files` - Delete a file (authenticated)
- `POST /api/upload` - Upload HTML file (authenticated)
- `POST /api/auth` - Authenticate with password
- `POST /api/logout` - Clear session

## Environment Variables

Required in `.env.local` for local development and in Vercel dashboard for production:

```
ADMIN_PASSWORD          # Admin login password
SESSION_SECRET          # 32-byte hex string (generate with: openssl rand -hex 32)
BLOB_READ_WRITE_TOKEN   # Auto-configured by Vercel when Blob storage is enabled
```

## Local Development

```bash
npm install
npm run dev
```

Note: Vercel Blob requires deployment or `vercel dev` with linked project for full functionality.

## Deployment

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Enable Vercel Blob in Storage tab
5. (Optional) Add custom domain `pub.mathetes.io`

## Architecture

- **Authentication**: Password-based with HMAC-SHA256 signed session cookies (24h expiry)
- **Middleware**: Protects `/admin/*` routes, redirects to `/login` if unauthenticated
- **File Storage**: Vercel Blob with original filenames preserved
- **Caching**: 1-hour cache on `/view/*` routes via `vercel.json`
