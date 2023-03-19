import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { prisma } from "~/db.server";
import { useLoaderData } from "@remix-run/react";

export async function loader({ params, context, request }: LoaderArgs) {
  return json({
    users: await prisma.user.findMany({
      include: {
        role: true,
        employeeDetails: true,
      },
    }),
  });
}

export default function UsersPage() {
  const { users } = useLoaderData<typeof loader>();

  return (
    <main className={"container mx-auto px-4"}>
      <h1>Users</h1>
      <pre>
        <code>{JSON.stringify(users, null, 2)}</code>
      </pre>
      <table className={"table-auto"}>
        <thead>
          <tr>
            <th className={"px-4 py-2"}>Name</th>
            <th className={"px-4 py-2"}>Email</th>
            <th className={"px-4 py-2"}>Role</th>
            <th className={"px-4 py-2"}>Employee Details</th>
            <th className={"px-4 py-2"}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td className={"border px-4 py-2"}>{user.name}</td>
              <td className={"border px-4 py-2"}>{user.email}</td>
              <td className={"border px-4 py-2"}>{user.role.name}</td>
              <td className={"border px-4 py-2"}>
                {user.employeeDetails ? (
                  <pre>
                    <code>{JSON.stringify(user.employeeDetails, null, 2)}</code>
                  </pre>
                ) : (
                  "No employee details"
                )}
              </td>
              <td className={"border px-4 py-2"}>
                <a href={`/users/${user.id}`}>Edit</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
