import { RouteHelper, validAuthedOrUnauthedRegex, validUnauthedRegex } from '@/utils/routeHelper';
import dayjs from 'dayjs';
import { RequestCookies, ResponseCookies } from 'next/dist/compiled/@edge-runtime/cookies';
import { NextRequest, NextResponse } from 'next/server';

// This function can be marked `async` if using `await` inside
const validUnauthorizedPaths = Object.values(RouteHelper.UnAuthed);
// const hideOnAuthed = Object.values(RouteHelper.HideOnAuthed);

export async function middleware(request: NextRequest) {
  console.log('middleware');
  return NextResponse.next();
  // const path = request.nextUrl.pathname as any;
  // const search = request.nextUrl.search;
  // if (search.startsWith('?force=')) {
  //   const r = NextResponse.redirect(new URL(RouteHelper.All.Login, request.url));
  //   r.cookies.delete(SESSION_COOKIE);
  //   return r;
  // }

  // // Get attempted destination
  // const attemptedPath =
  //   [...validUnauthorizedPaths, '/'].includes(path) ||
  //   [...validUnauthedRegex, ...validAuthedOrUnauthedRegex].some((r) => r.test(path))
  //     ? undefined
  //     : path + search;
  // const loginUrl = new URL(RouteHelper.All.Login, request.url);

  // if (search.includes('redirect=partners')) {
  //   loginUrl.searchParams.set('redirect', 'partners');
  // } else if (attemptedPath) loginUrl.searchParams.set('redirect', attemptedPath);

  // const normal = NextResponse.next();

  // // once redirected to login, we set the attempted path in a cookie in the normal response flow
  // if (path === RouteHelper.All.Login && search) {
  //   const decode = decodeURIComponent(search);
  //   const removeRedirectStr = (decode.match(/[?&]redirect=([^&]*)/) ?? [])[1];
  //   normal.cookies.set('attemptedPath', removeRedirectStr, {
  //     expires: dayjs().add(15, 'minute').toDate().getTime(),
  //     sameSite: 'lax',
  //     path: '/',

  //     // domain: process.env.NODE_ENV === 'development' ? undefined : 'secure.tryjobsite.com',
  //   });
  // } else {
  //   normal.cookies.set('attemptedPath', '', {
  //     expires: dayjs().subtract(10, 'year').toDate(),
  //     sameSite: 'lax',
  //     path: '/',
  //   });
  // }

  // const jwt = request.cookies.get(SESSION_COOKIE)?.value;

  // const allowPass =
  //   path.includes('partnerImgs') ||
  //   validUnauthorizedPaths.includes(path) ||
  //   [...validUnauthedRegex, ...validAuthedOrUnauthedRegex].some((r) => r.test(path));
  // if (!jwt) {
  //   const redirectToLogin = NextResponse.redirect(loginUrl);
  //   redirectToLogin.cookies.delete(SESSION_COOKIE);
  //   normal.cookies.delete(SESSION_COOKIE);
  //   // applySetCookie(request, normal);
  //   // applySetCookie(request, redirectToLogin);
  //   return path === RouteHelper.All.Login || allowPass ? normal : redirectToLogin;
  // }

  // if (jwt) {
  //   const tokenInfo = JSON.parse(Buffer.from(jwt.split('.')[1], 'base64').toString()) as {
  //     email: string;
  //     clientId: string;
  //     iat: number;
  //     exp: number;
  //   };
  //   // if jwt expired && path is not already login, we redirect to login
  //   if (!tokenInfo.exp || tokenInfo.exp * 1000 < Date.now()) {
  //     const redirectToLogin = NextResponse.redirect(loginUrl);
  //     redirectToLogin.cookies.delete(SESSION_COOKIE);
  //     normal.cookies.delete(SESSION_COOKIE);
  //     // applySetCookie(request, normal);
  //     // applySetCookie(request, redirectToLogin);
  //     return path !== RouteHelper.All.Login ? redirectToLogin : normal;
  //   }
  // }
  // // user is authed, redirect to home if path is login or hideOnAuthed or '/'
  // const lastOnBizId = request.cookies.get('lastOnBizId')?.value;

  // const next =
  //   path === '/' || hideOnAuthed.includes(path)
  //     ? NextResponse.redirect(
  //         new URL(
  //           lastOnBizId ? RouteHelper.All.BusinessDashboard({ bizId: lastOnBizId }) : RouteHelper.All.Home,
  //           request.url
  //         )
  //       )
  //     : NextResponse.next();
  // const isBusiness = request.cookies.get('isBusiness')?.value === 'true';

  // if (path === '/') {
  //   if (isBusiness) {
  //     return NextResponse.redirect(
  //       new URL(
  //         lastOnBizId
  //           ? RouteHelper.Authed.BusinessDashboard({ bizId: lastOnBizId })
  //           : RouteHelper.Authed.Business,
  //         request.url
  //       )
  //     );
  //   } else {
  //     return NextResponse.redirect(new URL(RouteHelper.Authed.Home, request.url));
  //   }
  // }

  // if (path.startsWith('/business')) {
  //   next.cookies.set('isBusiness', 'true');
  // } else {
  //   next.cookies.delete('isBusiness');
  // }

  // return next;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

/**
 * Copy cookies from the Set-Cookie header of the response to the Cookie header of the request,
 * so that it will appear to SSR/RSC as if the user already has the new cookies.
 * https://github.com/vercel/next.js/issues/49442
 */
function applySetCookie(req: NextRequest, res: NextResponse) {
  // 1. Parse Set-Cookie header from the response
  const setCookies = new ResponseCookies(res.headers);

  // 2. Construct updated Cookie header for the request
  const newReqHeaders = new Headers(req.headers);
  const newReqCookies = new RequestCookies(newReqHeaders);
  setCookies.getAll().forEach((cookie) => newReqCookies.set(cookie));

  // 3. Set up the “request header overrides” (see https://github.com/vercel/next.js/pull/41380)
  //    on a dummy response
  // NextResponse.next will set x-middleware-override-headers / x-middleware-request-* headers
  const dummyRes = NextResponse.next({ request: { headers: newReqHeaders } });

  // 4. Copy the “request header overrides” headers from our dummy response to the real response
  dummyRes.headers.forEach((value, key) => {
    if (key === 'x-middleware-override-headers' || key.startsWith('x-middleware-request-')) {
      res.headers.set(key, value);
    }
  });
}
