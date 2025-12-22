import GoogleProvider from 'next-auth/providers/google';
import { NextAuthOptions } from 'next-auth';
import { cookies } from 'next/headers';

export const SESSION_COOKIE = 'jobsite-session';

const API_BASE_URL = process.env.NEXT_PUBLIC_API;

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user, account, profile }) {
      // Sync OAuth data to backend when user signs in
      if (account && API_BASE_URL) {
        try {
          const oauthData = {
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            accessToken: account.access_token,
            refreshToken: account.refresh_token,
            expiresAt: account.expires_at ? new Date(account.expires_at * 1000).toISOString() : null,
            tokenType: account.token_type,
            scope: account.scope,
            idToken: account.id_token,
            sessionState: account.session_state,
            oauthData: {
              ...(profile && { profile }),
              ...(user && {
                name: user.name,
                email: user.email,
                image: user.image,
              }),
            },
          };

          // Get the jobsite-session cookie for authorization
          const sessionCookie = (await cookies()).get(SESSION_COOKIE)?.value;
          const headers: HeadersInit = {
            'Content-Type': 'application/json',
          };
          if (sessionCookie) {
            headers['Authorization'] = `Bearer ${sessionCookie}`;
          }

          const response = await fetch(`${API_BASE_URL}/oauth`, {
            method: 'POST',
            headers,
            credentials: 'include',
            body: JSON.stringify(oauthData),
          });

          if (!response.ok) {
            console.error('Failed to sync OAuth data to backend:', await response.text());
            // Don't block sign in if backend sync fails
          }
        } catch (error) {
          console.error('Error syncing OAuth data to backend:', error);
          // Don't block sign in if backend sync fails
        }
      }
      return true;
    },
    async jwt({ token, account, user }) {
      // Initial sign in - account is available
      if (account && user) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
        token.provider = account.provider;
        token.providerAccountId = account.providerAccountId;
      }
      return token;
    },
    async session({ session, token }) {
      // Fetch OAuth accounts from backend if needed
      if (API_BASE_URL && token.providerAccountId) {
        try {
          // Get the jobsite-session cookie for authorization
          const sessionCookie = (await cookies()).get(SESSION_COOKIE)?.value;
          if (!sessionCookie) {
            console.warn('No jobsite-session cookie found for OAuth fetch');
          }

          const headers: HeadersInit = {
            'Content-Type': 'application/json',
          };
          if (sessionCookie) {
            headers['Authorization'] = `Bearer ${sessionCookie}`;
          }

          const response = await fetch(`${API_BASE_URL}/oauth`, {
            method: 'GET',
            headers,
            credentials: 'include',
          });
          if (response.ok) {
            const data = await response.json();
            if (data?.responseObject?.oauthAccounts) {
              (session as any).oauthAccounts = data.responseObject.oauthAccounts;
            }
          }
        } catch (error) {
          console.error('Error fetching OAuth accounts from backend:', error);
        }
      }

      // Add token data to session
      if (token) {
        (session as any).accessToken = token.accessToken as string | undefined;
        (session as any).provider = token.provider as string | undefined;
        (session as any).providerAccountId = token.providerAccountId as string | undefined;
      }

      return session;
    },
  },
};
