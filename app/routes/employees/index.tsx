import type { EmployeeDetails, Role, User } from ".prisma/client";
import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import Navbar from "~/components/navbar";
import { getEmployees } from "~/services/getEmployees.server";
import { requireAdminOrManager } from "~/services/user.server";

export async function loader({ params, context, request }: LoaderArgs) {
  const user = await requireAdminOrManager(request);
  return json({ employees: await getEmployees(), user });
}

export default function IndexPage() {
  const { employees, user } = useLoaderData<typeof loader>();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
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
          <div className="sm:flex-auto">
            <h1 className="text-base font-semibold leading-6 text-gray-900 dark:text-white">
              Ansatte ({employees.length})
            </h1>
            <p className={"mt-2 text-sm text-gray-700 dark:text-gray-300"}>
              Velg en ansatt for å se timelister
            </p>
          </div>
        </div>
        <div className="mt-8">
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {employees.map((employee) => (
              <a
                href={`/employees/${employee.dbId}/timesheets/${year}/${month}`}
                key={employee.dbId}
                className="overflow-hidden bg-white bg-opacity-50 shadow dark:border dark:border-gray-500 dark:bg-black dark:bg-opacity-40 sm:rounded-lg"
              >
                <div className="flex justify-between p-2 sm:p-5">
                  <span>
                    <h3 className="text-lg font-medium leading-6 text-gray-900 blur dark:text-white">
                      {employee.description}
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                      {employee.positionValue?.description}
                    </p>
                  </span>
                  <span className=" hashStyle mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
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
