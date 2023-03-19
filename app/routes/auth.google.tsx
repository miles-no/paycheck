import { authenticator } from "~/services/auth.server";
import { SocialsProvider } from "remix-auth-socials";
import type { ActionArgs } from "@remix-run/node";

export const action = async ({ request }: ActionArgs) => {
  return await authenticator.authenticate(SocialsProvider.GOOGLE, request, {
    successRedirect: "/dashboard",
    failureRedirect: "/",
  });
};
