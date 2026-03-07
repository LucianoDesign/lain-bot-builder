import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Role } from "@/app/generated/prisma/client";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { roles, ac } from "./permissions";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to initialize Prisma");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString,
  }),
});

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
  },
  user: {
    additionalFields: {
      role: {
        type: ["ADMIN", "USER"],
        input: false,
      },
    },
  },
  plugins: [
    nextCookies(),
    admin({ defaultRole: Role.USER, adminRoles: [Role.ADMIN], ac, roles }), // Authorization Plugin
  ],
});
