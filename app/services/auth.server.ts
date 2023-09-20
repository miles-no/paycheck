import { Authenticator } from "remix-auth";
import { sessionStorage } from "~/session.server";
import type { GoogleProfile } from "remix-auth-google";
import { GoogleStrategy } from "remix-auth-google";
import { SocialsProvider } from "remix-auth-socials";
import invariant from "tiny-invariant";
import { prisma } from "~/db.server";
import { getEmployees } from "~/services/getEmployees.server";
import { Role } from "~/enums/role";

export const authenticator = new Authenticator(sessionStorage);

const thomasAtMiles = "thomas@miles.no";
const thomasBerheimAtMiles = "thomas.barheim@miles.no"

async function handleSocialAuthCallback({
  profile,
}: {
  profile: GoogleProfile;
}) {

  console.log(`Email logging in ${profile.emails[0].value}, google id: ${profile.id}`)

  if (profile.emails[0].value === thomasBerheimAtMiles){
    console.log(`Email is ${thomasBerheimAtMiles} transforming it to be ${thomasAtMiles}`)
    profile.emails[0].value = thomasAtMiles;
  }

  console.log("getting employes");
  const employees = await getEmployees();

  const xledgerEmployeeMatch = employees.find(
    (employee) => employee.email === profile.emails[0].value
  );

  console.log("checking xledger match");
  if (!xledgerEmployeeMatch) {
    throw new Error(
      "No Xledger employee found with email " + profile.emails[0].value
    );
  }

  const defaultRole = await prisma.role.findUnique({
    where: {
      name: Role.employee,
    },
  });
  invariant(defaultRole, "No default role found");

  console.log("Checking if user exists...");
  // First, try to find the user by googleId
  const existingUser = await prisma.user.findUnique({
    where: {
      googleId: profile.id,
    },
  });

  if (existingUser) {
    console.log("User found. Updating user info like name, email, picture...");
    // User already exists, update the user
    const updatedUser = await prisma.user.update({
      where: {
        googleId: profile.id
      },
      data: {
        name: profile.displayName,
        email: profile.emails[0].value,
        picture: profile.photos[0].value
      },
    }).catch((err) => console.log("Error while updating user", err));
    console.log("User updated", updatedUser);
  } else {
    console.log("User not found. Creating new user...");
    // User doesn't exist, create a new user
    const newUser = await prisma.user.create({
      data: {
        googleId: profile.id,
        name: profile.displayName,
        email: profile.emails[0].value,
        picture: profile.photos[0].value,
        role: {
          connect: {
            id: defaultRole.id
          }
        },
        employeeDetails: {
          create: {
            xledgerId: xledgerEmployeeMatch.dbId.toString(),
            selfCostFactor: 1.5
          }
        }
      },
    }).catch((err) => console.log("Error while creating user", err));
    console.log("User created", newUser);
  }
  return profile;
}

invariant(process.env.GOOGLE_CLIENT_ID, "GOOGLE_CLIENT_ID must be set");
invariant(process.env.GOOGLE_CLIENT_SECRET, "GOOGLE_CLIENT_SECRET must be set");

authenticator.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      scope: ["openid", "email", "profile"],
      callbackURL: `${process.env.BASE_URL}/auth/${SocialsProvider.GOOGLE}/callback`,
    },
    handleSocialAuthCallback
  )
);
