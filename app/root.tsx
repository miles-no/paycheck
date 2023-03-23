import type { LinksFunction, LoaderArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";

import tailwindStylesheetUrl from "./styles/tailwind.css";
import globalStylesheetUrl from "./styles/global.css";
import CommandPalette from "~/components/command-palette";
import { getEmployees } from "~/services/getEmployees.server";
import { optionalUser } from "~/services/user.server";

export const links: LinksFunction = () => {
  return [
    { rel: "stylesheet", href: tailwindStylesheetUrl },
    { rel: "stylesheet", href: globalStylesheetUrl },
    //   add google fonts here
    { rel: "preconnect", href: "https://fonts.gstatic.com" },
    {
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap",
    },
  ];
};

export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "Miles Timesheets",
  viewport: "width=device-width,initial-scale=1",
});

export interface Command {
  id: string;
  name: string;
  url: string;
  icon: string;
}

export const pages: Command[] = [
  { id: "home", name: "Hjem", url: "/", icon: "home" },
  { id: "logout", name: "Logg ut", url: "/logout", icon: "logout" },
  { id: "profile", name: "Profil", url: "/profile", icon: "user" },
];
export const adminPages: Command[] = [
  { id: "overview", name: "Oversikt", url: "/overview", icon: "chart-bar" },
  { id: "employees", name: "Ansatte", url: "/employees", icon: "users" },
];
export async function loader({ request }: LoaderArgs) {
  // get the meta key from the request headers
  const metaKey = request.headers.get("user-agent")?.includes("Mac")
    ? "⌘"
    : "ctrl";

  const user = await optionalUser(request);
  if (!user) return json({ commands: [], metaKey });

  // todo: adjust commands based on the logged in user
  let commands: Command[] = [...pages];
  if (user.role.name === "admin" || user.role.name === "manager") {
    const employees = await getEmployees();
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;
    commands = [
      ...pages,
      ...adminPages,
      ...employees.map((employee) => ({
        id: `timesheet-${employee.dbId}`,
        name: `Timeliste - ${employee.description}`,
        url: `/employees/${employee.dbId}/timesheets/${year}/${month}`,
        icon: "clock",
      })),
      ...employees.map((employee) => ({
        id: `employee-${employee.dbId}`,
        name: `Profil - ${employee.description}`,
        url: `/employees/${employee.dbId}`,
        icon: "user",
      })),
    ];
  }
  return json({
    commands: commands,
    metaKey,
  });
}

export default function App() {
  const { commands, metaKey } = useLoaderData<typeof loader>();
  return (
    <html lang="nb-NO" className="font-display h-full">
      <head>
        <Meta />
        <Links />
        <title>Miles Timesheets</title>
      </head>
      <body className="h-full bg-gray-100 dark:bg-black dark:text-white">
        {commands.length > 0 && (
          <CommandPalette commands={commands} metaKey={metaKey} />
        )}
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
