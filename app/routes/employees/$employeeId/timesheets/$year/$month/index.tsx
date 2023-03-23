import type { EmployeeDetails, Role, User } from ".prisma/client";
import { CheckBadgeIcon } from "@heroicons/react/24/outline";
import type { LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useParams } from "@remix-run/react";
import Navbar from "~/components/navbar";
import { TimeSheetNav } from "~/components/timeSheetNav";
import { getEmployeeDetailsByXledgerId } from "~/models/employeeDetails.server";
import { getXledgerEmployeeData } from "~/routes/employees/$employeeId";
import type { XLedgerGraphQLTimesheetQueryResponse } from "~/services/getTimesheet.server";
import { getTimesheets } from "~/services/getTimesheet.server";
import { requireUser } from "~/services/user.server";
import { aggregateProjectSummary } from "~/utils/aggregateProjectSummary.server";
import { calculateMonthlyPayFromSubTotal } from "~/utils/calculateMonthlyPayFromTimesheet";

function getMainProject(
  timesheetQueryResponse: XLedgerGraphQLTimesheetQueryResponse
) {
  const totalByProject = aggregateProjectSummary(timesheetQueryResponse);
  let mainProject;
  for (const project in totalByProject) {
    if (!mainProject || totalByProject[project].hours > mainProject.hours) {
      mainProject = totalByProject[project];
    }
  }
  return mainProject;
}

export async function loader({ params, context, request }: LoaderArgs) {
  const { employeeId, year, month } = params;

  const user = await requireUser(request);
  if (!user) return redirect("/login");
  if (user.role.name === ("admin" || "manager")) {
    // good to go
  } else {
    // Check if user is allowed to view this page
    if (user.employeeDetails && user.employeeDetails.xledgerId !== employeeId)
      return redirect("/403");
  }

  const timesheets = await getTimesheets(
    Number(employeeId),
    new Date(Number(year), Number(month) - 1)
  );
  if (!timesheets) throw new Error("No timesheets found");

  const employeeDetails = await getEmployeeDetailsByXledgerId(
    employeeId as string
  );
  const selfCostFactor = employeeDetails?.selfCostFactor;
  const provisionPercentage = employeeDetails?.provisionPercentage;

  if (selfCostFactor == null || provisionPercentage == null) {
    // We are missing some parameters, redirect to edit page
    return redirect(`/employees/${employeeId}`);
  }

  // Calculate total hours and revenue by project
  const totalByProject = aggregateProjectSummary(timesheets);
  const subTotal = Object.values(totalByProject || {}).reduce(
    (acc, cur) => acc + cur.sum,
    0
  );

  const xledgerEmployeeData = await getXledgerEmployeeData(
    employeeId as string
  );
  const yearlyFixedSalary =
    xledgerEmployeeData?.data?.payrollRates?.edges?.[0]?.node?.rate || 600000;

  // Calculate monthly pay
  const monthlyPay = calculateMonthlyPayFromSubTotal(
    subTotal,
    yearlyFixedSalary,
    selfCostFactor,
    provisionPercentage
  );

  // Select the project with the highest sum of hours
  const mainProject = getMainProject(timesheets);

  return json({ timesheets, monthlyPay, totalByProject, mainProject, user });
}

export default function Example() {
  const { monthlyPay, totalByProject, mainProject, user } =
    useLoaderData<typeof loader>();

  const { employeeId, year, month } = useParams();
  const monthName = new Date(Number(year), Number(month) - 1).toLocaleString(
    "nb-NO",
    { month: "long" }
  );

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
        <TimeSheetNav employeeId={employeeId} year={year} month={month} />
        <div className="bg-white bg-opacity-50 px-4 pt-8 pb-8 dark:bg-black dark:bg-opacity-10 sm:px-6 lg:px-8">
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h1 className="text-base font-semibold leading-6 text-gray-900 dark:text-white">
                Forventet lønnsomsetning
              </h1>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-200">
                For arbeid utført i {monthName} {year}.
              </p>
            </div>
          </div>
          <div>
            <table className={"mt-4 w-full"}>
              <thead className={"border-b border-gray-200"}>
                <tr
                  className={
                    "border-b border-gray-200 text-gray-900 dark:text-gray-200"
                  }
                >
                  <th
                    className={
                      "py-3.5 px-3 text-left text-sm font-semibold sm:table-cell"
                    }
                  >
                    Prosjekt
                  </th>
                  <th
                    className={
                      "py-3.5 px-3 text-left text-sm font-semibold sm:table-cell"
                    }
                  >
                    Forklaring
                  </th>
                  <th
                    className={
                      "py-3.5 px-3 text-right text-sm font-semibold sm:table-cell"
                    }
                  >
                    Timer
                  </th>
                  <th
                    className={
                      "py-3.5 px-3 text-right text-sm font-semibold sm:table-cell"
                    }
                  >
                    Rate
                  </th>
                  <th
                    className={
                      "py-3.5 px-3 text-right text-sm font-semibold sm:table-cell"
                    }
                  >
                    Sum
                  </th>
                </tr>
              </thead>
              <tbody className={"border-b border-gray-200"}>
                {totalByProject.length > 0 ? (
                  Object.values(totalByProject).map(
                    ({ hours, id, name, rate, sum, explanation }) => (
                      <tr
                        key={name}
                        className={
                          "border-b border-gray-200 text-gray-500 dark:text-gray-200"
                        }
                      >
                        <td
                          className={
                            "py-4 px-3 text-left text-sm blur-md sm:table-cell"
                          }
                        >
                          <p>{name}</p>
                        </td>
                        <td className="py-4 px-3 text-left text-sm text-gray-400">
                          {mainProject?.name === name ? (
                            <span className={"flex gap-2"}>
                              <CheckBadgeIcon
                                className={"h-5"}
                                title={"Hovedprosjekt"}
                              />
                              <p>Hovedprosjekt</p>
                            </span>
                          ) : explanation ? (
                            <p>{explanation}</p>
                          ) : null}
                        </td>
                        <td
                          className={
                            "redacted py-4 px-3 text-right text-sm sm:table-cell"
                          }
                        >
                          {Intl.NumberFormat("nb-NO", {
                            style: "decimal",
                            maximumFractionDigits: 2,
                          }).format(hours)}
                        </td>
                        <td
                          className={
                            "redacted py-4 px-3 text-right text-sm sm:table-cell"
                          }
                        >
                          {Intl.NumberFormat("nb-NO", {
                            style: "currency",
                            currency: "NOK",
                            maximumFractionDigits: 2,
                          }).format(rate)}
                        </td>
                        <td
                          className={
                            "py-4 px-3 text-right text-sm sm:table-cell"
                          }
                        >
                          {Intl.NumberFormat("nb-NO", {
                            style: "currency",
                            currency: "NOK",
                            maximumFractionDigits: 2,
                          }).format(sum)}
                        </td>
                      </tr>
                    )
                  )
                ) : (
                  <tr
                    className={
                      "border-b border-gray-200 bg-gray-100 text-gray-500 dark:bg-gray-900 dark:text-gray-200"
                    }
                  >
                    <td className={"py-4 px-3 text-left text-sm sm:table-cell"}>
                      Ingen timer ført i denne perioden
                    </td>
                    <td
                      className={
                        "emptyCell py-4 px-3 text-left text-sm sm:table-cell"
                      }
                    ></td>
                    <td
                      className={
                        "emptyCell py-4 px-3 text-right text-sm sm:table-cell"
                      }
                    ></td>
                    <td
                      className={
                        "emptyCell py-4 px-3 text-right text-sm sm:table-cell"
                      }
                    ></td>
                    <td
                      className={
                        "emptyCell py-4 px-3 text-right text-sm sm:table-cell"
                      }
                    ></td>
                  </tr>
                )}
              </tbody>
              <tfoot className={"text-gray-900 dark:text-gray-200"}>
                <tr className={"border-b border-gray-200"}>
                  <th
                    colSpan={4}
                    className={
                      "py-3.5 px-3 text-right text-sm font-semibold sm:table-cell"
                    }
                  >
                    Subtotal
                  </th>
                  <td className={"py-4 px-3 text-right text-sm sm:table-cell"}>
                    {Intl.NumberFormat("nb-NO", {
                      style: "currency",
                      currency: "NOK",
                      maximumFractionDigits: 2,
                    }).format(monthlyPay.invoicedAmount)}
                  </td>
                </tr>
                <tr>
                  <th
                    colSpan={4}
                    className={
                      "py-3.5 px-3 text-right text-sm font-semibold sm:table-cell"
                    }
                  >
                    Provisjon
                  </th>
                  <td className={"py-4 px-3 text-right text-sm sm:table-cell"}>
                    {Intl.NumberFormat("nb-NO", {
                      style: "currency",
                      currency: "NOK",
                      maximumFractionDigits: 2,
                    }).format(monthlyPay.provision)}
                  </td>
                </tr>
                <tr className={"border-b border-gray-200"}>
                  <th
                    colSpan={4}
                    className={
                      "py-3.5 px-3 text-right text-sm font-semibold sm:table-cell"
                    }
                  >
                    Fastlønn
                  </th>
                  <td className={"py-4 px-3 text-right text-sm sm:table-cell"}>
                    {Intl.NumberFormat("nb-NO", {
                      style: "currency",
                      currency: "NOK",
                      maximumFractionDigits: 2,
                    }).format(monthlyPay.fixedSalary)}
                  </td>
                </tr>
                <tr>
                  <th
                    colSpan={4}
                    className={
                      "py-3.5 px-3 text-right text-sm font-semibold sm:table-cell"
                    }
                  >
                    Totalt
                  </th>
                  <td className={"py-4 px-3 text-right text-sm sm:table-cell"}>
                    {Intl.NumberFormat("nb-NO", {
                      style: "currency",
                      currency: "NOK",
                      maximumFractionDigits: 2,
                    }).format(monthlyPay.pay)}
                  </td>
                </tr>
              </tfoot>
            </table>
            <div className={"flex justify-end"}>
              <a
                href={`/employees/${employeeId}`}
                className={"ml-4 p-2 text-sm text-gray-500"}
              >
                Endre variabler
              </a>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  return (
    <div className={"pt-10 text-center"}>
      <h1 className={"text-2xl font-semibold "}>Oops, something went wrong</h1>
      <p className={"text-red-500"}>{error.message}</p>
      <div className={"overflow-auto"}>
        <pre
          className={
            "m-4 inline-block rounded bg-gray-100 p-2 text-left text-sm dark:bg-gray-900"
          }
        >
          <code>{error.stack}</code>
        </pre>
        <button
          className={"ml-2 rounded bg-gray-100 p-2 text-sm dark:bg-gray-900"}
          onClick={() => {
            navigator.clipboard.writeText(
              JSON.stringify({ ...error, stack: error.stack }, null, 2)
            );
          }}
        >
          Copy stack
        </button>
        <a
          href={`mailto:henry.sjoen@miles.no?subject=Error in timesheet&body=${encodeURIComponent(
            JSON.stringify({ ...error, stack: error.stack }, null, 2)
          )}`}
          className={
            "ml-2 rounded bg-gray-100 p-2 text-sm dark:bg-gray-200 dark:text-gray-900"
          }
        >
          Tell Henry
        </a>
      </div>
    </div>
  );
}
