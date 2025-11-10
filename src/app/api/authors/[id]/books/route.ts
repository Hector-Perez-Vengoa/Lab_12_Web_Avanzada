import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

// GET – Obtener todos los libros de un autor específico
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  try {
    // Verifica que el autor existe
    const author = await prisma.author.findUnique({
      where: { id }
    })

    if (!author) {
      return NextResponse.json(
        { error: 'Autor no encontrado' },
        { status: 404 }
      )
    }

    // Obtener los libros del autor
    const books = await prisma.book.findMany({
      where: { authorId: id },
      orderBy: { publishedYear: 'desc' },
    })

    return NextResponse.json({
      author: {
        id: author.id,
        name: author.name,
      },
      totalBooks: books.length,
      books
    })
  } catch {
    return NextResponse.json(
      { error: 'Error al obtener libros del autor' },
      { status: 500 }
    )
  }
}