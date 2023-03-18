import { UsersIcon } from "@heroicons/react/24/outline";
import { json, redirect } from "@remix-run/node";
import { NavLink, useLoaderData } from "@remix-run/react";
import type { LoaderFunction } from "@remix-run/router";
import { StatBox } from "~/components/statBox";
import { requireUser } from "~/session.server";
import { useOptionalUser } from "~/utils";
import { Role } from "../../prisma/seed";

export const loader: LoaderFunction = async ({ request }) => {
  // Guard against non-admins or managers
  const user = await requireUser(request);
  const userRole = user?.role.name;
  const allowedRoles = [Role.admin, Role.manager];

  // only let managers and admins see the overview page
  if (!allowedRoles.includes(userRole as Role)) {
    return redirect("/403");
  }

  const metaKey = request.headers.get("user-agent")?.includes("Mac") ? "⌘" : "ctrl";
  return json({ metaKey });
};

export default function OverviewPage() {
  const { metaKey } = useLoaderData<typeof loader>();

  return (
    <main className={"mx-auto max-w-7xl sm:px-6 lg:px-8"}>
      <h1
        className={
          "pt-8 pb-8 text-2xl font-light leading-8 text-gray-900 dark:text-white"
        }
      >
        Miles Stavanger
      </h1>
      <h2 className={"text-2xl font-semibold text-gray-900 dark:text-white"}>
        Hittil denne måneden
      </h2>
      <div className={"mt-8 mb-8"}>
        <div className={"grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"}>
          <StatBox
            label={"Fakturert"}
            content={Intl.NumberFormat("no-NO", {
              style: "currency",
              currency: "NOK",
              maximumFractionDigits: 0,
            }).format(100000)}
          />
          <StatBox
            label={"Lønnsomsetning"}
            content={Intl.NumberFormat("no-NO", {
              style: "currency",
              currency: "NOK",
              maximumFractionDigits: 0,
            }).format(-10000)}
          />
          <StatBox
            label={"Sum"}
            content={Intl.NumberFormat("no-NO", {
              style: "currency",
              currency: "NOK",
              maximumFractionDigits: 0,
            }).format(90000)}
          />
        </div>
      </div>

      <div className="hideInPrint">
        <h2>Lenker</h2>
        <p className={"text-gray-500 dark:text-gray-400"}>
          Hint: bruk <kbd>{metaKey}</kbd> + <kbd>K</kbd> for å åpne
          kommandopanelet eller trykk på søkeknappen nede til høyre.
        </p>
        {/*    Let's show some links to things to do, like see employees, search etc*/}
        <div className={"mt-4"}>
          <div
            className={"grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"}
          >
            <p>
              <NavLink to={"/employees"} className={"flex rounded border p-2"}>
                <UsersIcon className={"h-6 w-6"} />
                <span className={"ml-2"}>Se ansatte</span>
              </NavLink>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
