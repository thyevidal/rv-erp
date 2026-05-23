import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Rotas públicas — não requerem autenticação
const PUBLIC_PATHS = ['/', '/login', '/register', '/upgrade', '/politica-de-privacidade']

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) return true
  if (pathname.startsWith('/portal/')) return true
  if (pathname.startsWith('/api/portal/')) return true
  return false
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh da sessão — obrigatório para o @supabase/ssr funcionar
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Rotas públicas: qualquer um pode acessar
  if (isPublicPath(pathname)) {
    // Se logado e tentar acessar /login → vai para dashboard
    if (user && pathname === '/login') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return supabaseResponse
  }

  // Rotas privadas (/dashboard/*, /admin/*, etc): redireciona para /login se não autenticado
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|apple-icon|icon|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
