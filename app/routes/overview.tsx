import type { User } from ".prisma/client";
import { EmployeeDetails, Role } from ".prisma/client";
import { UsersIcon } from "@heroicons/react/24/outline";
import { json, LoaderArgs } from "@remix-run/node";
import { NavLink, useLoaderData } from "@remix-run/react";
import { eventNames } from "process";
import Navbar from "~/components/navbar";
import { StatBox } from "~/components/statBox";
import { requireAdminOrManager } from "~/services/user.server";
import { TimeSheetNav } from "~/components/timeSheetNav";


export async function loader({ params, context, request }: LoaderArgs) {
  const user = await requireAdminOrManager(request);
  const metaKey = request.headers.get("user-agent")?.includes("Mac")
    ? "⌘"
    : "ctrl";

  return json({ metaKey, user });
}
const years = "2024";
const employeeId = "1";
const months = "1";



export default function OverviewPage() {
  const { metaKey, user } = useLoaderData<typeof loader>();

  return (
    <>
      <Navbar
        user={
          user as unknown as User & {
            role: Role;
            employeeDetails: EmployeeDetails | null;
          }
        }
      />

      <main className={"mx-auto flex max-w-7xl flex-col p-10"}>
        <h1
          className={
            "text-3xl font-bold leading-tight text-[#78E8DB]"
          }
        >
          Miles Stavanger
        </h1>
        <TimeSheetNav employeeId={employeeId} year={years} month={months} />
        <h2 className={"text-2xl font-semibold text-white"}>
          Hittil denne måneden
        </h2>
        <div className={"mt-8 mb-8"}>
          <div
            className={"grid grid-cols-1 gap-5 sm:grid-cols-1 lg:grid-cols-3"}
          >
            <StatBox
              label={"Fakturert"}
              content={Intl.NumberFormat("no-NO", {
                style: "currency",
                currency: "NOK",
                maximumFractionDigits: 0,
              }).format(100000)}
            />
            <StatBox
              label={"Løønskost"}
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

        
      </main>
    </>
  );
}
