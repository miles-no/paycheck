import type { EmployeeDetails, Role, User } from ".prisma/client";
import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import Navbar from "~/components/navbar";
import { getEmployees } from "~/services/getEmployees.server";
import { requireAdminOrManager } from "~/services/user.server";
import { ProgressBar } from "~/components/progressBar";
import React, { useState } from "react";
import UpOrDown from "~/assets/UpOrDown";
export async function loader({ params, context, request }: LoaderArgs) {
  const user = await requireAdminOrManager(request);
  return json({ employees: await getEmployees(), user });
}

export default function IndexPage() {
  const { employees, user } = useLoaderData<typeof loader>();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  console.log("asdf", employees);

  const [sortedEmployees, setSortedEmployees] = useState(employees);
  const [sortDirection, setSortDirection] = useState("asc" as "asc" | "desc");
  const sortEmployeesBothWays = (employees: any) => {
    const sorted = employees.sort((a: any, b: any) => {
      if (sortDirection === "asc") {
        setSortDirection("desc");
        return a.description.localeCompare(b.description);
      } else {
        setSortDirection("asc");
        return b.description.localeCompare(a.description);
      }
    });
    setSortedEmployees(sorted);
  };

  return (
    <div>
      <Navbar
        user={
          user as unknown as User & {
            role: Role;
            employeeDetails: EmployeeDetails | null;
          }
        }
      />

      <main className={"mx-auto flex max-w-7xl flex-col p-10"}>
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto flex justify-end">
            <p className={"mt-2 text-sm text-white"}>
              <a href="/report" target="_blank" rel="noopener noreferrer">
                Eksporter til excel
              </a>
            </p>
          </div>
        </div>
        <div className="flex flex-row justify-between text-white mt-8 items-center">
          <button
            onClick={() => sortEmployeesBothWays(employees)}
            className="flex flex-row gap-2 items-center"
          >
            <p>Navn</p>
            <div >
              <div
                className={`$ flex justify-center {" ${
                  sortDirection === `desc`
                    ? " border-b border-[#bb413d]"
                    : "border-t border-[#bb413d]"
                } `}
              >
                <UpOrDown />
              </div>
            </div>
          </button>
          <h3>Ansatt nummer</h3>
          <h3>Team</h3>
          <h3>Registrete timer i alt</h3>
          <h3>Ikke fakturerbare timer (R / SG)</h3>
          <h3>Fakturerbare timer (R / SG) </h3>
          <h3>Fakturerbart beløp (I kr) </h3>
        </div>
        <div className="mt-8">
          <div className="flex flex-col justify-between gap-8">
            {sortedEmployees.map((employee: any) => (
              <a
                href={`/employees/${employee.dbId}/timesheets/${year}/${month}`}
                key={employee.dbId}
                className="overflow-hidden bg-[#EBFFFD] shadow dark:border dark:border-gray-500 dark:bg-black dark:bg-opacity-40 sm:rounded-lg"
              >
                <div className="redacted flex justify-between p-2 sm:p-5 flex-row">
                  <span className="flex flex-row justify-between gap-8 items-center">
                    <h3 className="text-lg font-medium leading-6 text-black dark:text-white">
                      {employee.description}
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm text-black dark:text-gray-400">
                      {employee.positionValue?.description}
                    </p>
                  </span>
                  <span className=" hashStyle mt-1 max-w-2xl text-sm text-black dark:text-gray-400">
                    <span className={"sr-only"}>Ansattnummer </span>
                    {employee.code}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
