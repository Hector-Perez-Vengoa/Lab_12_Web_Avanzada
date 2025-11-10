import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

// GET – Obtener un autor específico por ID
export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const author = await prisma.author.findUnique({
      where: { id: id },
      include: {
        books: {
          orderBy: {
            publishedYear: 'desc',
          },
        },
        _count: {
          select: { books: true },
        },
      },
    })

    if (!author) {
      return NextResponse.json(
        { error: 'Autor no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(author)
  } catch {
    return NextResponse.json(
      { error: 'Error al obtener autor' },
      { status: 500 }
    )
  }
}

// PUT – Actualizar un autor
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  try {
    const body = await request.json()
    const { name, email, bio, nationality, birthYear } = body

    // Validación
    if (email) {
      const emailRegex = /^[^\s]+@[^\s]+\.[^\s]+$/
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'Email inválido' },
          { status: 400 }
        )
      }
    }

    const author = await prisma.author.update({
      where: { id },
      data: {
        name,
        email,
        bio,
        nationality,
  birthYear: birthYear ? Number.parseInt(birthYear) : null,
      },
      include: {
        books: true,
      },
    })

    return NextResponse.json(author)
  } catch (error) {
    const code = (error as { code?: string }).code
    if (code === 'P2025') {
      return NextResponse.json(
        { error: 'Autor no encontrado' },
        { status: 404 }
      )
    }
    if (code === 'P2002') {
      return NextResponse.json(
        { error: 'El email ya está registrado' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: 'Error al actualizar autor' },
      { status: 500 }
    )
  }
}
// DELETE – Eliminar un autor
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  try {
    await prisma.author.delete({
      where: { id },
    })

    return NextResponse.json({
      message: 'Autor eliminado correctamente'
    })
  } catch (error) {
    const code = (error as { code?: string }).code
    if (code === 'P2025') {
      return NextResponse.json(
        { error: 'Autor no encontrado' },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Error al eliminar autor' },
      { status: 500 }
    )
  }
}
