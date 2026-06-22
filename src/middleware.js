import { NextResponse } from 'next/server'

export function middleware(request) {
  const { pathname } = request.nextUrl

  // Rewrite /@username -> /u/username
  // Rewrite /@username/slug -> /u/username/slug
  if (pathname.startsWith('/@')) {
    const withoutAt = '/u/' + pathname.slice(2) // /@username -> /u/username
    return NextResponse.rewrite(new URL(withoutAt, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/@:path*'],
}
