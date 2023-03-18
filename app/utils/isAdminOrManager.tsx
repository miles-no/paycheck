import { Role } from "../../prisma/seed";

export const isAdminOrManager = (roleName: Role) =>
  [Role.admin, Role.manager].includes(roleName);
