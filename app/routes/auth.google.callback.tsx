import { LoaderArgs, redirect } from "@remix-run/node";
import { SocialsProvider } from "remix-auth-socials";
import { authenticator } from "~/services/auth.server";

export async function loader({ params, context, request }: LoaderArgs) {
  try {
    return authenticator.authenticate(SocialsProvider.GOOGLE, request, {
      successRedirect: "/profile",
      failureRedirect: "/",
    });
  } catch (error) {
    console.log("error on callback", error);
    return redirect("/");
  }
}
