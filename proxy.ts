import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(request: NextRequest) {
  // 1. Criamos a resposta inicial
  let supabaseResponse = NextResponse.next({
    request,
  })

  // 2. Configuramos o cliente Supabase focado em SSR
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Atualizamos os cookies na requisição original
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))

          // Sincronizamos a resposta com os novos cookies
          supabaseResponse = NextResponse.next({ request })

          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 3. Verificamos a sessão do usuário de forma segura
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // 4. Definição de rotas
  // Adicionamos a raiz '/' como rota que requer atenção para evitar o loop
  const isLoginPage = pathname.startsWith('/login')
  const isRootPage = pathname === '/'

  // REGRA 1: Se NÃO estiver logado e tentar acessar algo privado (ou a raiz)
  if (!user && !isLoginPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // REGRA 2: Se JÁ estiver logado e tentar acessar o login ou a raiz
  if (user && (isLoginPage || isRootPage)) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

// O Matcher garante que o proxy não rode em arquivos estáticos (imagens, etc), economizando processamento
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}