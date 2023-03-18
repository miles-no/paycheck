import type { ActionArgs, LoaderArgs, LoaderFunction } from "@remix-run/node";

import { logout } from "~/session.server";

export async function action({ request }: ActionArgs) {
  return logout(request);
}

export const loader: LoaderFunction = async ({ request }) => {
  return logout(request);
}
