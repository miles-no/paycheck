import type { EmployeeDetails, Role, User } from ".prisma/client";
import { Disclosure, Menu, Transition } from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { Fragment, useState } from "react";
import { useLocation } from "react-router";
import { Role as RoleEnum } from "~/enums/role";
import PoweredBy from "../assets/PoweredBy.js";
import CommandPalette from "~/components/command-palette";
import { getEmployees } from "~/services/getEmployees.server";
import React, { useEffect } from "react";
export interface Command {
  id: string;
  name: string;
  url: string;
  icon: string;
}

export const pages: Command[] = [
  { id: "home", name: "Hjem", url: "/", icon: "home" },
  { id: "logout", name: "Logg ut", url: "/logout", icon: "logout" },
  { id: "profile", name: "Profil", url: "/profile", icon: "user" },
];
export const adminPages: Command[] = [
  { id: "overview", name: "Oversikt", url: "/overview", icon: "chart-bar" },
  { id: "employees", name: "Ansatte", url: "/employees", icon: "users" },
  {
    id: "report",
    name: "Last ned rapport av forrige måned",
    url: "/report",
    icon: "document-report",
  },
];

const userNavigation = [
  { name: "Min profil", href: "/profile" },
  { name: "Logg ut", href: "/logout" },
];

export default function Navbar(props: {
  user?: User & { role: Role; employeeDetails: EmployeeDetails | null };
}) {
  const location = useLocation();
  const isAdmin = props.user?.role?.name === RoleEnum.admin;

  const [commands, setCommands] = useState<{
    commands: Command[];
    metaKey: string;
  }>({ commands: [], metaKey: "" });

  useEffect(() => {
    const searchSomething = async () => {
      const data = await searchStuff();
      setCommands(data);
    };

    searchSomething();
  }, []);

  const searchStuff = async (): Promise<{
    commands: Command[];
    metaKey: string;
  }> => {
    const metaKey = navigator.userAgent.includes("Mac") ? "⌘" : "ctrl";
    const user = props?.user;
    if (!user) return { commands: [], metaKey };

    // todo: adjust commands based on the logged in user
    let commands: Command[] = [...pages];

    if (user.role.name === "admin" || user.role.name === "manager") {
      const employees = await getEmployees();
      const year = new Date().getFullYear();
      const month = new Date().getMonth() + 1;
      commands = [
        ...pages,
        ...adminPages,
        ...employees.map((employee) => ({
          id: `timesheet-${employee.dbId}`,
          name: `Timeliste - ${employee.description}`,
          url: `/employees/${employee.dbId}/timesheets/${year}/${month}`,
          icon: "clock",
        })),
        ...employees.map((employee) => ({
          id: `employee-${employee.dbId}`,
          name: `Profil - ${employee.description}`,
          url: `/employees/${employee.dbId}`,
          icon: "user",
        })),
      ];
    }
    return {
      commands: commands,
      metaKey,
    };
  };

  const navigation = [
    {
      name: "Timeliste",
      href: `/employees/${props.user?.employeeDetails
        ?.xledgerId}/timesheets/${new Date().getFullYear()}/${
        new Date().getMonth() + 1
      }`,
      //   Todo: make the link highlight work for sub-pages as well
    },
    { name: "Oversikt", href: "/overview" },
    { name: "Ansatte", href: "/employees" },
    { name: "Brukere", href: "/users" },
    ...(isAdmin
      ? [
          { name: "Oversikt", href: "/overview" },
          { name: "Ansatte", href: "/employees" },
          { name: "Brukere", href: "/users" },
        ]
      : []),
  ];
  return (
    <div className="bg-white h-100">
      <Disclosure
        as="header"
        className=" bg-opacity-30 shadow dark:bg-black dark:bg-opacity-90"
      >
        {({ open }) => (
          <>
            <div className="mx-auto max-w-7xl px-2 sm:px-4 lg:divide-y lg:divide-gray-700 lg:px-8">
              <div className="relative flex h-16 justify-between">
                <div className="relative z-10 flex px-2 lg:px-0  divide-x-2 divide-black py-2 gap-6">
                  <a
                    href={"/profile"}
                    className="flex flex-shrink-0 items-center"
                  >
                    <PoweredBy />
                  </a>
                  <nav
                    className=" lg:flex lg:space-x-8 lg:py-2 px-6 flex items-center"
                    aria-label="Global"
                  >
                    {navigation.map((item) => (
                      <a
                        key={item.name}
                        href={item.href}
                        className={`${
                          location.pathname === item.href
                            ? "border-b-2 border-[#bb413d] bg-opacity-50 font-bold text-black dark:border-gray-700 dark:text-gray-300"
                            : "border-b-2 border-transparent text-black font-medium inline-flex items-center text-sm "
                        }  py-2`}
                        aria-current={
                          location.pathname === item.href ? "page" : undefined
                        }
                      >
                        {item.name}
                      </a>
                    ))}
                    <div>
                      <CommandPalette
                        commands={commands.commands}
                        metaKey={commands.metaKey}
                      />
                    </div>
                  </nav>
                </div>

                <div className="relative z-10 flex items-center lg:hidden">
                  {/* Mobile menu button */}
                  <Disclosure.Button className="inline-flex items-center justify-center rounded-md border border-transparent p-2 text-gray-400 hover:border-white hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                    <span className="sr-only">Open menu</span>
                    {open ? (
                      <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                    ) : (
                      <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                    )}
                  </Disclosure.Button>
                </div>
                <div className="hidden lg:relative lg:z-10 lg:ml-4 lg:flex lg:items-center flex-col justify-center gap-2">
                  {/* Profile dropdown */}
                  <Menu as="div" className="relative ml-4 flex-shrink-0">
                    <div>
                      <Menu.Button className="flex rounded-full bg-gray-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800">
                        <span className="sr-only">Open user menu</span>
                        <img
                          className="h-8 w-8 rounded-full"
                          src={props.user?.picture}
                          alt=""
                        />
                      </Menu.Button>
                    </div>

                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                        {userNavigation.map((item) => (
                          <Menu.Item key={item.name}>
                            {({ active }) => (
                              <a
                                href={item.href}
                                className={`${
                                  active ? "bg-gray-100" : ""
                                } block py-2 px-4 text-sm text-gray-700`}
                              >
                                {item.name}
                              </a>
                            )}
                          </Menu.Item>
                        ))}
                      </Menu.Items>
                    </Transition>
                  </Menu>
                  <div className="text-[#B72926] text-xs">
                    <p>{props?.user?.name}</p>
                  </div>
                </div>
              </div>
            </div>

            <Disclosure.Panel
              as="nav"
              className="lg:hidden"
              aria-label="Global"
            >
              <div className="space-y-1 px-2 pt-2 pb-3">
                {navigation.map((item) => (
                  <Disclosure.Button
                    key={item.name}
                    as="a"
                    href={item.href}
                    className={`${
                      location.pathname === item.href
                        ? "bg-gray-900 text-white"
                        : "text-gray-500"
                    } block rounded-md py-2 px-3 text-base font-medium`}
                    aria-current={
                      location.pathname === item.href ? "page" : undefined
                    }
                  >
                    {item.name}
                  </Disclosure.Button>
                ))}
              </div>
              <div className="border-t border-gray-700 pt-4 pb-3">
                <div className="flex items-center px-4">
                  <div className="flex-shrink-0">
                    <img
                      className="h-10 w-10 rounded-full"
                      src={props.user?.picture}
                      alt=""
                    />
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-gray-500 dark:text-gray-400">
                      {props.user?.name}
                    </div>
                    <div className="text-sm font-medium text-gray-400 dark:text-gray-500">
                      {props.user?.email}
                    </div>
                  </div>
                </div>
                <div className="mt-3 space-y-1 px-2">
                  {[{ name: "Logg ut", href: "/logout" }].map((item) => (
                    <Disclosure.Button
                      key={item.name}
                      as="a"
                      href={item.href}
                      className="block rounded-md py-2 px-3 text-base font-medium text-gray-500"
                    >
                      {item.name}
                    </Disclosure.Button>
                  ))}
                </div>
              </div>
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>
    </div>
  );
}
