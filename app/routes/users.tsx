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
      <table>
        <thead>
          <tr>
            <th>Email</th>
            <th>Role</th>
            <th>dbID</th>
            <th>Xledger ID</th>
            <th>Edit</th>
            <th>Delete</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const { id, email, employeeDetails, role } = user;
            return (
              <tr key={id}>
                <td>{email}</td>
                <td>{role.name}</td>
                <td>{id}</td>
                <td>{employeeDetails?.xledgerId}</td>
                <td>
                  <a href={`/users/${id}/edit`}>Edit</a>
                </td>
                <td>
                  <a href={`/users/${id}/delete`}>Delete</a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </main>
  );
}
