import type { ActionArgs } from "@remix-run/node";
import { SocialsProvider } from "remix-auth-socials";
import { authenticator } from "~/services/auth.server";
import { safeRedirect } from "~/utils";

export const action = async ({ request }: ActionArgs) => {
  const formData = await request.formData();
  const redirectTo = safeRedirect(formData.get("redirectTo"), "/");

  return await authenticator.authenticate(SocialsProvider.GOOGLE, request, {
    successRedirect: redirectTo,
    failureRedirect: "/",
  });
};
