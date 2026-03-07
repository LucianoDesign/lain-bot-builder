import { Role } from "../generated/prisma/client";
import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc } from "better-auth/plugins/admin/access";

const statements = {
  ...defaultStatements,
  posts: ["create", "read", "update", "delete", "update:own", "delete:own"],
};

export const ac = createAccessControl(statements);

export const roles = {
  [Role.USER]: ac.newRole({
    posts: ["create", "read", "update:own", "delete:own"],
  }),
  [Role.ADMIN]: ac.newRole({
    ...adminAc.statements,
    posts: ["create", "read", "update", "delete"],
  }),
};
