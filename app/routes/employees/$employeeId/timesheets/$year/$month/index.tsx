import type { EmployeeDetails, Role, User } from ".prisma/client";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import type { LoaderArgs, ActionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, isRouteErrorResponse, useLoaderData, useParams, useRouteError } from "@remix-run/react";
import Navbar from "~/components/navbar";
import { TimeSheetNav } from "~/components/timeSheetNav";
import { getEmployeeDetailsByXledgerId } from "~/models/employeeDetails.server";
import { getXledgerEmployeeData } from "~/routes/employees/$employeeId";
import { cache } from "~/services/cache";
import { getEmployees } from "~/services/getEmployees.server";
import type { XLedgerGraphQLTimesheetQueryResponse } from "~/services/getTimesheet.server";
import {
  getMonthInterval,
  getTimesheetCacheKey,
  getTimesheets
} from "~/services/getTimesheet.server";
import { requireUser } from "~/services/user.server";
import { aggregateProjectSummary } from "~/utils/aggregateProjectSummary.server";
import type { ErrorResponse } from "@remix-run/router";
import { calculateMonthlyPayFromSubTotal } from "~/utils/calculateMonthlyPayFromTimesheet";

function getMainProject(
  timesheetQueryResponse: XLedgerGraphQLTimesheetQueryResponse
) {
  const totalByProject = aggregateProjectSummary(timesheetQueryResponse);
  let mainProject;
  for (const project in totalByProject) {
    if (!mainProject || totalByProject[project].hours.invoiced > mainProject.hours.invoiced) {
      mainProject = totalByProject[project];
    }
  }
  return mainProject;
}

export async function loader({ params, request }: LoaderArgs) {
  const { employeeId, year, month } = params;

  const user = await requireUser(request);
  if (!user) return redirect("/login");
  if (user.role.name === ("admin" || "manager")) {
    // good to go
  } else {
    // Check if the user is allowed to view this page
    if (user.employeeDetails && user.employeeDetails.xledgerId !== employeeId)
      return redirect("/403");
  }

  //Todo: Double check that we are fetching the correct timesheet
  const timesheets = await getTimesheets(
    `${employeeId}`,
    new Date(Number(year), Number(month))
  );
  if (!timesheets) throw new Error("No timesheets found");

  const employeeDetails = await getEmployeeDetailsByXledgerId(
    employeeId as string
  );
  const selfCostFactor = employeeDetails?.selfCostFactor;
  const provisionPercentage = employeeDetails?.provisionPercentage;

  //to get employee name, we need to get it from the employees list
  const employees = await getEmployees();
  
  const employee = employees.find(
    (employee) => employee.dbId.toString() === employeeId
  );

  if (selfCostFactor == null || provisionPercentage == null) {
    // We are missing some parameters, redirect to edit page
    return redirect(`/employees/${employeeId}`);
  }

  // Calculate total hours and revenue by project
  const totalByProject = aggregateProjectSummary(timesheets);
  const subTotal = Object.values(totalByProject || {}).reduce(
    (acc, cur) => acc + cur.sum.earned,
    0
  );

  const xledgerEmployeeData = await getXledgerEmployeeData(
    employeeId as string
  );
  const yearlyFixedSalary =
    xledgerEmployeeData?.data?.payrollRates?.edges?.[0]?.node?.rate || 0;

  // Calculate monthly pay
  const monthlyPay = calculateMonthlyPayFromSubTotal(
    subTotal,
    yearlyFixedSalary,
    selfCostFactor,
    provisionPercentage
  );

  // Select the project with the highest sum of hours
  const mainProject = getMainProject(timesheets);

  return json({ timesheets, monthlyPay, totalByProject, mainProject, user, employee });
}

export const action = async ({ request, params }: ActionArgs) => {
  const { employeeId, year, month } = params;

  // Check if user is allowed to trigger this action
  const user = await requireUser(request);
  if (!user) return redirect("/login");
  if (user.role.name === ("admin" || "manager")) {
    // good to go
  } else {
    // Check if user is allowed to view this page
    if (user.employeeDetails && user.employeeDetails.xledgerId !== employeeId)
      return redirect("/403");
  }

  if (!employeeId || !year || !month) return redirect("/404");

  const { from, to } = getMonthInterval(new Date(Number(year), Number(month)));

  // use cache if available
  const cacheKey = getTimesheetCacheKey(employeeId, from, to);
  if (cache.has(cacheKey)) {
    cache.delete(cacheKey);
    return redirect(`/employees/${employeeId}/timesheets/${year}/${month}`);
  }
  return null;
};

export default function MonthlyTimesheetPage() {
  const { monthlyPay, totalByProject, mainProject, user, employee } =
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
                Forventet lønnsomsetning - {employee?.description}
              </h1>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-200">
                For arbeid utført i {monthName} {year}.
              </p>
            </div>
          </div>
          <div className={"-mx-4 mt-8 flow-root sm:mx-0"}>
            <table className={"min-w-full divide-y divide-gray-300"}>
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 sm:pl-0"
                  >
                    Prosjekt
                  </th>
                  <th
                    scope="col"
                    className="hidden py-3.5 px-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-500 md:table-cell"
                  >
                    Forklaring
                  </th>
                  <th
                    scope={"col"}
                    className={
                      "hidden py-3.5 px-3 text-right text-sm font-semibold text-gray-900 dark:text-gray-500 md:table-cell"
                    }
                  >
                    Timer
                  </th>
                  <th
                    scope={"col"}
                    className={
                      "hidden py-3.5 px-3 text-right text-sm font-semibold text-gray-900 dark:text-gray-500 md:table-cell"
                    }
                  >
                    Rate
                  </th>
                  <th
                    scope={"col"}
                    className={
                      "dark: py-3.5 pl-3 pr-4 text-right text-sm font-semibold text-gray-900 dark:text-gray-500 sm:pr-0"
                    }
                  >
                    Sum
                  </th>
                </tr>
              </thead>
              <tbody>
                {totalByProject.length > 0 ? (
                  Object.values(totalByProject).map(
                    ({ hours, name, rate, sum, explanation, error }) => (
                      <tr key={name}
                          className={`border-b border-gray-300 ${error ? "bg-red-300 dark:bg-red-950 rounded" : ""}`}>
                        <td className={"py-4 pl-4 pr-3 text-sm sm:pl-0"}>
                          <p
                            className={
                              "font-medium text-gray-900 dark:text-gray-100"
                            }
                          >
                            {name}
                          </p>
                          <p
                            className={`mt-0.5 md:hidden text-gray-500 ${error ? "dark:text-white text-black italic pt-2 pb-2" : ""}`}>
                            {mainProject?.name === name
                              ? "Hovedprosjekt"
                              : explanation
                                ? `${explanation}`
                                : ""}
                            {error ? ` - OBS! ${error}` : ""}
                          </p>
                          <p className={"mt-0.5 text-gray-500 md:hidden"}>
                            {Intl.NumberFormat("nb-NO", {
                              style: "decimal",
                              maximumFractionDigits: 2
                            }).format(hours.worked)}{" "}
                            *{" "}
                            {Intl.NumberFormat("nb-NO", {
                              style: "currency",
                              currency: "NOK",
                              maximumFractionDigits: 2
                            }).format(rate)}
                            <br />
                          </p>
                        </td>
                        <td
                          className={
                            `hidden py-4 px-3 text-sm text-gray-500 md:table-cell ${error ? "dark:text-white text-black italic pt-2 pb-2" : ""} `
                          }
                        >
                          {mainProject?.name === name
                            ? "Hovedprosjekt"
                            : explanation
                              ? `${explanation}`
                              : ""}
                          {error ? ` - OBS! ${error}` : ""}
                        </td>
                        <td className="hidden py-4 px-3 text-right text-sm text-gray-500 md:table-cell">
                          {Intl.NumberFormat("nb-NO", {
                            style: "decimal",
                            maximumFractionDigits: 2
                          }).format(hours.worked)}
                        </td>
                        <td className="hidden py-4 px-3 text-right text-sm text-gray-500 md:table-cell">
                          {Intl.NumberFormat("nb-NO", {
                            style: "currency",
                            currency: "NOK",
                            maximumFractionDigits: 2,
                          }).format(rate)}
                        </td>
                        <td className="py-4 pl-3 pr-4 text-right text-sm text-gray-500 sm:pr-0">
                          {Intl.NumberFormat("nb-NO", {
                            style: "currency",
                            currency: "NOK",
                            maximumFractionDigits: 2,
                          }).format(sum.earned)}
                        </td>
                      </tr>
                    )
                  )
                ) : (
                  <tr>
                    <td
                      className={"font-medium text-gray-900 dark:text-gray-100"}
                    >
                      Ingen timer ført i denne perioden
                    </td>
                    <td
                      className={
                        "hidden py-4 px-3 text-right text-sm text-gray-500 md:table-cell"
                      }
                    ></td>
                    <td className="hidden py-4 px-3 text-right text-sm text-gray-500 md:table-cell"></td>
                    <td className="hidden py-4 px-3 text-right text-sm text-gray-500 md:table-cell"></td>
                    <td className="py-4 pl-3 pr-4 text-right text-sm text-gray-500 sm:pr-0"></td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr>
                  <th
                    scope={"row"}
                    colSpan={4}
                    className={
                      "hidden pl-4 pr-3 pt-4 text-right text-sm font-normal text-gray-500 md:table-cell md:pl-0"
                    }
                  >
                    Subtotal
                  </th>
                  <th
                    scope={"row"}
                    className={
                      "pl-6 pr-3 pt-4 text-left text-sm font-normal text-gray-500 md:hidden"
                    }
                  >
                    Subtotal
                  </th>
                  <td
                    className={
                      "pl-3 pr-4 pt-4 text-right text-sm text-gray-500 md:pr-0"
                    }
                  >
                    {Intl.NumberFormat("nb-NO", {
                      style: "currency",
                      currency: "NOK",
                      maximumFractionDigits: 2,
                    }).format(monthlyPay.invoicedAmount)}
                  </td>
                </tr>
                <tr>
                  <th
                    scope={"row"}
                    colSpan={4}
                    className={
                      "hidden pl-4 pr-3 pt-4 text-right text-sm font-normal text-gray-500 md:table-cell md:pl-0"
                    }
                  >
                    Provisjon
                  </th>
                  <th
                    scope={"row"}
                    className={
                      "pl-6 pr-3 pt-4 text-left text-sm font-normal text-gray-500 md:hidden"
                    }
                  >
                    Provisjon
                  </th>
                  <td
                    className={
                      "pl-3 pr-4 pt-4 text-right text-sm text-gray-500 md:pr-0"
                    }
                  >
                    {Intl.NumberFormat("nb-NO", {
                      style: "currency",
                      currency: "NOK",
                      maximumFractionDigits: 2,
                    }).format(monthlyPay.provision)}
                  </td>
                </tr>
                <tr>
                  <th
                    scope={"row"}
                    colSpan={4}
                    className={
                      "hidden pl-4 pr-3 pt-4 text-right text-sm font-normal text-gray-500 md:table-cell md:pl-0"
                    }
                  >
                    Fastlønn
                  </th>
                  <th
                    scope={"row"}
                    className={
                      "pl-6 pr-3 pt-4 text-left text-sm font-normal text-gray-500 md:hidden"
                    }
                  >
                    Fastlønn
                  </th>
                  <td
                    className={
                      "pl-3 pr-4 pt-4 text-right text-sm text-gray-500 md:pr-0"
                    }
                  >
                    {Intl.NumberFormat("nb-NO", {
                      style: "currency",
                      currency: "NOK",
                      maximumFractionDigits: 2,
                    }).format(monthlyPay.fixedSalary)}
                  </td>
                </tr>
                <tr>
                  <th
                    scope={"row"}
                    colSpan={4}
                    className={
                      "hidden pl-4 pr-3 pt-4 text-right text-sm font-semibold text-gray-900 dark:text-gray-100 md:table-cell md:pl-0"
                    }
                  >
                    Totalt
                  </th>
                  <th
                    scope={"row"}
                    className={
                      "pl-6 pr-3 pt-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 md:hidden"
                    }
                  >
                    Totalt
                  </th>
                  <td
                    className={
                      "pl-3 pr-4 pt-4 text-right text-sm font-semibold text-gray-900 dark:text-gray-100 md:pr-0"
                    }
                  >
                    {Intl.NumberFormat("nb-NO", {
                      style: "currency",
                      currency: "NOK",
                      maximumFractionDigits: 2,
                    }).format(monthlyPay.pay)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="mt-6 flex justify-end">
            <a
              href={`/employees/${employeeId}`}
              className={"text-sm text-gray-500"}
            >
              Endre variabler
            </a>
          </div>
        </div>
        <Form
          method="post"
          className={"flex justify-center px-4 pt-8 sm:px-6 lg:px-8"}
        >
          <button
            className={"flex gap-2 text-gray-500 dark:text-gray-400"}
            type="submit"
          >
            <ArrowPathIcon className={"h-6 w-6"} />
            <p>Force refresh</p>
          </button>
        </Form>
      </main>
    </>
  );
}

function StandardErrorBoundary({ error }: { error: ErrorResponse }) {
  return (
    <div className={"pt-10 text-center"}>
      <h1 className={"text-2xl font-semibold "}>Oops, something went wrong</h1>
      <p className={"text-red-500"}>{error.data.message}</p>
      <div className={"overflow-auto"}>
        <pre
          className={
            "m-4 inline-block rounded bg-gray-100 p-2 text-left text-sm dark:bg-gray-900"
          }
        >
          <code>{error.data.stack}</code>
        </pre>
        <button
          className={"ml-2 rounded bg-gray-100 p-2 text-sm dark:bg-gray-900"}
          onClick={() => {
            navigator.clipboard.writeText(
              JSON.stringify({ ...error, stack: error.data.stack }, null, 2)
            );
          }}
        >
          Copy stack
        </button>
        <a
          href={`mailto:henry.sjoen@miles.no?subject=Error in timesheet&body=${encodeURIComponent(
            JSON.stringify({ ...error, stack: error.data.stack }, null, 2)
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

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return <StandardErrorBoundary error={error} />;
  }

  return <p>Something went wrong: {JSON.stringify(error)}</p>;
}
