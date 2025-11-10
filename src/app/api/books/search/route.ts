import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

// GET – Búsqueda avanzada de libros con paginación, filtros y ordenamiento
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const search = searchParams.get('search')?.trim() || ''
    const genre = searchParams.get('genre')?.trim() || undefined
    const authorName = searchParams.get('authorName')?.trim() || ''

  const pageParam = Number.parseInt(searchParams.get('page') || '1', 10)
  const limitParam = Number.parseInt(searchParams.get('limit') || '10', 10)
    const sortByParam = (searchParams.get('sortBy') || 'createdAt') as
      | 'title'
      | 'publishedYear'
      | 'createdAt'
    const orderParam = (searchParams.get('order') || 'desc') as 'asc' | 'desc'

    const page = Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam
    const limitRaw = Number.isNaN(limitParam) || limitParam < 1 ? 10 : limitParam
    const limit = Math.min(limitRaw, 50) // máximo 50
    const skip = (page - 1) * limit

    // Validar sortBy
    const sortableFields = new Set(['title', 'publishedYear', 'createdAt'])
    const sortBy = sortableFields.has(sortByParam) ? sortByParam : 'createdAt'
    const order = orderParam === 'asc' ? 'asc' : 'desc'

    // Construir condición WHERE
    // Tipado parcial para filtros dinámicos
    const where: {
      genre?: string
      title?: { contains: string; mode: 'insensitive' }
      author?: { name: { contains: string; mode: 'insensitive' } }
    } = {
      ...(genre && { genre }),
      ...(search && {
        title: { contains: search, mode: 'insensitive' as const },
      }),
      ...(authorName && {
        author: {
          name: { contains: authorName, mode: 'insensitive' as const },
        },
      }),
    }

    // total para paginación
    const total = await prisma.book.count({ where })

    // resultados paginados
    const data = await prisma.book.findMany({
      where,
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { [sortBy]: order },
      skip,
      take: limit,
    })

    const totalPages = Math.max(1, Math.ceil(total / limit))
    const hasNext = page < totalPages
    const hasPrev = page > 1

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
      },
    })
  } catch {
    return NextResponse.json(
      { error: 'Error al buscar libros' },
      { status: 500 }
    )
  }
}
