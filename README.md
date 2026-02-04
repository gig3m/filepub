# filepub

A simple HTML file hosting application for pub.mathetes.io.

## Features

- Public directory listing of uploaded HTML files
- Password-protected admin interface for uploads
- Drag-and-drop file uploads
- Clean URLs via `/view/filename` routes
- Persistent storage via Vercel Blob

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Update `.env.local` with your credentials:
   ```
   ADMIN_PASSWORD=your-secure-password
   SESSION_SECRET=generate-with-openssl-rand-hex-32
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

**Note:** Vercel Blob requires a valid `BLOB_READ_WRITE_TOKEN` which is only available after deploying to Vercel. Local development will show errors for file operations until deployed.

## Deployment

1. Push to GitHub
2. Import to Vercel
3. Add environment variables in Vercel dashboard:
   - `ADMIN_PASSWORD`
   - `SESSION_SECRET`
4. Enable Vercel Blob in Storage tab (auto-configures `BLOB_READ_WRITE_TOKEN`)
5. Add custom domain: `pub.mathetes.io`

## Usage

- **Public**: Visit the homepage to see uploaded files
- **Admin**: Go to `/login`, enter password, upload/manage files
- **View files**: Access via `/view/filename` (without .html extension)

## Tech Stack

- Next.js 14 (App Router)
- Vercel Blob for storage
- Tailwind CSS for styling
- TypeScript
