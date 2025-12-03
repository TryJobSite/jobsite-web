export const RouteHelper = {
  UnAuthed: {
    // Root: '/',
    Login: '/login',
    Signup: '/signup',
    ForgotPassword: '/forgot-password',
    ResetPassword: '/reset-password',
  },
  Authed: {
    Dashboard: '/dashboard',
    Profile: '/profile',
  },
} as const;

export const validUnauthedRegex = [/^\/login/, /^\/signup/, /^\/forgot-password/, /^\/reset-password/];

export const validAuthedOrUnauthedRegex = [/^\/public/, /^\/about/];
