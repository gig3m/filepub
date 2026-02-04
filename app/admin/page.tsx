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

interface EditingFile {
  file: FileInfo;
  newName: string;
  newCategory: string;
}

export default function AdminPage() {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [editingFile, setEditingFile] = useState<EditingFile | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
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

  async function handleRename() {
    if (!editingFile) return;

    const { file, newName, newCategory } = editingFile;
    const trimmedName = newName.trim();

    if (!trimmedName) {
      setMessage('Name cannot be empty');
      return;
    }

    // Ensure .html extension
    const finalName = trimmedName.endsWith('.html') || trimmedName.endsWith('.htm')
      ? trimmedName
      : `${trimmedName}.html`;

    const newPathname = newCategory ? `${newCategory}/${finalName}` : finalName;

    // Check if nothing changed
    if (newPathname === file.pathname) {
      setEditingFile(null);
      return;
    }

    try {
      const res = await fetch('/api/files', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: file.url, newPathname }),
      });

      if (res.ok) {
        setMessage(`Renamed: ${file.pathname} → ${newPathname}`);
        setEditingFile(null);
        loadFiles();
      } else {
        const data = await res.json();
        setMessage(data.error || 'Rename failed');
      }
    } catch {
      setMessage('Rename failed');
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

  function startEditing(file: FileInfo) {
    setEditingFile({
      file,
      newName: file.name.replace(/\.html?$/, ''),
      newCategory: file.category || '',
    });
  }

  function toggleCategory(category: string) {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }

  // Group files by category for tree view
  const groupedFiles = files.reduce((acc, file) => {
    const cat = file.category || '__uncategorized__';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(file);
    return acc;
  }, {} as Record<string, FileInfo[]>);

  // Sort categories: uncategorized first, then alphabetically
  const sortedCategories = Object.keys(groupedFiles).sort((a, b) => {
    if (a === '__uncategorized__') return -1;
    if (b === '__uncategorized__') return 1;
    return a.localeCompare(b);
  });

  // All categories for the move dropdown (including empty for uncategorized)
  const allCategoryOptions = ['', ...categories];

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
              Upload to category (optional)
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
            message.startsWith('Uploaded') || message.startsWith('Deleted') || message.startsWith('Renamed')
              ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/50 text-rose-400'
          }`}>
            {message}
          </div>
        )}

        {/* Edit Modal */}
        {editingFile && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-white mb-4">Edit File</h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Filename
                </label>
                <input
                  type="text"
                  value={editingFile.newName}
                  onChange={(e) => setEditingFile({ ...editingFile, newName: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-400 focus:outline-none"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">.html extension will be added if missing</p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Category
                </label>
                <select
                  value={editingFile.newCategory}
                  onChange={(e) => setEditingFile({ ...editingFile, newCategory: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-cyan-400 focus:outline-none"
                >
                  <option value="">Uncategorized</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setEditingFile(null)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRename}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-medium rounded-lg transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* File Tree */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          {files.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No files uploaded yet
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {sortedCategories.map((category) => {
                const categoryFiles = groupedFiles[category];
                const displayName = category === '__uncategorized__' ? 'Uncategorized' : category;
                const isCollapsed = collapsedCategories.has(category);

                return (
                  <div key={category}>
                    {/* Category Header */}
                    <button
                      onClick={() => toggleCategory(category)}
                      className="w-full px-4 py-3 flex items-center gap-2 bg-gray-900/50 hover:bg-gray-800/50 transition-colors text-left"
                    >
                      <span className={`text-cyan-400 transition-transform ${isCollapsed ? '' : 'rotate-90'}`}>
                        ▶
                      </span>
                      <span className="text-cyan-400 font-medium">{displayName}</span>
                      <span className="text-gray-500 text-sm">({categoryFiles.length})</span>
                    </button>

                    {/* Files in Category */}
                    {!isCollapsed && (
                      <div className="divide-y divide-gray-800/50">
                        {categoryFiles.map((file) => (
                          <div
                            key={file.url}
                            className="pl-10 pr-4 py-3 flex items-center justify-between hover:bg-gray-800/30 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="text-gray-600">📄</span>
                              <a
                                href={`/view/${file.pathname.replace(/\.html?$/, '')}`}
                                target="_blank"
                                rel="noopener"
                                className="text-fuchsia-400 hover:text-fuchsia-300 hover:underline font-medium truncate"
                              >
                                {file.name}
                              </a>
                              <span className="text-gray-500 text-sm whitespace-nowrap">
                                {(file.size / 1024).toFixed(1)} KB
                              </span>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <button
                                onClick={() => startEditing(file)}
                                className="text-gray-400 hover:text-cyan-400 text-sm font-medium transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(file.url, file.pathname)}
                                className="text-gray-400 hover:text-rose-400 text-sm font-medium transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
