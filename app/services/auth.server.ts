import { Authenticator } from "remix-auth";
import { sessionStorage } from "~/session.server";
import { GoogleProfile, GoogleStrategy } from "remix-auth-google";
import { SocialsProvider } from "remix-auth-socials";
import invariant from "tiny-invariant";
import { prisma } from "~/db.server";
import { Role } from "../../prisma/seed";

export const authenticator = new Authenticator(sessionStorage);
async function handleSocialAuthCallback({
  profile,
}: {
  profile: GoogleProfile;
}) {
  await prisma.user.upsert({
    where: {
      googleId: profile.id,
    },
    update: {
      googleId: profile.id,
      name: profile.displayName,
      email: profile.emails[0].value,
      picture: profile.photos[0].value,
    },
    create: {
      googleId: profile.id,
      name: profile.displayName,
      email: profile.emails[0].value,
      picture: profile.photos[0].value,
      role: {
        connect: {
          id: Role.employee, // default role
        },
      },
    },
  });
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
      callbackURL: `http://localhost:3000/auth/${SocialsProvider.GOOGLE}/callback`,
    },
    handleSocialAuthCallback
  )
);
