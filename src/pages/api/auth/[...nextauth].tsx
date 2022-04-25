import { query as q } from 'faunadb';

import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";

import { fauna } from '../../../services/fauna';

export default NextAuth({
  providers: [
    GithubProvider({
      clientId: process.env.NEXTAUTH_URL_GITHUB_ID,
      clientSecret: process.env.NEXTAUTH_URL_GITHUB_SECRET,
      version: "2.0",
      authorization: {
        params: {
          scope: "read:user",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      const { email } = user;

      try {
        await fauna.query(
          q.If(
            q.Not(
              q.Exists(
                q.Match(
                  q.Index('user_by_email'),
                  q.Casefold(user.email)
                )
              )
            ),
            q.Create(
              q.Collection('users'),
              { data: { email } }
            ),
            q.Get(
              q.Match(
                q.Index('user_by_email'),
                q.Casefold(user.email)
              )
            )
          )
        )

          return true
        } catch {
          return false;
        }
      },
    }
})
