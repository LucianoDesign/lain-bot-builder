import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields, adminClient } from "better-auth/client/plugins";
import type { auth } from "@/app/lib/auth";
import { roles, ac } from "./permissions";

const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
  plugins: [inferAdditionalFields<typeof auth>(), adminClient({ roles, ac })],
});

export const { signIn, signUp, signOut, useSession, admin } = authClient;
