import type { ActionArgs, LoaderFunction } from "@remix-run/node";

import { logout } from "~/session.server";
import { authenticator } from "~/services/auth.server";

export async function action({ request }: ActionArgs) {
  await authenticator.logout(request, { redirectTo: "/" });
  return logout(request);
}

export const loader: LoaderFunction = async ({ request }) => {
  return logout(request);
};
