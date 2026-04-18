'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { BookMutationPayload, LibraryTenant, TenantBook } from '@/types/tenant';

interface BookManagementClientProps {
  libraries: LibraryTenant[];
}

const emptyForm = (libraryId: string): BookMutationPayload => ({
  library_id: libraryId,
  title: '',
  author: '',
  category: '',
  total_copies: 1,
  available_copies: 1,
});

export default function BookManagementClient({ libraries }: BookManagementClientProps) {
  const [selectedLibraryId, setSelectedLibraryId] = useState(libraries[0]?.id || '');
  const [books, setBooks] = useState<TenantBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [form, setForm] = useState<BookMutationPayload>(emptyForm(libraries[0]?.id || ''));
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!selectedLibraryId && libraries[0]?.id) {
      setSelectedLibraryId(libraries[0].id);
      setForm(emptyForm(libraries[0].id));
    }
  }, [libraries, selectedLibraryId]);

  useEffect(() => {
    if (!selectedLibraryId) {
      setBooks([]);
      setLoading(false);
      return;
    }

    async function loadBooks() {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/dashboard/books?libraryId=${encodeURIComponent(selectedLibraryId)}`);
      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error || 'Unable to load books.');
        setLoading(false);
        return;
      }

      setBooks(payload.books || []);
      setLoading(false);
    }

    loadBooks().catch(() => {
      setError('Unable to load books.');
      setLoading(false);
    });
  }, [selectedLibraryId]);

  const selectedLibrary = useMemo(
    () => libraries.find((library) => library.id === selectedLibraryId) || libraries[0],
    [libraries, selectedLibraryId]
  );

  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      if (!searchQuery) return true;
      const needle = searchQuery.toLowerCase();
      return (
        book.title.toLowerCase().includes(needle) ||
        book.author.toLowerCase().includes(needle) ||
        book.category.toLowerCase().includes(needle)
      );
    });
  }, [books, searchQuery]);

  function resetForm(libraryId = selectedLibraryId) {
    setEditingBookId(null);
    setForm(emptyForm(libraryId));
  }

  function startEdit(book: TenantBook) {
    setEditingBookId(book.id);
    setForm({
      library_id: book.library_id,
      title: book.title,
      author: book.author,
      category: book.category,
      total_copies: book.total_copies,
      available_copies: book.available_copies,
    });
    setSelectedLibraryId(book.library_id);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const response = await fetch('/api/dashboard/books', {
      method: editingBookId ? 'PATCH' : 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(editingBookId ? { id: editingBookId, ...form } : form),
    });

    const payload = await response.json();

    if (!response.ok) {
      setError(payload.error || 'Unable to save book.');
      return;
    }

    setBooks((current) => {
      if (editingBookId) {
        return current.map((book) => (book.id === editingBookId ? payload.book : book));
      }

      return [payload.book, ...current];
    });

    resetForm(form.library_id);
  }

  async function handleDelete(book: TenantBook) {
    const confirmed = window.confirm(`Delete "${book.title}" from ${selectedLibrary?.name || 'this library'}?`);
    if (!confirmed) {
      return;
    }

    setError(null);
    const response = await fetch('/api/dashboard/books', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: book.id, library_id: book.library_id }),
    });
    const payload = await response.json();

    if (!response.ok) {
      setError(payload.error || 'Unable to delete book.');
      return;
    }

    setBooks((current) => current.filter((item) => item.id !== book.id));
    if (editingBookId === book.id) {
      resetForm(book.library_id);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/dashboard" className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 transition">
          &larr; Volver al dashboard
        </Link>
      </div>

      <div className="grid gap-8 xl:grid-cols-[0.9fr_1.3fr]">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Editor de Libros</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                {editingBookId ? 'Actualiza el libro' : 'Agrega un libro'}
              </h2>
            </div>
            {editingBookId && (
              <button
                type="button"
                onClick={() => resetForm(selectedLibraryId)}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Biblioteca destino</span>
              <select
                value={form.library_id}
                onChange={(event) => {
                  setSelectedLibraryId(event.target.value);
                  setForm((current) => ({ ...current, library_id: event.target.value }));
                }}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition"
              >
                {libraries.map((library) => (
                  <option key={library.id} value={library.id}>
                    {library.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Título</span>
              <input
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition"
                placeholder="Ej. El Quijote"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Autor</span>
              <input
                value={form.author}
                onChange={(event) => setForm((current) => ({ ...current, author: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition"
                placeholder="Ej. Miguel de Cervantes"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Categoría</span>
              <input
                value={form.category}
                onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition"
                placeholder="Ej. Clásicos"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Total de copias</span>
                <input
                  type="number"
                  min={0}
                  value={form.total_copies}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      total_copies: Number(event.target.value || 0),
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Disponibles</span>
                <input
                  type="number"
                  min={0}
                  value={form.available_copies}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      available_copies: Number(event.target.value || 0),
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition"
                />
              </label>
            </div>

            {error && <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

            <button className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 shadow-lg active:scale-[0.98]">
              {editingBookId ? 'Guardar cambios' : 'Guardar libro'}
            </button>
          </form>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm flex flex-col min-h-[600px]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Explorar catálogo</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Libros en {selectedLibrary?.name || 'sede'}</h2>
            </div>
            <select
              value={selectedLibraryId}
              onChange={(event) => {
                setSelectedLibraryId(event.target.value);
                if (!editingBookId) {
                  setForm(emptyForm(event.target.value));
                }
              }}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm bg-slate-50 hover:bg-white transition focus:outline-none focus:ring-2 focus:ring-slate-900/5"
            >
              {libraries.map((library) => (
                <option key={library.id} value={library.id}>
                  {library.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-6">
            <input
              type="text"
              placeholder="Buscar por título, autor o categoría..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition"
            />
          </div>

          {loading && <p className="mt-10 text-center text-sm text-slate-400 font-medium">Sincronizando inventario...</p>}

          <div className="mt-6 space-y-3 overflow-y-auto pr-2 max-h-[700px]">
            {filteredBooks.map((book) => (
              <div key={book.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 hover:bg-white hover:border-slate-200 transition">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-bold text-slate-900 truncate">{book.title}</p>
                    <p className="text-sm text-slate-500 font-medium">{book.author} · {book.category}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-tight">Disponibilidad:</span>
                      <span className={cn(
                        "rounded-full px-3 py-1 text-xs font-bold",
                        book.available_copies === 0 ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                      )}>
                        {book.available_copies} de {book.total_copies} unidades
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => startEdit(book)}
                      className="rounded-xl bg-white border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(book)}
                      className="rounded-xl bg-rose-50 border border-rose-100 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-100 transition"
                    >
                      Borrar
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {!loading && filteredBooks.length === 0 && (
              <div className="mt-20 text-center py-10">
                <p className="text-slate-400 font-medium italic">No se encontraron libros que coincidan con &quot;{searchQuery}&quot;</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

