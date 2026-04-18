'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

import { cn } from '@/lib/utils';
import { BookMutationPayload, LibraryTenant, TenantBook } from '@/types/tenant';

interface BookManagementClientProps {
  libraries: LibraryTenant[];
}

const emptyForm = (libraryId: string): BookMutationPayload => ({
  library_id: libraryId,
  title: '',
  author: '',
  categories: [],
  total_copies: 1,
  available_copies: 1,
  book_code: '',
  editorial: '',
  edition: '',
  cover_type: 'softcover',
  shelf_location: '',
  cost: 0,
  acquired_at: new Date().toISOString().split('T')[0],
  image_url: '',
});

export default function BookManagementClient({ libraries }: BookManagementClientProps) {
  const [selectedLibraryId, setSelectedLibraryId] = useState(libraries[0]?.id || '');
  const [books, setBooks] = useState<TenantBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [form, setForm] = useState<BookMutationPayload>(emptyForm(libraries[0]?.id || ''));
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryInput, setCategoryInput] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

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
        setError(payload.error || 'No se pudieron cargar los libros.');
        setLoading(false);
        return;
      }

      setBooks(payload.books || []);
      setLoading(false);
    }

    loadBooks().catch(() => {
      setError('No se pudieron cargar los libros.');
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
        book.categories.some(c => c.toLowerCase().includes(needle)) ||
        book.book_code?.toLowerCase().includes(needle)
      );
    });
  }, [books, searchQuery]);

  function resetForm(libraryId = selectedLibraryId) {
    setEditingBookId(null);
    setForm(emptyForm(libraryId));
    setCategoryInput('');
  }

  function startEdit(book: TenantBook) {
    setEditingBookId(book.id);
    setForm({
      library_id: book.library_id,
      title: book.title,
      author: book.author,
      categories: book.categories,
      total_copies: book.total_copies,
      available_copies: book.available_copies,
      book_code: book.book_code || '',
      editorial: book.editorial || '',
      edition: book.edition || '',
      cover_type: book.cover_type || 'softcover',
      shelf_location: book.shelf_location || '',
      cost: book.cost || 0,
      acquired_at: book.acquired_at || new Date().toISOString().split('T')[0],
      image_url: book.image_url || '',
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
      setError(payload.error || 'No se pudo guardar el libro.');
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
    const confirmed = window.confirm(`¿Eliminar "${book.title}" de ${selectedLibrary?.name || 'esta biblioteca'}?`);
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
      setError(payload.error || 'No se pudo eliminar el libro.');
      return;
    }

    setBooks((current) => current.filter((item) => item.id !== book.id));
    if (editingBookId === book.id) {
      resetForm(book.library_id);
    }
  }

  function addCategory() {
    if (!categoryInput.trim()) return;
    const cat = categoryInput.trim().toLowerCase();
    if (!form.categories.includes(cat)) {
      setForm(prev => ({ ...prev, categories: [...prev.categories, cat] }));
    }
    setCategoryInput('');
  }

  function removeCategory(cat: string) {
    setForm(prev => ({ ...prev, categories: prev.categories.filter(c => c !== cat) }));
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
            <div className="grid gap-4 md:grid-cols-2">
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
                <span className="mb-2 block text-sm font-medium text-slate-500">Códigos de Biblioteca (Auto)</span>
                <div className="w-full rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3 text-sm font-mono text-slate-400">
                  {editingBookId 
                    ? books.find(b => b.id === editingBookId)?.library_codes.join(', ')
                    : `${(selectedLibrary?.subdomain || 'lib').toLowerCase()}####`}
                </div>
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Título</span>
              <input
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition"
                placeholder="Ej. El Quijote"
                required
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Autor</span>
                <input
                  value={form.author}
                  onChange={(event) => setForm((current) => ({ ...current, author: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition"
                  placeholder="Ej. Miguel de Cervantes"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Código del Libro (ISBN/Interno)</span>
                <input
                  value={form.book_code}
                  onChange={(event) => setForm((current) => ({ ...current, book_code: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition"
                  placeholder="Ej. 978-3-16-148410-0"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Editorial</span>
                <input
                  value={form.editorial}
                  onChange={(event) => setForm((current) => ({ ...current, editorial: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition"
                  placeholder="Ej. Alfaguara"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Edición</span>
                <input
                  value={form.edition}
                  onChange={(event) => setForm((current) => ({ ...current, edition: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition"
                  placeholder="Ej. Primera Edición"
                />
              </label>
            </div>

            <div className="space-y-2">
              <span className="block text-sm font-medium text-slate-700">Categorías</span>
              <div className="flex flex-wrap gap-2 mb-3">
                {form.categories.map(cat => (
                  <span key={cat} className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                    {cat}
                    <button type="button" onClick={() => removeCategory(cat)} className="hover:text-rose-400">×</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={categoryInput}
                  onChange={(e) => setCategoryInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCategory(); } }}
                  placeholder="Añadir categoría..."
                  className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:outline-none"
                />
                <button
                  type="button"
                  onClick={addCategory}
                  className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 transition"
                >
                  Añadir
                </button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <span className="block text-sm font-medium text-slate-700">Tipo de Cubierta</span>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="cover_type"
                      checked={form.cover_type === 'hardcover'}
                      onChange={() => setForm(prev => ({ ...prev, cover_type: 'hardcover' }))}
                      className="accent-slate-900"
                    />
                    <span className="text-sm">Pasta Dura</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="cover_type"
                      checked={form.cover_type === 'softcover'}
                      onChange={() => setForm(prev => ({ ...prev, cover_type: 'softcover' }))}
                      className="accent-slate-900"
                    />
                    <span className="text-sm">Pasta Blanda</span>
                  </label>
                </div>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Estante</span>
                <input
                  value={form.shelf_location}
                  onChange={(event) => setForm((current) => ({ ...current, shelf_location: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition"
                  placeholder="Ej. B-23"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Costo ($)</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.cost}
                  onChange={(event) => setForm((current) => ({ ...current, cost: Number(event.target.value || 0) }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:outline-none transition"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Total</span>
                <input
                  type="number"
                  min={1}
                  value={form.total_copies}
                  onChange={(event) => {
                    const val = Number(event.target.value || 1);
                    setForm((current) => ({
                      ...current,
                      total_copies: val,
                      // If creating new, auto-match availability
                      available_copies: editingBookId ? current.available_copies : val
                    }));
                  }}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:outline-none transition"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Disponibles</span>
                <input
                  type="number"
                  min={0}
                  max={form.total_copies}
                  value={form.available_copies}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      available_copies: Number(event.target.value || 0),
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:outline-none transition"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Adquisición</span>
                <input
                  type="date"
                  value={form.acquired_at}
                  onChange={(event) => setForm((current) => ({ ...current, acquired_at: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:outline-none transition"
                />
              </label>
            </div>


            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">URL de Imagen</span>
              <input
                value={form.image_url}
                onChange={(event) => setForm((current) => ({ ...current, image_url: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:outline-none transition"
                placeholder="https://ejemplo.com/portada.jpg"
              />
            </label>

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
              placeholder="Buscar por título, autor, categoría o código..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition"
            />
          </div>

          {loading && <p className="mt-10 text-center text-sm text-slate-400 font-medium">Sincronizando inventario...</p>}

          <div className="mt-6 space-y-3 overflow-y-auto pr-2 max-h-[1000px]">
            {filteredBooks.map((book) => (
              <div key={book.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 hover:bg-white hover:border-slate-200 transition">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                       <p className="text-lg font-bold text-slate-900 truncate">{book.title}</p>
                       <button 
                        type="button" 
                        onClick={() => setPreviewImage(book.image_url || 'https://via.placeholder.com/400x600?text=Sin+Imagen')}
                        className="text-slate-400 hover:text-slate-900 transition"
                      >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                           <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                           <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                         </svg>
                       </button>
                    </div>
                    <p className="text-sm text-slate-500 font-medium">
                      {book.author} · {book.categories.join(', ')}
                    </p>
                    <div className="mt-2 text-[10px] font-mono text-slate-400">
                       ID: {book.library_codes.join(', ')}
                    </div>
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

      {previewImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-6 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="relative max-w-sm w-full bg-white rounded-[2.5rem] p-4 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <button 
                onClick={() => setPreviewImage(null)}
                className="absolute top-6 right-6 z-10 rounded-full bg-white/80 p-2 text-slate-900 shadow-md hover:bg-white transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="aspect-[2/3] w-full overflow-hidden rounded-[2rem] bg-slate-100 relative">
                <Image 
                  src={previewImage} 
                  alt="Vista previa" 
                  fill
                  className="object-cover"
                  unoptimized
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x600?text=Imagen+No+Disponible';
                  }}
                />
              </div>

           </div>
        </div>
      )}
    </div>
  );
}


