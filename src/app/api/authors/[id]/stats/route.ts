import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

// GET – Estadísticas completas del autor
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  try {
    // Verifica que el autor exista
    const author = await prisma.author.findUnique({
      where: { id },
      select: { id: true, name: true },
    })

    if (!author) {
      return NextResponse.json(
        { error: 'Autor no encontrado' },
        { status: 404 }
      )
    }

    // Total de libros
    const totalBooks = await prisma.book.count({ where: { authorId: id } })

    // Primer y último libro por año publicado (ignorar nulls)
    const [firstBookRec, latestBookRec] = await Promise.all([
      prisma.book.findFirst({
        where: { authorId: id, publishedYear: { not: null } },
        orderBy: { publishedYear: 'asc' },
        select: { title: true, publishedYear: true },
      }),
      prisma.book.findFirst({
        where: { authorId: id, publishedYear: { not: null } },
        orderBy: { publishedYear: 'desc' },
        select: { title: true, publishedYear: true },
      }),
    ])

    // Promedio de páginas
    const pagesAgg = await prisma.book.aggregate({
      where: { authorId: id, pages: { not: null } },
      _avg: { pages: true },
    })
    const averagePages = pagesAgg._avg.pages
      ? Math.round(pagesAgg._avg.pages)
      : 0

    // Géneros únicos
    const genresRows = await prisma.book.findMany({
      where: { authorId: id, genre: { not: null } },
      select: { genre: true },
      distinct: ['genre'],
    })
    const genres = genresRows
      .map((g) => g.genre)
      .filter(Boolean) as string[]

    // Libro con más y menos páginas
    const [longest, shortest] = await Promise.all([
      prisma.book.findFirst({
        where: { authorId: id, pages: { not: null } },
        orderBy: { pages: 'desc' },
        select: { title: true, pages: true },
      }),
      prisma.book.findFirst({
        where: { authorId: id, pages: { not: null } },
        orderBy: { pages: 'asc' },
        select: { title: true, pages: true },
      }),
    ])

    return NextResponse.json({
      authorId: author.id,
      authorName: author.name,
      totalBooks,
      firstBook: firstBookRec
        ? { title: firstBookRec.title, year: firstBookRec.publishedYear }
        : null,
      latestBook: latestBookRec
        ? { title: latestBookRec.title, year: latestBookRec.publishedYear }
        : null,
      averagePages,
      genres,
      longestBook: longest ? { title: longest.title, pages: longest.pages } : null,
      shortestBook: shortest
        ? { title: shortest.title, pages: shortest.pages }
        : null,
    })
  } catch {
    return NextResponse.json(
      { error: 'Error al obtener estadísticas del autor' },
      { status: 500 }
    )
  }
}
