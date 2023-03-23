import { redirect } from "@remix-run/node";
import type { GoogleProfile } from "remix-auth-google";
import { prisma } from "~/db.server";
import type { Role } from "~/enums/role";
import { getOptionalGoogleUser } from "~/routes/profile";
import { authenticator } from "~/services/auth.server";
import { isAdminOrManager } from "~/utils/isAdminOrManager";

/**
 * Redirects to /403 if the user is not an admin or manager
 * @param request
 */
export const requireAdminOrManager = async (request: Request) => {
  const user = await requireUser(request);
  if (!isAdminOrManager(user?.role.name as Role)) {
    throw redirect("/403");
  }
  return user;
};

export const optionalUser = async (request: Request) => {
  const googleUser = await getOptionalGoogleUser(request);
  if (!googleUser) return null;
  return await getDbUser(googleUser);
};

// Get the user from the database, or redirect to / if the user is not logged in
export const requireUser = async (request: Request) => {
  const googleUser = await requireGoogleUser(request);
  return await getDbUser(googleUser);
};

async function requireGoogleUser(request: Request) {
  return (await authenticator.isAuthenticated(request, {
    failureRedirect: "/",
  })) as GoogleProfile;
}

export async function getDbUserByXledgerId(xledgerId: string) {
  const employeeDetails = await prisma.employeeDetails.findUnique({
    where: {
      xledgerId,
    },
    include: {
      User: true,
    },
  });
  if (!employeeDetails) return null;
  return employeeDetails.User[0];
}

export async function getRole(roleId: string) {
  if (!roleId) throw new Error("No role id provided");
  return prisma.role.findUnique({
    where: {
      id: roleId,
    },
  });
}

async function getDbUser(user: GoogleProfile) {
  return prisma.user.findUnique({
    where: {
      googleId: user.id,
    },
    include: {
      role: true,
      employeeDetails: true,
    },
  });
}
