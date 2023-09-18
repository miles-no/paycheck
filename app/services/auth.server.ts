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
  
  console.log("defaultRole", defaultRole);

  invariant(defaultRole, "No default role found");

  console.log("setting up user in database");
  const res = await prisma.user.upsert({
    where: { // Find the user by googleId
      googleId: profile.id,
    },
    create: { // Create the user if it doesn't exist
      googleId: profile.id,
      name: profile.displayName,
      email: profile.emails[0].value,
      picture: profile.photos[0].value,
      role: { // Connect the user to the default role
        connect: {
          id: defaultRole.id,
        },
      },
      employeeDetails: {
        create: { // Create employeeDetails
          xledgerId: `${xledgerEmployeeMatch.dbId}`,
        },
      },
    },
    update: { // Update the user if it already exists
      name: profile.displayName,
      email: profile.emails[0].value,
      picture: profile.photos[0].value,
      employeeDetails: { // Upsert employeeDetails
        connectOrCreate: { // Connect if it exists, otherwise create it
          where: { // Find employeeDetails by xledgerId
            xledgerId: `${xledgerEmployeeMatch.dbId}`,
          },
          create: { // Create employeeDetails if it doesn't exist
            xledgerId: `${xledgerEmployeeMatch.dbId}`,
          },
        },
      },
    },
  }).catch((err) => {
    console.log("Error creating user", err);
  });
  console.log({ res });
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
