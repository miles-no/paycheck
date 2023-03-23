import type { ActionArgs, LoaderFunction } from "@remix-run/node";

import { authenticator } from "~/services/auth.server";
import { logout } from "~/session.server";

export async function action({ request }: ActionArgs) {
  await authenticator.logout(request, { redirectTo: "/" });
  return logout(request);
}

export const loader: LoaderFunction = async ({ request }) => {
  return logout(request);
};
