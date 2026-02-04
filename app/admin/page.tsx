'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface FileInfo {
  name: string;
  url: string;
  size: number;
  uploadedAt: string;
}

export default function AdminPage() {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const router = useRouter();

  const loadFiles = useCallback(async () => {
    const res = await fetch('/api/files');
    const data = await res.json();
    setFiles(data.files || []);
  }, []);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  async function handleUpload(file: File) {
    if (!file.name.endsWith('.html') && !file.name.endsWith('.htm')) {
      setMessage('Only HTML files are allowed');
      return;
    }

    setUploading(true);
    setMessage('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(`Uploaded: ${data.pathname}`);
        loadFiles();
      } else {
        setMessage(data.error || 'Upload failed');
      }
    } catch {
      setMessage('Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(url: string, name: string) {
    if (!confirm(`Delete ${name}?`)) return;

    try {
      const res = await fetch('/api/files', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (res.ok) {
        setMessage(`Deleted: ${name}`);
        loadFiles();
      } else {
        setMessage('Delete failed');
      }
    } catch {
      setMessage('Delete failed');
    }
  }

  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-12 px-4">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin</h1>
            <p className="text-gray-600 mt-1">Upload and manage HTML files</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            Logout
          </button>
        </header>

        {/* Upload Area */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center mb-8 transition-colors ${
            dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'
          }`}
        >
          <input
            type="file"
            accept=".html,.htm"
            onChange={handleFileInput}
            className="hidden"
            id="file-input"
            disabled={uploading}
          />
          <label
            htmlFor="file-input"
            className="cursor-pointer"
          >
            <div className="text-gray-600">
              {uploading ? (
                'Uploading...'
              ) : (
                <>
                  <p className="text-lg font-medium">Drop HTML file here</p>
                  <p className="text-sm mt-1">or click to browse</p>
                </>
              )}
            </div>
          </label>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded ${
            message.startsWith('Uploaded') || message.startsWith('Deleted')
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}>
            {message}
          </div>
        )}

        {/* File List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Size
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {files.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                    No files uploaded yet
                  </td>
                </tr>
              ) : (
                files.map((file) => (
                  <tr key={file.url}>
                    <td className="px-6 py-4">
                      <a
                        href={`/view/${file.name.replace(/\.html?$/, '')}`}
                        target="_blank"
                        rel="noopener"
                        className="text-blue-600 hover:underline"
                      >
                        {file.name}
                      </a>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {(file.size / 1024).toFixed(1)} KB
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(file.url, file.name)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
