import { isAdminOrManager } from "~/utils/isAdminOrManager";
import { Role } from "~/enums/role";

describe("isAdminOrManager", () => {
  it("returns true if user is admin", () => {
    expect(isAdminOrManager(Role.admin)).toBe(true);
  });

  it("returns true if user is manager", () => {
    expect(isAdminOrManager(Role.manager)).toBe(true);
  });

  it("returns false if user is neither admin nor manager", () => {
    expect(isAdminOrManager(Role.employee)).toBe(false);
  });
});