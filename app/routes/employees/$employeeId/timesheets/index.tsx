import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { LoaderFunction } from "@remix-run/router";

export const loader: LoaderFunction = async ({ params, context, request }) => {
  const { employeeId } = params;

  // Todo: Only the employee with id: employeeId, a manager or admin should be able to see this page


  return json({ message: `Hello from employee-timesheets-page for employee with id: ${employeeId}` });
};


export default function IndexPage() {
  const { message } = useLoaderData();

  return (
    <div>
      <h1>Employee-timesheets-page</h1>
      <p>{message}</p>
      <p>Todo: Show a list of years</p>
    </div>
  );
}
