import Link from 'next/link';
import { list } from '@vercel/blob';

// Force dynamic rendering to always show fresh file list
export const dynamic = 'force-dynamic';

interface FileInfo {
  name: string;
  category: string | null;
  url: string;
  size: number;
  uploadedAt: Date;
}

async function getFiles(): Promise<FileInfo[]> {
  try {
    const { blobs } = await list();

    return blobs.map(blob => {
      const parts = blob.pathname.split('/');
      const category = parts.length > 1 ? parts.slice(0, -1).join('/') : null;
      const name = parts[parts.length - 1];
      return {
        name,
        category,
        url: blob.url,
        size: blob.size,
        uploadedAt: blob.uploadedAt,
      };
    });
  } catch {
    return [];
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getViewPath(file: FileInfo): string {
  const baseName = file.name.replace(/\.html?$/, '');
  return file.category ? `/view/${file.category}/${baseName}` : `/view/${baseName}`;
}

function groupByCategory(files: FileInfo[]): Map<string | null, FileInfo[]> {
  const grouped = new Map<string | null, FileInfo[]>();

  for (const file of files) {
    const existing = grouped.get(file.category) || [];
    existing.push(file);
    grouped.set(file.category, existing);
  }

  return grouped;
}

function FileTable({ files }: { files: FileInfo[] }) {
  return (
    <table className="min-w-full divide-y divide-gray-800">
      <thead className="bg-gray-900/50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-cyan-400 uppercase tracking-wider">
            Name
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-cyan-400 uppercase tracking-wider">
            Size
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-cyan-400 uppercase tracking-wider">
            Uploaded
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-800">
        {files.map((file) => (
          <tr key={file.url} className="hover:bg-gray-800/50 transition-colors">
            <td className="px-6 py-4">
              <Link
                href={getViewPath(file)}
                className="text-fuchsia-400 hover:text-fuchsia-300 hover:underline font-medium"
              >
                {file.name}
              </Link>
            </td>
            <td className="px-6 py-4 text-sm text-gray-400">
              {formatSize(file.size)}
            </td>
            <td className="px-6 py-4 text-sm text-gray-400">
              {formatDate(file.uploadedAt)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default async function HomePage() {
  const files = await getFiles();
  const grouped = groupByCategory(files);

  // Sort categories: uncategorized first, then alphabetically
  const sortedCategories = Array.from(grouped.keys()).sort((a, b) => {
    if (a === null) return -1;
    if (b === null) return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto py-12 px-4">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            <span className="text-cyan-400">pub</span>.mathetes.io
          </h1>
          <p className="text-gray-400 mt-2">Public HTML files directory</p>
        </header>

        {files.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center text-gray-500">
            No files uploaded yet.
          </div>
        ) : (
          <div className="space-y-6">
            {sortedCategories.map((category) => {
              const categoryFiles = grouped.get(category) || [];
              return (
                <div key={category ?? '__uncategorized__'}>
                  <h2 className="text-lg font-semibold text-white mb-3">
                    {category ?? 'Uncategorized'}
                  </h2>
                  <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
                    <FileTable files={categoryFiles} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <footer className="mt-8 text-center text-sm text-gray-500">
          <Link href="/login" className="hover:text-cyan-400 transition-colors">
            Admin
          </Link>
        </footer>
      </div>
    </div>
  );
}
