import { Combobox, Dialog, Transition } from "@headlessui/react";
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import {
  ArrowLeftOnRectangleIcon,
  ChartBarIcon,
  ClockIcon,
  HomeIcon,
  UserCircleIcon,
  UsersIcon
} from "@heroicons/react/24/outline";
import { Fragment, useEffect, useState } from "react";
import type { Command } from "~/root";

function classNames({ classes }: { classes: any[] }) {
  return classes.filter(Boolean).join(" ");
}

function getIcon(icon: string) {
  switch (icon) {
    case "user":
      return (
        <UserCircleIcon
          className="h-5 w-5 text-gray-400 dark:text-white"
          aria-hidden="true"
        />
      );
    case "home":
      return (
        <HomeIcon
          className="h-5 w-5 text-gray-400 dark:text-white"
          aria-hidden="true"
        />
      );
    case "chart-bar":
      return (
        <ChartBarIcon
          className="h-5 w-5 text-gray-400 dark:text-white"
          aria-hidden="true"
        />
      );
    case "users":
      return (
        <UsersIcon
          className="h-5 w-5 text-gray-400 dark:text-white"
          aria-hidden="true"
        />
      );
    case "logout":
      return (
        <ArrowLeftOnRectangleIcon
          className="h-5 w-5 text-gray-400 dark:text-white"
          aria-hidden="true"
        />
      );
    case "clock":
      return (
        <ClockIcon
          className="h-5 w-5 text-gray-400 dark:text-white"
          aria-hidden="true"
        />
      );
  }
}

export default function CommandPalette(props: {
  commands: Command[];
  metaKey: string;
}) {
  const { commands } = props;
  const [query, setQuery] = useState("");

  const [open, setOpen] = useState(false);
  const filteredPeople =
    query === ""
      ? []
      : commands.filter((person) => {
        return person.name.toLowerCase().includes(query.toLowerCase());
      });

  //Keyboard shortcut to open the command palette (cmd + k)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div>
      <Transition.Root
        show={open}
        as={Fragment}
        afterLeave={() => setQuery("")}
        appear
      >
        <Dialog as="div" className="relative z-10" onClose={setOpen}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="transition-opacity fixed inset-0 bg-gray-900 bg-opacity-50" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto p-4 sm:p-6 md:p-20">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="transition-all mx-auto max-w-xl transform divide-y divide-gray-100 overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 dark:border dark:bg-black">
                <Combobox
                  onChange={(command: Command) => {
                    return (window.location.href = command.url);
                  }}
                >
                  <div className="relative">
                    <MagnifyingGlassIcon
                      className="pointer-events-none absolute top-3.5 left-4 h-5 w-5 text-gray-400 dark:text-white"
                      aria-hidden="true"
                    />
                    <Combobox.Input
                      className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-gray-900 placeholder:text-gray-400 focus:ring-0 dark:text-white sm:text-sm"
                      placeholder="Søk..."
                      onChange={(event) => setQuery(event.target.value)}
                    />
                  </div>

                  {filteredPeople.length > 0 && (
                    <Combobox.Options
                      static
                      className="max-h-72 scroll-py-2 overflow-y-auto py-2 text-sm text-gray-800 dark:text-white"
                    >
                      {filteredPeople.map((command) => (
                        <Combobox.Option
                          key={command.id}
                          value={command}
                          className={({ active }) =>
                            classNames({
                              classes: [
                                "cursor-default select-none px-4 py-2",
                                active &&
                                "bg-gray-200 bg-opacity-90 dark:bg-gray-700",
                                "flex gap-2",
                                "dark:text-white",
                              ],
                            })
                          }
                        >
                          {getIcon(command.icon)}
                          {command.name}
                        </Combobox.Option>
                      ))}
                    </Combobox.Options>
                  )}

                  {query !== "" && filteredPeople.length === 0 && (
                    <p className="p-4 text-sm text-gray-500 dark:text-white">
                      No actions found for "{query}"
                    </p>
                  )}
                </Combobox>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
      {/*  Let's circle search-icon button down right to open the command palette*/}
      <span className={`${open && "hidden"}`}>
        <button
          type="button"
          className={`searchButton hideInPrint fixed bottom-12 right-12 flex rounded-full border bg-white bg-opacity-90 p-4 shadow-lg dark:bg-black `}
          onClick={() => setOpen(true)}
        >
          <span className="sr-only">Open command palette</span>
          <MagnifyingGlassIcon
            className="h-6 w-6 text-gray-400 dark:text-white"
            aria-hidden="true"
          />
          <span className="ml-2 hidden group-hover:inline-block">Søk</span>
          <span className={"ml-2 hidden pl-3 group-hover:inline-block"}>
            <kbd>{props.metaKey}</kbd> + <kbd>K</kbd>
          </span>
        </button>
      </span>
    </div>
  );
}
