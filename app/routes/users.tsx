import { EmployeeDetails, Role, User } from ".prisma/client";
import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import Navbar from "~/components/navbar";
import { prisma } from "~/db.server";
import { optionalUser } from "~/services/user.server";

export async function loader({ params, context, request }: LoaderArgs) {
  const user = await optionalUser(request);
  return json({
    user,
    users: await prisma.user.findMany({
      include: {
        role: true,
        employeeDetails: true,
      },
    }),
  });
}

function getRolePill(person: { role: { name: string } }) {
  switch (person.role.name) {
    case "admin":
      return (
        <span
          className={
            "inline-flex rounded-full bg-red-100 px-2 text-xs font-semibold leading-5 text-red-800"
          }
        >
          Admin
        </span>
      );
    case "employee":
      return (
        <span
          className={
            "inline-flex rounded-full bg-blue-100 px-2 text-xs font-semibold leading-5 text-blue-800"
          }
        >
          Ansatt
        </span>
      );
    case "manager":
      return (
        <span
          className={
            "inline-flex rounded-full bg-yellow-100 px-2 text-xs font-semibold leading-5 text-yellow-800"
          }
        >
          Leder
        </span>
      );
    default:
      return (
        <span
          className={
            "inline-flex rounded-full bg-gray-100 px-2 text-xs font-semibold leading-5 text-gray-800"
          }
        >
          {person.role.name}
        </span>
      );
  }
}

export default function UsersPage() {
  const { users, user } = useLoaderData<typeof loader>();
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

      <main className={"mx-auto flex max-w-7xl flex-col  p-10"}>
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-base font-semibold leading-6 text-gray-900 dark:text-white">
              Users
            </h1>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
              Liste over alle ansatte som har logget inn på systemet, og deres
              roller.
            </p>
          </div>
        </div>
        <div className="mt-8 flow-root">
          <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th
                      scope="col"
                      className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-0"
                    >
                      Name
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                    >
                      Xledger ID
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                    >
                      Role
                    </th>
                    <th
                      scope="col"
                      className="relative py-3.5 pl-3 pr-4 sm:pr-0"
                    >
                      <span className="sr-only">Edit</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((person) => (
                    <tr key={person.email}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-0">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <img
                              className="h-10 w-10 rounded-full"
                              src={person.picture}
                              alt=""
                            />
                          </div>
                          <div className="ml-4">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {person.name}
                            </div>
                            <div className="text-gray-500 dark:text-gray-300">
                              {person.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300">
                        <div className="text-gray-900 dark:text-white">
                          {person.employeeDetails?.xledgerId ?? "N/A"}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300">
                        {getRolePill(person)}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                        <a
                          href={`/employees/${person.employeeDetails?.xledgerId}`}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                          Edit<span className="sr-only">, {person.name}</span>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
