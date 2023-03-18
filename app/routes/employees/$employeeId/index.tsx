import type { ActionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";

import type { LoaderFunction } from "@remix-run/router";
import {
  Form,
  useActionData,
  useLoaderData,
  useTransition,
} from "@remix-run/react";
import React, { Fragment, useEffect, useState } from "react";
import {
  getEmployeeDetailsByXledgerId,
  upsertEmployeeDetails,
} from "~/models/employeeDetails.server";
import { requireUser } from "~/session.server";
import { Role } from "../../../../prisma/seed";
import { isAdminOrManager } from "~/utils/isAdminOrManager";
import {
  CheckCircleIcon,
  XCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Transition } from "@headlessui/react";
import { cache } from "~/cache";

interface xledgerEmployeeResponse {
  data: {
    payrollRates: {
      edges: {
        node: {
          employee: {
            description: string;
            email: string;
            code: string;
          };
          rate: number;
        };
      }[];
    };
  };
}

export async function getXledgerEmployeeData(employeeId: string) {
  // check cache first
  const cacheKey = `xledger-employee-${employeeId}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey) as typeof json;

  console.log("Fetching employee data from xledger");

  const response = await fetch(`${process.env.XLEDGER_GRAPHQL_URL}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `token ${process.env.XLEDGER_TOKEN}`,
    },
    body: JSON.stringify({
      query: `{
    payrollRates(first:1,filter:{
      employeeDbId:${employeeId}
    }) {
    edges{
      node{
        employee{
          description
          email
          code
        }
        rate
        }
      }
    }
  }`,
    }),
  });

  const json: xledgerEmployeeResponse = await response.json();

  // Add to cache
  cache.set(cacheKey, json);

  return json;
}

export const loader: LoaderFunction = async ({ params, context, request }) => {
  const { employeeId } = params;

  // Redirect to log in if the user is not logged in
  const user = await requireUser(request);

  // If no role, redirect to login
  const roleName = user?.role.name as Role;
  if (![Role.employee, Role.admin, Role.manager].includes(roleName)) {
    return redirect("/403");
  }

  // If user is not an admin or manager, and the employeeId in the url does not match the logged-in user's xledgerId
  const employeeDetails = await getEmployeeDetailsByXledgerId(
    employeeId as string
  );
  if (
    // If user is not an admin or manager, and the employeeId in the url does not match the logged-in user's xledgerId
    ![Role.admin, Role.manager].includes(roleName) &&
    employeeDetails?.xledgerId !== employeeId
  ) {
    return redirect("/402");
  }

  // Get employee data from xledger
  const xledgerData = await getXledgerEmployeeData(employeeId as string);
  const { employee, rate: yearlyFixedSalary } =
    xledgerData.data?.payrollRates?.edges?.[0]?.node;
  const { code, description, email } = employee;

  return json({
    employee: {
      xledgerId: employeeId,
      code,
      description,
      email,
      yearlyFixedSalary,
      ...employeeDetails,
    },
    isAdminOrManager: isAdminOrManager(roleName),
  });
};

export const action = async ({ request }: ActionArgs) => {
  // Only admins and managers can modify employee details
  const user = await requireUser(request);
  if (!isAdminOrManager(user?.role.name as Role)) {
    return redirect("/403");
  }

  const formData = await request.formData();
  const xledgerId = formData.get("xledgerId") as string;
  const provisionPercentage =
    parseFloat(formData.get("provision-percentage") as string) / 100;
  const selfCostFactor = parseFloat(formData.get("self-cost-factor") as string);

  console.log({ xledgerId, provisionPercentage, selfCostFactor });

  if (isNaN(provisionPercentage) || isNaN(selfCostFactor)) {
    return json({
      error:
        "Something went wrong. There was an error saving your data. Please try again.",
    });
  }

  const res = await upsertEmployeeDetails({
    xledgerId,
    provisionPercentage,
    selfCostFactor,
  });

  const success = !!res?.id;
  if (!success) {
    return json({
      error:
        "Something went wrong. There was an error saving your data. Please try again.",
    });
  }
  return json({ success: true });
};

export default function EmployeeEditPage() {
  const { employee, isAdminOrManager } = useLoaderData<typeof loader>();
  const actionData = useActionData();
  const hasSucceeded = !!actionData?.success;
  const hasFailed = !!actionData?.error;
  const isSubmitting = useTransition().state === "submitting";
  const [show, setShow] = useState(hasSucceeded || hasFailed);
  useEffect(() => {
    if (hasSucceeded || hasFailed) {
      setShow(true);
      setTimeout(() => {
        setShow(false);
      }, 3000);
    }
  }, [hasSucceeded, hasFailed, isSubmitting]);

  return (
    <main className={"mx-auto flex max-w-7xl flex-col p-10"}>
      <XledgerInfoSection employee={employee} />
      <Divider />
      <ExtraVariablesSection
        employee={employee}
        isSubmitting={isSubmitting}
        disabled={!isAdminOrManager}
      />
      <NotificationContainer
        hasFailed={hasFailed}
        hasSucceeded={hasSucceeded}
        setShow={setShow}
        show={show}
      />
    </main>
  );
}

function ExplanationHeader(props: { title: string; description: string }) {
  const { title, description } = props;
  return (
    <div className="md:col-span-1">
      <div className="px-4 sm:px-0">
        <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-gray-100">
          {title}
        </h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          {description}
        </p>
      </div>
    </div>
  );
}

function XledgerInfoSection(props: {
  employee: {
    xledgerId: number;
    code: string;
    description: string;
    email: string;
    yearlyFixedSalary: number;
  };
}) {
  const { employee } = props;
  return (
    <div className="md:grid md:grid-cols-3 md:gap-6">
      <ExplanationHeader
        title="Informasjon fra xledger"
        description="Gå til xledger for å endre denne informasjonen."
      />
      <div className="mt-5 md:col-span-2 md:mt-0">
        <div className="overflow-hidden shadow sm:rounded-md">
          <div className="bg-white bg-opacity-90 px-4 py-5 dark:bg-opacity-10 sm:p-6">
            <div className="grid grid-cols-6 gap-6">
              {/*NAVN*/}
              <div className="col-span-6 sm:col-span-3">
                <label className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">
                  Navn
                  <p className={"text-xl text-gray-900 dark:text-gray-100"}>
                    {employee?.description}
                  </p>
                </label>
              </div>
              {/*EPOST*/}
              <div className="col-span-6 sm:col-span-3">
                <label className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">
                  Epost
                  <p className={"text-xl text-gray-900 dark:text-gray-100"}>
                    {employee?.email}
                  </p>
                </label>
              </div>
              {/*ANSATTNUMMER*/}
              <div className="col-span-3 sm:col-span-3">
                <label className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">
                  Ansattnummer
                  <p
                    className={
                      "hashStyle text-xl text-gray-900 dark:text-gray-100"
                    }
                  >
                    {employee?.code}
                  </p>
                </label>
              </div>
              {/*xledgerid*/}
              <div className="col-span-3 sm:col-span-3">
                <label className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">
                  Xledger ID
                  <p
                    className={
                      "hashStyle text-xl text-gray-900 dark:text-gray-100"
                    }
                  >
                    {employee?.xledgerId}
                  </p>
                </label>
              </div>
              {/*ÅRSINNTEKT*/}
              <div className="col-span-3 sm:col-span-3">
                <label className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">
                  Årsinntekt Fastlønn
                  <p className={"text-xl text-gray-900 dark:text-gray-100"}>
                    {Intl.NumberFormat("no-NO", {
                      style: "currency",
                      currency: "NOK",
                    }).format(employee.yearlyFixedSalary)}
                  </p>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Divider() {
  return (
    <div className="py-5 sm:py-10" aria-hidden="true">
      <div className="hidden border-t border-gray-200 dark:border-gray-700 sm:block" />
    </div>
  );
}

function ExtraVariablesSection(props: {
  disabled?: boolean;
  employee: {
    selfCostFactor: number;
    xledgerId: string;
    provisionPercentage: number;
  };
  isSubmitting: boolean;
}) {
  const { employee, isSubmitting, disabled } = props;
  return (
    <div className="md:grid md:grid-cols-3 md:gap-6">
      <ExplanationHeader
        title="Ekstra informasjon"
        description="Dette er individuelle variabler som er lagt inn i systemet for å
        kunne beregne lønn, og knytte en bruker opp mot rett data. Denne er per dags dato ikke tilgengelig i
        xledger."
      />
      <div className="mt-5 md:col-span-2 md:mt-0">
        <Form method={"post"}>
          <input
            type="text"
            className={"hidden"} // hidden input to get the id of the employee in the form
            defaultValue={employee.xledgerId}
            id={"xledgerId"}
            name={"xledgerId"}
          />
          <div className="overflow-hidden shadow sm:rounded-md">
            <div className="bg-white px-4 py-5 dark:bg-opacity-10 sm:p-6">
              {/**/}
              <div className="grid grid-cols-6 gap-6">
                <div className="col-span-6 sm:col-span-3">
                  <label
                    htmlFor="provision-percentage"
                    className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
                  >
                    Provisjonsprosent
                  </label>
                  {disabled ? (
                    <p className="align-baseline text-4xl font-semibold text-gray-900 dark:text-gray-100">
                      {employee?.provisionPercentage * 100}{" "}
                      <span
                        className={
                          "align-baseline text-2xl text-gray-500 dark:text-gray-400"
                        }
                      >
                        %
                      </span>
                    </p>
                  ) : (
                    <input
                      type="number"
                      name="provision-percentage"
                      id="provision-percentage"
                      autoComplete="provision-percentage"
                      className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-600 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-black dark:bg-opacity-10 dark:text-gray-100 dark:placeholder-gray-400 dark:ring-gray-600 dark:focus:ring-gray-400 sm:text-sm sm:leading-6"
                      defaultValue={employee?.provisionPercentage * 100}
                      disabled={disabled}
                      required
                      min={0}
                      max={100}
                    />
                  )}
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <label
                    htmlFor="self-cost-factor"
                    className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
                  >
                    Selvkostfaktor
                  </label>
                  {disabled ? (
                    <p
                      className={
                        "align-baseline text-4xl font-semibold text-gray-900 dark:text-gray-100"
                      }
                    >
                      {employee?.selfCostFactor}
                    </p>
                  ) : (
                    <input
                      type="number"
                      name="self-cost-factor"
                      id="self-cost-factor"
                      step={0.01}
                      autoComplete="self-cost-factor"
                      className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-600 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-black dark:bg-opacity-10 dark:text-gray-100 dark:placeholder-gray-400 dark:ring-gray-600 dark:focus:ring-gray-400 sm:text-sm sm:leading-6"
                      defaultValue={employee?.selfCostFactor}
                      disabled={disabled}
                      required
                      min={0}
                      max={100}
                    />
                  )}
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 text-right dark:bg-gray-300 dark:bg-opacity-10 sm:px-6">
              {disabled ? (
                <p className="p-4 text-right text-sm font-light italic text-gray-500 dark:text-gray-400">
                  Kun en administrator kan endre disse variablene.
                </p>
              ) : (
                <button
                  type="submit"
                  className="inline-flex justify-center rounded-md border border-transparent bg-gray-700 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-gray-800 hover:outline focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isSubmitting || disabled}
                >
                  Lagre
                </button>
              )}
            </div>
          </div>
        </Form>
      </div>
    </div>
  );
}

function NotificationContainer(props: {
  show: boolean;
  hasSucceeded: boolean;
  hasFailed: boolean;
  setShow: (value: ((prevState: boolean) => boolean) | boolean) => void;
}) {
  const { show, hasSucceeded, hasFailed, setShow } = props;
  return (
    <div
      aria-live="assertive"
      className="pointer-events-none fixed inset-0 flex items-end px-4 py-6 sm:items-start sm:p-6"
    >
      <div className="flex w-full flex-col items-center space-y-4 sm:items-end">
        {/* Notification panel, dynamically insert this into the live region when it needs to be displayed */}
        <Transition
          show={show}
          as={Fragment}
          enter="transform ease-out duration-300 transition"
          enterFrom="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
          enterTo="translate-y-0 opacity-100 sm:translate-x-0"
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5">
            <div className="p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {hasSucceeded && (
                    <CheckCircleIcon
                      className="h-6 w-6 text-green-400"
                      aria-hidden="true"
                    />
                  )}
                  {hasFailed && (
                    <XCircleIcon
                      className="h-6 w-6 text-red-400"
                      aria-hidden="true"
                    />
                  )}
                </div>
                <div className="ml-3 w-0 flex-1 pt-0.5">
                  <p className="text-sm font-medium text-gray-900">
                    {hasSucceeded && "Saved"}
                    {hasFailed && "Failed to save"}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {hasSucceeded && "Employee saved"}
                    {hasFailed && "Something went wrong"}
                  </p>
                </div>
                <div className="ml-4 flex flex-shrink-0">
                  <button
                    type="button"
                    className="inline-flex rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={() => {
                      setShow(false);
                    }}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  );
}
