import { authenticator } from "~/services/auth.server";
import { SocialsProvider } from "remix-auth-socials";
import type { LoaderArgs } from "@remix-run/node";

export async function loader({ params, context, request }: LoaderArgs) {
  return authenticator.authenticate(SocialsProvider.GOOGLE, request, {
    successRedirect: "/dashboard",
    failureRedirect: "/",
  });
}
