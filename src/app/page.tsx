"use client";
import { useEffect, useState } from "react";

interface Author {
  id: string;
  name: string;
  email: string;
  _count?: { books: number };
  books?: { id: string }[];
}

export default function Home() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "" });
  const [creating, setCreating] = useState(false);
  const [stats, setStats] = useState<{ totalAuthors: number; totalBooks: number } | null>(null);

  async function fetchAuthors() {
    try {
      setLoading(true);
      const res = await fetch("/api/authors");
      if (!res.ok) throw new Error("Error cargando autores");
      const data = await res.json();
      setAuthors(data);
      setStats({
        totalAuthors: data.length,
        totalBooks: data.reduce((acc: number, a: Author) => acc + (a._count?.books || 0), 0),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAuthors();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email) return;
    try {
      setCreating(true);
      const res = await fetch("/api/authors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Error creando autor");
      setForm({ name: "", email: "" });
      await fetchAuthors();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar autor?")) return;
    try {
      const res = await fetch(`/api/authors/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error eliminando autor");
      await fetchAuthors();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-6">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboard Biblioteca</h1>
          <a href="/books" className="text-sm rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-500">Buscar Libros</a>
        </header>

        {/* Crear autor */}
        <section className="rounded border bg-white p-4 shadow-sm dark:bg-zinc-900">
          <h2 className="mb-3 font-semibold">Crear Autor</h2>
            <form onSubmit={handleCreate} className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <input
                placeholder="Nombre"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="rounded border px-3 py-2 text-sm flex-1 bg-white dark:bg-zinc-800"
              />
              <input
                placeholder="Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="rounded border px-3 py-2 text-sm flex-1 bg-white dark:bg-zinc-800"
              />
              <button
                disabled={creating}
                className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {creating ? "Creando..." : "Crear"}
              </button>
            </form>
        </section>

        {/* Estadísticas generales */}
        <section className="rounded border bg-white p-4 shadow-sm dark:bg-zinc-900">
          <h2 className="mb-2 font-semibold">Estadísticas Generales</h2>
          {stats ? (
            <ul className="text-sm space-y-1">
              <li><strong>Autores:</strong> {stats.totalAuthors}</li>
              <li><strong>Libros totales:</strong> {stats.totalBooks}</li>
            </ul>
          ) : <p className="text-sm">Cargando estadísticas...</p>}
        </section>

        {/* Listado de autores */}
        <section className="rounded border bg-white p-4 shadow-sm dark:bg-zinc-900">
          <h2 className="mb-3 font-semibold">Autores</h2>
          {loading && <p className="text-sm">Cargando...</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="divide-y text-sm">
            {authors.map((a) => (
              <div key={a.id} className="flex items-center justify-between py-2">
                <div className="flex flex-col">
                  <span className="font-medium">{a.name}</span>
                  <span className="text-xs text-zinc-500">{a.email}</span>
                  <span className="text-xs">Libros: {a._count?.books ?? 0}</span>
                </div>
                <div className="flex gap-2">
                  <a
                    href={`/authors/${a.id}`}
                    className="rounded bg-indigo-600 px-3 py-1 text-xs text-white hover:bg-indigo-500"
                  >Ver</a>
                  <button
                    onClick={() => handleDelete(a.id)}
                    className="rounded bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-500"
                  >Eliminar</button>
                </div>
              </div>
            ))}
            {!loading && authors.length === 0 && (
              <p className="py-2 text-sm">Sin autores aún</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
