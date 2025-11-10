"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Author {
  id: string;
  name: string;
  email: string;
  bio?: string | null;
  nationality?: string | null;
  birthYear?: number | null;
  books: Book[];
}
interface Book {
  id: string;
  title: string;
  publishedYear?: number | null;
  pages?: number | null;
  genre?: string | null;
}
interface StatsResponse {
  authorId: string;
  authorName: string;
  totalBooks: number;
  firstBook: { title: string; year: number } | null;
  latestBook: { title: string; year: number } | null;
  averagePages: number;
  genres: string[];
  longestBook: { title: string; pages: number } | null;
  shortestBook: { title: string; pages: number } | null;
}

export default function AuthorDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [author, setAuthor] = useState<Author | null>(null);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    bio: "",
    nationality: "",
    birthYear: "",
  });
  const [saving, setSaving] = useState(false);
  const [addingBook, setAddingBook] = useState(false);
  const [newBook, setNewBook] = useState({
    title: "",
    publishedYear: "",
    genre: "",
    pages: "",
  });

  async function loadData() {
    try {
      setLoading(true);
      const [aRes, sRes] = await Promise.all([
        fetch(`/api/authors/${id}`),
        fetch(`/api/authors/${id}/stats`),
      ]);
      if (!aRes.ok) throw new Error("Error cargando autor");
      if (!sRes.ok) throw new Error("Error cargando estadísticas");
      const aJson = await aRes.json();
      const sJson = await sRes.json();
      setAuthor(aJson);
      setStats(sJson);
      setEditForm({
        name: aJson.name ?? "",
        email: aJson.email ?? "",
        bio: aJson.bio ?? "",
        nationality: aJson.nationality ?? "",
        birthYear: aJson.birthYear ? String(aJson.birthYear) : "",
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function saveAuthor(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/authors/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editForm,
          birthYear: editForm.birthYear ? Number(editForm.birthYear) : null,
        }),
      });
      if (!res.ok) throw new Error("Error guardando autor");
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setSaving(false);
    }
  }

  async function createBook(e: React.FormEvent) {
    e.preventDefault();
    if (!newBook.title) return;
    setAddingBook(true);
    try {
      const res = await fetch(`/api/books`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newBook.title,
          genre: newBook.genre || null,
          publishedYear: newBook.publishedYear ? Number(newBook.publishedYear) : null,
          pages: newBook.pages ? Number(newBook.pages) : null,
          description: "",
          authorId: id,
        }),
      });
      if (!res.ok) throw new Error("Error creando libro");
      setNewBook({ title: "", publishedYear: "", genre: "", pages: "" });
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setAddingBook(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-6">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Detalle Autor</h1>
          <Link href="/" className="text-sm rounded bg-zinc-800 px-4 py-2 text-white hover:bg-zinc-700">Volver</Link>
        </header>
        {loading && <p className="text-sm">Cargando...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {author && (
          <>
            <section className="rounded border bg-white p-4 shadow-sm dark:bg-zinc-900">
              <h2 className="mb-2 font-semibold">Información</h2>
              <form onSubmit={saveAuthor} className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <input className="rounded border px-3 py-2 text-sm bg-white dark:bg-zinc-800" placeholder="Nombre" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                <input className="rounded border px-3 py-2 text-sm bg-white dark:bg-zinc-800" type="email" placeholder="Email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                <input className="rounded border px-3 py-2 text-sm bg-white dark:bg-zinc-800" placeholder="Nacionalidad" value={editForm.nationality} onChange={(e) => setEditForm({ ...editForm, nationality: e.target.value })} />
                <input className="rounded border px-3 py-2 text-sm bg-white dark:bg-zinc-800" placeholder="Año nacimiento" value={editForm.birthYear} onChange={(e) => setEditForm({ ...editForm, birthYear: e.target.value })} />
                <textarea className="rounded border px-3 py-2 text-sm bg-white dark:bg-zinc-800 md:col-span-2" placeholder="Bio" value={editForm.bio} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} />
                <div>
                  <button disabled={saving} className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{saving ? "Guardando..." : "Guardar"}</button>
                </div>
              </form>
            </section>

            <section className="rounded border bg-white p-4 shadow-sm dark:bg-zinc-900">
              <h2 className="mb-2 font-semibold">Estadísticas</h2>
              {stats ? (
                <ul className="text-sm space-y-1">
                  <li><strong>Total libros:</strong> {stats.totalBooks}</li>
                  <li><strong>Primer libro:</strong> {stats.firstBook ? `${stats.firstBook.title} (${stats.firstBook.year})` : '-'}</li>
                  <li><strong>Último libro:</strong> {stats.latestBook ? `${stats.latestBook.title} (${stats.latestBook.year})` : '-'}</li>
                  <li><strong>Promedio páginas:</strong> {stats.averagePages}</li>
                  <li><strong>Géneros:</strong> {stats.genres.length ? stats.genres.join(', ') : '-'}</li>
                  <li><strong>Más páginas:</strong> {stats.longestBook ? `${stats.longestBook.title} (${stats.longestBook.pages})` : '-'}</li>
                  <li><strong>Menos páginas:</strong> {stats.shortestBook ? `${stats.shortestBook.title} (${stats.shortestBook.pages})` : '-'}</li>
                </ul>
              ) : <p className="text-sm">Cargando estadísticas...</p>}
            </section>

            <section className="rounded border bg-white p-4 shadow-sm dark:bg-zinc-900">
              <h2 className="mb-3 font-semibold">Agregar Libro</h2>
              <form onSubmit={createBook} className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <input className="rounded border px-3 py-2 text-sm bg-white dark:bg-zinc-800" placeholder="Título" value={newBook.title} onChange={(e) => setNewBook({ ...newBook, title: e.target.value })} />
                <input className="rounded border px-3 py-2 text-sm bg-white dark:bg-zinc-800" placeholder="Año publicación" value={newBook.publishedYear} onChange={(e) => setNewBook({ ...newBook, publishedYear: e.target.value })} />
                <input className="rounded border px-3 py-2 text-sm bg-white dark:bg-zinc-800" placeholder="Género" value={newBook.genre} onChange={(e) => setNewBook({ ...newBook, genre: e.target.value })} />
                <input className="rounded border px-3 py-2 text-sm bg-white dark:bg-zinc-800" placeholder="Páginas" value={newBook.pages} onChange={(e) => setNewBook({ ...newBook, pages: e.target.value })} />
                <div>
                  <button disabled={addingBook} className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{addingBook ? "Agregando..." : "Agregar"}</button>
                </div>
              </form>
            </section>

            <section className="rounded border bg-white p-4 shadow-sm dark:bg-zinc-900">
              <h2 className="mb-3 font-semibold">Libros</h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {author.books.map((b) => (
                  <div key={b.id} className="rounded border p-3 text-sm">
                    <h3 className="font-medium">{b.title}</h3>
                    <div className="mt-1 grid grid-cols-2 gap-1 text-xs text-zinc-600">
                      <span><strong>Año:</strong> {b.publishedYear ?? '-'}</span>
                      <span><strong>Páginas:</strong> {b.pages ?? '-'}</span>
                      <span className="col-span-2"><strong>Género:</strong> {b.genre ?? '-'}</span>
                    </div>
                  </div>
                ))}
                {author.books.length === 0 && <p className="text-sm">Sin libros aún</p>}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
