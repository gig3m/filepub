import Link from 'next/link';

interface FileInfo {
  name: string;
  url: string;
  size: number;
  uploadedAt: string;
}

async function getFiles(): Promise<FileInfo[]> {
  // In production, use the full URL
  const baseUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'http://localhost:3000';
  
  try {
    const res = await fetch(`${baseUrl}/api/files`, { 
      cache: 'no-store' 
    });
    
    if (!res.ok) return [];
    const data = await res.json();
    return data.files || [];
  } catch {
    return [];
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default async function HomePage() {
  const files = await getFiles();

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
          <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
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
                        href={`/view/${file.name.replace('.html', '')}`}
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
