"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Order = "asc" | "desc";
type SortBy = "title" | "publishedYear" | "createdAt";

interface Author { id: string; name: string }
interface Book {
  id: string
  title: string
  description: string
  isbn?: string | null
  publishedYear?: number | null
  genre?: string | null
  pages?: number | null
  authorId: string
  createdAt: string
  author?: { id: string; name: string }
}

export default function BooksPage() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [genres, setGenres] = useState<string[]>([]);

  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState<string>("");
  const [authorName, setAuthorName] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortBy>("createdAt");
  const [order, setOrder] = useState<Order>("desc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Crear libro form
  const [form, setForm] = useState({
    title: "",
    description: "",
    isbn: "",
    publishedYear: "",
    genre: "",
    pages: "",
    authorId: "",
  });

  useEffect(() => {
    // Autores
    fetch("/api/authors")
      .then((r) => r.json())
      .then((data: { id: string; name: string }[]) => setAuthors(data.map((a) => ({ id: a.id, name: a.name }))))
      .catch(() => {});

    // Géneros disponibles a partir de los libros existentes
    fetch("/api/books")
      .then((r) => r.json())
      .then((data: Book[]) => {
        const set = new Set<string>();
        for (const b of data) {
          if (b.genre) set.add(b.genre);
        }
        setGenres(Array.from(set).sort((a, b) => a.localeCompare(b)));
      })
      .catch(() => {});
  }, []);

  // Construir querystring para búsqueda
  const query = useMemo(() => {
    const sp = new URLSearchParams();
    if (search) sp.set("search", search);
    if (genre) sp.set("genre", genre);
    if (authorName) sp.set("authorName", authorName);
    sp.set("page", String(page));
    sp.set("limit", String(limit));
    sp.set("sortBy", sortBy);
    sp.set("order", order);
    return sp.toString();
  }, [search, genre, authorName, page, limit, sortBy, order]);

  // Búsqueda con debounce
  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/books/search?${query}`, { signal: ctrl.signal });
        if (!res.ok) throw new Error("Error buscando libros");
        const json = await res.json();
        setBooks(json.data);
        setTotal(json.pagination.total);
        setTotalPages(json.pagination.totalPages);
      } catch (e) {
        if (!(e instanceof DOMException && e.name === "AbortError")) {
          setError(e instanceof Error ? e.message : "Error desconocido");
        }
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [query]);

  async function createBook(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.authorId) return;
    try {
      setCreating(true);
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          publishedYear: form.publishedYear ? Number(form.publishedYear) : null,
          pages: form.pages ? Number(form.pages) : null,
        }),
      });
      if (!res.ok) throw new Error("Error creando libro");
      setForm({ title: "", description: "", isbn: "", publishedYear: "", genre: "", pages: "", authorId: "" });
      // refrescar página 1
      setPage(1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setCreating(false);
    }
  }

  async function deleteBook(id: string) {
    if (!confirm("¿Eliminar libro?")) return;
    const res = await fetch(`/api/books/${id}`, { method: "DELETE" });
    if (res.ok) {
      // quitar del estado actual
      setBooks((prev) => prev.filter((b) => b.id !== id));
      setTotal((t) => Math.max(0, t - 1));
    }
  }

  async function editBook(id: string) {
    const title = prompt("Nuevo título:");
    if (!title) return;
    const res = await fetch(`/api/books/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (res.ok) {
      setBooks((prev) => prev.map((b) => (b.id === id ? { ...b, title } : b)));
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-6">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Libros</h1>
          <Link href="/" className="text-sm rounded bg-zinc-800 px-4 py-2 text-white hover:bg-zinc-700">Volver</Link>
        </header>

        {/* Crear libro */}
        <section className="rounded border bg-white p-4 shadow-sm dark:bg-zinc-900">
          <h2 className="mb-3 font-semibold">Crear Libro</h2>
          <form onSubmit={createBook} className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input className="rounded border px-3 py-2 text-sm bg-white dark:bg-zinc-800" placeholder="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <select className="rounded border px-3 py-2 text-sm bg-white dark:bg-zinc-800" value={form.authorId} onChange={(e) => setForm({ ...form, authorId: e.target.value })}>
              <option value="">Selecciona autor</option>
              {authors.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            <input className="rounded border px-3 py-2 text-sm bg-white dark:bg-zinc-800" placeholder="Descripción" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <input className="rounded border px-3 py-2 text-sm bg-white dark:bg-zinc-800" placeholder="ISBN" value={form.isbn} onChange={(e) => setForm({ ...form, isbn: e.target.value })} />
            <input className="rounded border px-3 py-2 text-sm bg-white dark:bg-zinc-800" placeholder="Año publicación" value={form.publishedYear} onChange={(e) => setForm({ ...form, publishedYear: e.target.value })} />
            <input className="rounded border px-3 py-2 text-sm bg-white dark:bg-zinc-800" placeholder="Género" value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })} />
            <input className="rounded border px-3 py-2 text-sm bg-white dark:bg-zinc-800" placeholder="Páginas" value={form.pages} onChange={(e) => setForm({ ...form, pages: e.target.value })} />
            <div>
              <button disabled={creating} className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{creating ? "Creando..." : "Crear"}</button>
            </div>
          </form>
        </section>

        {/* Buscador y filtros */}
        <section className="rounded border bg-white p-4 shadow-sm dark:bg-zinc-900">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <input className="rounded border px-3 py-2 text-sm bg-white dark:bg-zinc-800" placeholder="Buscar por título..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
            <select className="rounded border px-3 py-2 text-sm bg-white dark:bg-zinc-800" value={genre} onChange={(e) => { setGenre(e.target.value); setPage(1); }}>
              <option value="">Todos los géneros</option>
              {genres.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
            <input className="rounded border px-3 py-2 text-sm bg-white dark:bg-zinc-800" placeholder="Nombre de autor..." value={authorName} onChange={(e) => { setAuthorName(e.target.value); setPage(1); }} />
            <div className="flex items-center gap-3">
              <label className="text-sm" htmlFor="sortBy">Ordenar por</label>
              <select id="sortBy" className="rounded border px-3 py-2 text-sm bg-white dark:bg-zinc-800" value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)}>
                <option value="createdAt">Fecha creación</option>
                <option value="title">Título</option>
                <option value="publishedYear">Año publicación</option>
              </select>
              <select className="rounded border px-3 py-2 text-sm bg-white dark:bg-zinc-800" value={order} onChange={(e) => setOrder(e.target.value as Order)}>
                <option value="desc">Desc</option>
                <option value="asc">Asc</option>
              </select>
              <select className="rounded border px-3 py-2 text-sm bg-white dark:bg-zinc-800" value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}>
                {[10, 20, 30, 40, 50].map((n) => <option key={n} value={n}>{n} / pág</option>)}
              </select>
            </div>
          </div>
        </section>

        {/* Resultados */}
        <section className="rounded border bg-white p-4 shadow-sm dark:bg-zinc-900">
          <div className="mb-3 flex items-center justify-between text-sm">
            <div>
              {loading ? "Buscando..." : `Resultados: ${total}`}
            </div>
            <div className="flex items-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded border px-3 py-1 disabled:opacity-50">Prev</button>
              <span className="text-xs">Página {page} de {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded border px-3 py-1 disabled:opacity-50">Next</button>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {books.map((b) => (
              <div key={b.id} className="rounded border p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{b.title}</h3>
                    <p className="text-xs text-zinc-500">{b.author?.name}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => editBook(b.id)} className="rounded bg-amber-600 px-2 py-1 text-xs text-white">Editar</button>
                    <button onClick={() => deleteBook(b.id)} className="rounded bg-red-600 px-2 py-1 text-xs text-white">Eliminar</button>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-1 text-xs text-zinc-700">
                  <span><strong>Género:</strong> {b.genre ?? '-'}</span>
                  <span><strong>Año:</strong> {b.publishedYear ?? '-'}</span>
                  <span><strong>Páginas:</strong> {b.pages ?? '-'}</span>
                  <span><strong>Creado:</strong> {new Date(b.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
          {!loading && books.length === 0 && (
            <p className="text-sm">No hay resultados</p>
          )}
        </section>
      </div>
    </div>
  );
}
