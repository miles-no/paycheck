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
import { getUser } from "./session.server";
import CommandPalette from "~/components/command-palette";
import { getEmployeeDump } from "~/services/getEmployees.server";

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

export async function loader({ request }: LoaderArgs) {
  const employeeResponse = await getEmployeeDump();
  const year = new Date().getFullYear();
  const month = new Date().getMonth() + 1;
  // todo: adjust commands based on the logged in user
  const pages: Command[] = [
    { id: "home", name: "Hjem", url: "/", icon: "home" },
    { id: "overview", name: "Oversikt", url: "/overview", icon: "chart-bar" },
    { id: "employees", name: "Ansatte", url: "/employees", icon: "users" },
    { id: "logout", name: "Logg ut", url: "/logout", icon: "logout" },
  ];
  const employees: Command[] = employeeResponse.data.employees.edges
    .map((edge) => edge.node)
    .map((employee) => ({
      id: `${employee.dbId}`,
      name: employee.description,
      url: `/employees/${employee.dbId}/timesheets/${year}/${month}`,
      icon: "user",
    }));
  const commands = [...pages, ...employees];

  // get the meta key from the request headers
  const metaKey = request.headers.get("user-agent")?.includes("Mac")
    ? "⌘"
    : "ctrl";

  return json({
    user: await getUser(request),
    commands: commands,
    metaKey,
  });
}

export default function App() {
  const { commands, metaKey } = useLoaderData<typeof loader>();
  return (
    <html lang="nb-NO" className="h-full font-display">
      <head>
        <Meta />
        <Links />
        <title>Miles Timesheets</title>
      </head>
      <body className="h-full bg-gray-100 dark:bg-black dark:text-white">
        <CommandPalette commands={commands} metaKey={metaKey} />
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
