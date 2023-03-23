import type { LoaderArgs, MetaFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useSearchParams } from "@remix-run/react";
import { SocialsProvider } from "remix-auth-socials";
import { optionalUser } from "~/services/user.server";

export async function loader({ request }: LoaderArgs) {
  const user = await optionalUser(request);
  if (user) return redirect("/"); // Already logged in
  return json({}); // Not logged in
}

export const meta: MetaFunction = () => {
  return {
    title: "Login",
  };
};

export default function LoginPage() {
  return (
    <div className="flex min-h-full flex-col justify-center">
      <div className="mx-auto w-full max-w-md px-8">
        <LoginForm />
      </div>
    </div>
  );
}

export function LoginForm() {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/";
  return (
    <Form method="post" action={`/auth/${SocialsProvider.GOOGLE}`}>
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <button
        type="submit"
        className="flex w-full justify-center rounded-md bg-red-600 bg-opacity-90 py-2 px-3 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
      >
        Login with Google
      </button>
    </Form>
  );
}
