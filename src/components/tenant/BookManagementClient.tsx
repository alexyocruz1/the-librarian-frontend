'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
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
    <div className="grid gap-8 xl:grid-cols-[0.9fr_1.3fr]">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Editor de Libros</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              {editingBookId ? 'Actualiza un libro en el catálogo' : 'Agrega un libro a la biblioteca'}
            </h2>
          </div>
          {editingBookId && (
            <button
              type="button"
              onClick={() => resetForm(selectedLibraryId)}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Cancelar edición
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Biblioteca</span>
            <select
              value={form.library_id}
              onChange={(event) => {
                setSelectedLibraryId(event.target.value);
                setForm((current) => ({ ...current, library_id: event.target.value }));
              }}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
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
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Autor</span>
            <input
              value={form.author}
              onChange={(event) => setForm((current) => ({ ...current, author: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Categoría</span>
            <input
              value={form.category}
              onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
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
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Copias disponibles</span>
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
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              />
            </label>
          </div>

          {error && <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

          <button className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700">
            {editingBookId ? 'Guardar cambios' : 'Guardar libro'}
          </button>
        </form>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Inventario completo</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Libros de {selectedLibrary?.name || 'la biblioteca'}</h2>
          </div>
          <select
            value={selectedLibraryId}
            onChange={(event) => {
              setSelectedLibraryId(event.target.value);
              if (!editingBookId) {
                setForm(emptyForm(event.target.value));
              }
            }}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
          >
            {libraries.map((library) => (
              <option key={library.id} value={library.id}>
                {library.name}
              </option>
            ))}
          </select>
        </div>

        {loading && <p className="mt-6 text-sm text-slate-500">Cargando los libros...</p>}

        <div className="mt-6 space-y-3">
          {books.map((book) => (
            <div key={book.id} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-lg font-semibold text-slate-900">{book.title}</p>
                  <p className="text-sm text-slate-600">{book.author} · {book.category}</p>
                  <p className="mt-2 text-sm text-slate-500">
                    Disponibles {book.available_copies} de {book.total_copies}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(book)}
                    className="rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-800"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(book)}
                    className="rounded-full bg-rose-100 px-4 py-2 text-sm font-semibold text-rose-700"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}

          {!loading && !books.length && (
            <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              Aún no hay libros en esta sede. Crea el primero completando el formulario.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
