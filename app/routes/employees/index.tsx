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
import { TimeSheetNav } from "~/components/timeSheetNav";

export async function loader({ params, context, request }: LoaderArgs) {
  const user = await requireAdminOrManager(request);
  return json({ employees: await getEmployees(), user });
}

export default function IndexPage() {
  const { employees, user } = useLoaderData<typeof loader>();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

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
  const totalHoursWorked = 10000;
  const totalHoursInvoiced = 900;
  const monthlyPay = {
    pay: 10000,
  };
  const maxValue = 10572.5;
  const years = "2024";
  const employeeId = "1";
  const months = "1";
  console.log("asdf", sortedEmployees);

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
        <div className={"flex flex-col gap-8"}>
          <div>
            <h1 className="text-3xl font-bold leading-tight text-[#78E8DB]">
              Ansatte
            </h1>
          </div>
          <TimeSheetNav employeeId={employeeId} year={years} month={months} />
          <div className="sm:flex flex-col sm:items-center">
            <ProgressBar
              totalHoursWorked={totalHoursWorked}
              totalHoursInvoiced={totalHoursInvoiced}
              monthlyPay={monthlyPay}
              maxValue={maxValue}
            />
            <div className="sm:flex-auto flex justify-end">
              <p className={"mt-2 text-sm text-white"}>
                <a href="/report" target="_blank" rel="noopener noreferrer">
                  Eksporter til excel
                </a>
              </p>
            </div>
          </div>
        </div>
        <table>
          <tr className="flex flex-row justify-between text-white mt-8 items-center p-8">
            <th className="w-56 ml-12">
              <button
                onClick={() => sortEmployeesBothWays(employees)}
                className="flex flex-row gap-2 items-center "
              >
                <p>Navn</p>
                <div>
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
            </th>
            <th className="w-36 xl:block hidden">
              Ansatt <br /> nummer
            </th>
            <th className="w-36 xl:block hidden ">Team</th>
            <th className="w-36 xl:block hidden">
              Registrete <br /> timer i alt
            </th>
            <th className="w-36 xl:block hidden">
              Ikke fakturerbare <br /> timer (R / SG)
            </th>
            <th className="w-36 xl:block hidden">
              Fakturerbare <br /> timer (R / SG){" "}
            </th>
            <th className="w-36">
              Fakturerbart <br /> beløp (I kr){" "}
            </th>
          </tr>
            {sortedEmployees.map((employee: any) => (
              <a
              href={`/employees/${employee.dbId}/timesheets/${year}/${month}`}
              key={employee.dbId}>
          <tr className="flex  justify-between items-center mt-8  w-full  bg-[#EBFFFD] shadow dark:border dark:border-gray-500 dark:bg-black dark:bg-opacity-40 sm:rounded-lg p-8">
                <td className="text-lg font-medium leading-6 text-black dark:text-white w-56">
                  {employee.description}
                </td>
                <td className="text-lg font-medium leading-6 text-black dark:text-white w-26 hidden xl:block">
                  {employee.code}
                </td>
                <td className="text-lg font-medium leading-6 text-black dark:text-white w-26 xl:block hidden">
                  {employee.teamLeader}
                </td>
                <td className="text-lg font-medium leading-6 text-black dark:text-white w-26 xl:block hidden">
                  {employee.hoursWorked}
                </td>
                <td className="text-lg font-medium leading-6 text-black dark:text-white w-26 xl:block hidden">
                  {employee.nonInvoicableHours}
                </td>
                <td className="text-lg font-medium leading-6 text-black dark:text-white w-26 xl:block hidden">
                  {employee.invoicedHours}
                </td>
                <td className="text-lg font-medium leading-6 text-black dark:text-white w-26">
                  {employee.invoicedAmount}
                </td>
             
          </tr>
          </a>
            ))}
        </table>
      </main>
    </div>
  );
}
