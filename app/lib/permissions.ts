import { Role } from "../generated/prisma/client"
import { createAccessControl } from "better-auth/plugins/access"
import { defaultStatements, adminAc } from "better-auth/plugins/admin/access"

const statements = {
  ...defaultStatements,
  flows: ["create", "read", "update", "delete", "update:own", "delete:own"],
} as const

export const ac = createAccessControl(statements)

export const roles = {
  [Role.USER]: ac.newRole({
    flows: ["create", "read", "update:own", "delete:own"],
  }),
  [Role.ADMIN]: ac.newRole({
    ...adminAc.statements,
    flows: ["create", "read", "update", "delete"],
  }),
}
