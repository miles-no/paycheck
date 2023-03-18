import type { LoaderFunction } from "@remix-run/router";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useParams } from "@remix-run/react";
import { calculateMonthlyPayFromSubTotal } from "~/utils/calculateMonthlyPayFromTimesheet";
import { aggregateProjectSummary } from "~/utils/aggregateProjectSummary.server";
import type { XLedgerGraphQLTimesheetQueryResponse } from "~/services/getTimesheet.server";
import { getTimesheets } from "~/services/getTimesheet.server";
import { getUser } from "~/session.server";
import { Role } from "../../../../../../../prisma/seed";
import { CheckBadgeIcon } from "@heroicons/react/24/outline";
import { TimeSheetNav } from "~/components/timeSheetNav";
import { getEmployeeDetailsByXledgerId } from "~/models/employeeDetails.server";
import { isAdminOrManager } from "~/utils/isAdminOrManager";
import { getXledgerEmployeeData } from "~/routes/employees/$employeeId";

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

export const loader: LoaderFunction = async ({ params, context, request }) => {
  const { employeeId, year, month } = params;

  const user = await getUser(request);
  const roleName = user?.role.name as Role;
  if (!roleName) return redirect("/login");

  const employeeDetails = await getEmployeeDetailsByXledgerId(
    employeeId as string
  );
  const userIsTheEmployee = employeeDetails?.xledgerId === employeeId;
  const userIsNotTheEmployee = !userIsTheEmployee;
  const userIsNotAdminOrManager = ![Role.admin, Role.manager].includes(
    roleName
  );
  if (userIsNotAdminOrManager && userIsNotTheEmployee) {
    return redirect("/403");
  }

  const timesheets = await getTimesheets(
    Number(employeeId),
    new Date(Number(year), Number(month) - 1)
  );
  if (!timesheets) throw new Error("No timesheets found");

  const extradata = await getEmployeeDetailsByXledgerId(employeeId as string);
  // Todo: Get user's yearly fixed salary, self-cost-factor, and provision percentage from database or xledger
  const selfCostFactor = extradata?.selfCostFactor;
  const provisionPercentage = extradata?.provisionPercentage;

  const xledgerEmployeeData = await getXledgerEmployeeData(
    employeeId as string
  );
  const yearlyFixedSalary =
    xledgerEmployeeData.data.payrollRates.edges[0].node.rate;

  // Note, selfCostFactor and provisionPercentage can technically be 0,
  // so we need to check for null
  if (selfCostFactor == null || provisionPercentage == null) {
    // If user is admin or manager, redirect to employee page, so they can fix the employee's parameters
    if (isAdminOrManager(roleName)) {
      return redirect(`/employees/${employeeId}`);
    } else {
      throw new Error("Missing selfCostFactor or provisionPercentage");
    }
  }

  // Calculate total hours and revenue by project using test data
  const totalByProject = aggregateProjectSummary(timesheets);
  const subTotal = Object.values(totalByProject || {}).reduce(
    (acc, cur) => acc + cur.sum,
    0
  );

  // Calculate monthly pay using test data and user parameters
  const monthlyPay = calculateMonthlyPayFromSubTotal(
    subTotal,
    yearlyFixedSalary,
    selfCostFactor,
    provisionPercentage
  );

  // Select the project with the highest sum of hours
  const mainProject = getMainProject(timesheets);

  // Return the test data, monthly pay, and total hours and revenue by project
  return json({ timesheets, monthlyPay, totalByProject, mainProject });
};

export default function Example() {
  const data: {
    timesheets: ReturnType<typeof getTimesheets>;
    monthlyPay: ReturnType<typeof calculateMonthlyPayFromSubTotal>;
    totalByProject: ReturnType<typeof aggregateProjectSummary>;
    mainProject: ReturnType<typeof getMainProject>;
  } = useLoaderData<typeof loader>();
  const monthlyPay = data.monthlyPay;
  const mainProject = data.mainProject?.name ?? 0;

  const { employeeId, year, month } = useParams();
  const monthName = new Date(Number(year), Number(month) - 1).toLocaleString(
    "nb-NO",
    { month: "long" }
  );

  return (
    <div>
      {/*  Section about the employee*/}
      <div
        className={
          "bg-gray-100 bg-opacity-50 p-4 text-center dark:bg-black dark:bg-opacity-50"
        }
      >
        {/*<p>Henry Sjøen</p>*/}
        <p>{year}</p>
      </div>
      <TimeSheetNav employeeId={employeeId} year={year} month={month} />
      <div className="bg-white bg-opacity-50 px-4 pt-8 pb-8 dark:bg-black dark:bg-opacity-60 sm:px-6 lg:px-8">
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
              {data.totalByProject.length > 0 ? (
                Object.values(data.totalByProject).map(
                  ({ hours, id, name, rate, sum, explanation }) => (
                    <tr
                      key={name}
                      className={
                        "border-b border-gray-200 text-gray-500 dark:text-gray-200"
                      }
                    >
                      <td
                        className={"py-4 px-3 text-left text-sm sm:table-cell"}
                      >
                        <p>{name}</p>
                      </td>
                      <td className="py-4 px-3 text-left text-sm text-gray-400">
                        {mainProject === name ? (
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
                        className={"py-4 px-3 text-right text-sm sm:table-cell"}
                      >
                        {Intl.NumberFormat("nb-NO", {
                          style: "decimal",
                          maximumFractionDigits: 2,
                        }).format(hours)}
                      </td>
                      <td
                        className={"py-4 px-3 text-right text-sm sm:table-cell"}
                      >
                        {Intl.NumberFormat("nb-NO", {
                          style: "currency",
                          currency: "NOK",
                          maximumFractionDigits: 2,
                        }).format(rate)}
                      </td>
                      <td
                        className={"py-4 px-3 text-right text-sm sm:table-cell"}
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
    </div>
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
