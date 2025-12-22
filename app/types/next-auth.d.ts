import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    refreshToken?: string;
    idToken?: string;
    provider?: string;
    providerAccountId?: string;
    oauthAccounts?: Array<{
      oauthAccountId: string;
      userId: string;
      provider: string;
      providerAccountId: string;
      accessToken: string | null;
      refreshToken: string | null;
      expiresAt: string | null;
      tokenType: string | null;
      scope: string | null;
      idToken: string | null;
      sessionState: string | null;
      oauthData: {
        [key: string]: unknown;
      } | null;
      createdAt: string;
      updatedAt: string;
    }>;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    idToken?: string;
    expiresAt?: number;
    provider?: string;
    providerAccountId?: string;
  }
}
