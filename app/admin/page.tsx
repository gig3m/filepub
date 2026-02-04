'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface FileInfo {
  name: string;
  category: string | null;
  pathname: string;
  url: string;
  size: number;
  uploadedAt: string;
}

export default function AdminPage() {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const router = useRouter();

  const loadFiles = useCallback(async () => {
    const res = await fetch('/api/files');
    const data = await res.json();
    setFiles(data.files || []);
    setCategories(data.categories || []);
  }, []);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  // Get the effective category for uploads
  const getUploadCategory = (): string | null => {
    if (selectedCategory === '__new__') {
      return newCategory.trim() || null;
    }
    return selectedCategory || null;
  };

  async function handleUpload(file: File) {
    if (!file.name.endsWith('.html') && !file.name.endsWith('.htm')) {
      setMessage('Only HTML files are allowed');
      return;
    }

    setUploading(true);
    setMessage('');

    const formData = new FormData();
    formData.append('file', file);
    const category = getUploadCategory();
    if (category) {
      formData.append('category', category);
    }

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
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto py-12 px-4">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">
              <span className="text-cyan-400">Admin</span>
            </h1>
            <p className="text-gray-400 mt-1">Upload and manage HTML files</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Logout
          </button>
        </header>

        {/* Category Selector */}
        <div className="mb-4 flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Category (optional)
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                if (e.target.value !== '__new__') {
                  setNewCategory('');
                }
              }}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-cyan-400 focus:outline-none"
            >
              <option value="">Uncategorized</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
              <option value="__new__">+ New category...</option>
            </select>
          </div>
          {selectedCategory === '__new__' && (
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                New category name
              </label>
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="e.g., lessons"
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Upload Area */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center mb-8 transition-all ${
            dragActive
              ? 'border-cyan-400 bg-cyan-400/10 shadow-lg shadow-cyan-400/20'
              : 'border-gray-700 bg-gray-900 hover:border-gray-600'
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
            <div className={dragActive ? 'text-cyan-400' : 'text-gray-400'}>
              {uploading ? (
                <span className="text-fuchsia-400">Uploading...</span>
              ) : (
                <>
                  <p className="text-lg font-medium">Drop HTML file here</p>
                  <p className="text-sm mt-1">or click to browse</p>
                  {getUploadCategory() && (
                    <p className="text-sm mt-2 text-cyan-400">
                      Will upload to: {getUploadCategory()}/
                    </p>
                  )}
                </>
              )}
            </div>
          </label>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded border ${
            message.startsWith('Uploaded') || message.startsWith('Deleted')
              ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/50 text-rose-400'
          }`}>
            {message}
          </div>
        )}

        {/* File List */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-800">
            <thead className="bg-gray-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-cyan-400 uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-cyan-400 uppercase">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-cyan-400 uppercase">
                  Size
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-cyan-400 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {files.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No files uploaded yet
                  </td>
                </tr>
              ) : (
                files.map((file) => (
                  <tr key={file.url} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <a
                        href={`/view/${file.pathname.replace(/\.html?$/, '')}`}
                        target="_blank"
                        rel="noopener"
                        className="text-fuchsia-400 hover:text-fuchsia-300 hover:underline font-medium"
                      >
                        {file.name}
                      </a>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {file.category || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {(file.size / 1024).toFixed(1)} KB
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(file.url, file.pathname)}
                        className="text-rose-400 hover:text-rose-300 text-sm font-medium transition-colors"
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
