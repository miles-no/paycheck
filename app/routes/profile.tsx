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
  XledgerInfoSection,
  EmployeeNumber,
  XledgerId,
  XledgerEmail,
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
    user?.employeeDetails?.xledgerId as string,
  );
  const employee = xledgerData.data?.payrollRates?.edges?.[0]?.node?.employee;
  const yearlyFixedSalary =
    xledgerData.data?.payrollRates?.edges?.[0]?.node?.rate;

  return json({
    employee: {
      xledgerId: user?.employeeDetails?.xledgerId,
      code: employee?.code,
      description: employee?.description,
      email: employee?.email,
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
        <h1 className={"text-2xl font-bold"}>Hei {user?.name}!</h1>

        <Divider />
        <div className="flex lg:flex-row flex-col justify-between gap-8">
          <RoleSection role={user?.role.name} />
          <EmployeeNumber code={employee?.code} />
          <XledgerId employee={{ xledgerId: employee.xledgerId || "" }} />
        </div>
        <Divider />
        <div className="flex lg:flex-row flex-col justify-between gap-8 items-stretch h-full">
          <XledgerEmail employee={{ XledgerEmail: employee.email || "" }} />
          <ExtraVariablesSection
            employee={{
              selfCostFactor: user?.employeeDetails?.selfCostFactor || 0,
              xledgerId: user?.employeeDetails?.xledgerId || "",
              provisionPercentage:
                user?.employeeDetails?.provisionPercentage || 0,
              yearlyFixedSalary: employee?.yearlyFixedSalary || 0,
            }}
            isSubmitting={false}
            disabled
          />
        </div>
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
