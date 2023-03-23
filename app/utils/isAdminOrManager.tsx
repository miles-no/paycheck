import { Role } from "~/enums/role";

export const isAdminOrManager = (roleName: Role) =>
  [Role.admin, Role.manager].includes(roleName);
