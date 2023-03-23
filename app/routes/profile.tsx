import type { EmployeeDetails, Role, User } from ".prisma/client";
import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import type { GoogleProfile } from "remix-auth-google";
import Navbar from "~/components/navbar";
import {
  Divider,
  ExtraVariablesSection,
  getXledgerEmployeeData,
  RoleSection,
  XledgerInfoSection
} from "~/routes/employees/$employeeId";
import { authenticator } from "~/services/auth.server";
import { requireUser } from "~/services/user.server";

export async function getOptionalGoogleUser(request: Request) {
  return (await authenticator.isAuthenticated(request)) as GoogleProfile | null;
}

export async function loader({ params, context, request }: LoaderArgs) {
  const user = await requireUser(request);

  // Get employee data from xledger
  const xledgerData = await getXledgerEmployeeData(
    user?.employeeDetails?.xledgerId as string
  );
  const { employee, rate: yearlyFixedSalary } =
    xledgerData.data?.payrollRates?.edges?.[0]?.node;
  const { code, description, email } = employee;

  return json({
    employee: {
      xledgerId: user?.employeeDetails?.xledgerId,
      code,
      description,
      email,
      yearlyFixedSalary,
    },
    user,
  });
}

export default function Dashboard() {
  const { user, employee } = useLoaderData<typeof loader>();
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
        <h1 className={"text-2xl font-bold"}>Hei, {user?.name}!</h1>
        <p className={"text-gray-500"}>
          Her kan du se din profil. Dersom noe er feil, ta kontakt med din
          administrator.
        </p>
        <Divider />
        <RoleSection role={user?.role.name} />
        <Divider />
        <XledgerInfoSection
          employee={{
            xledgerId: employee.xledgerId || "",
            code: employee.code,
            description: employee.description,
            email: employee.email,
            yearlyFixedSalary: employee.yearlyFixedSalary,
          }}
        />
        <Divider />
        <ExtraVariablesSection
          employee={{
            selfCostFactor: user?.employeeDetails?.selfCostFactor || 0,
            xledgerId: user?.employeeDetails?.xledgerId || "",
            provisionPercentage:
              user?.employeeDetails?.provisionPercentage || 0,
          }}
          isSubmitting={false}
          disabled
        />
        <div className={"flex justify-end"}>
          <a
            href={`/employees/${user?.employeeDetails?.xledgerId}`}
            className={"ml-4 p-2  text-sm text-gray-500"}
          >
            Endre variabler
          </a>
        </div>
      </main>
    </>
  );
}
