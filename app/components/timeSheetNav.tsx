import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
} from "@heroicons/react/20/solid";
import { getNextMonthLink } from "~/utils/getNextMonthLink";
import { getPreviousMonthLink } from "~/utils/getPreviousMonthLink";
import { useState } from "react";

export function TimeSheetNav(props: {
  employeeId: string | undefined;
  year: string | undefined;
  month: string | undefined;
}) {
  const { employeeId, year, month } = props;

  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(month);

  const setMonth = (month: string) => {
    setSelectedMonth(month);
  }
  console.log("asdf", month)
  return (
    <div className="flex flex-col justify-center items-center">
      <nav className="hideInPrint m-4 flex justify-center">
        <div>
          <a
            href={`/employees/${employeeId}/timesheets/${getPreviousMonthLink(
              year,
              month,
            )}`}
            className=" inline-flex items-center border-t-2 border-transparent pt-4 pr-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
          >
            <ChevronLeftIcon
              className="mr-3 h-5 w-5 text-gray-400"
              aria-hidden="true"
            />
          </a>
        </div>
        <button onClick={() => setShowCalendar(!showCalendar)}>
          <div className="flex">
            <p
              className={
                "mt-4 text-center font-mono text-xl capitalize color text-[#FF303B]"
              }
            >
              {new Date(Number(year), Number(month) - 1).toLocaleString(
                "nb-NO",
                {
                  month: "long",
                },
              )}{" "}
              {year}
            </p>
            <ChevronDownIcon
              className="ml-1 h-5 w-5 text-gray-400 mt-5"
              aria-hidden="true"
            />
          </div>
        </button>

        <div>
          <a
            href={
              // one month forward
              `/employees/${employeeId}/timesheets/${getNextMonthLink(
                year,
                month,
              )}`
            }
            className="inline-flex items-center border-t-2 border-transparent pt-4 pl-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
          >
            <ChevronRightIcon
              className="ml-3 h-5 w-5 text-gray-400"
              aria-hidden="true"
            />
          </a>
        </div>
      </nav>
      {showCalendar ? (
        <div className="lg:-mt-px grid grid-cols-3">
          {[...Array(12).keys()].map((monthy) => (
            <a
              key={monthy}
              href={`/employees/${employeeId}/timesheets/${year}/${monthy + 1}`}
              className={`inline-flex items-center border-b-2 border-transparent px-1 pt-4 text-sm font-medium
              capitalize text-white hover:text-white-900 dark:hover:text-gray-100
              ${
                monthy === Number(month) - 1
                  ? "border-gray-900 text-white dark:border-gray-100 dark:text-gray-100"
                  : ""
              }
              `}
            >
              <p className={`${selectedMonth ? "text-white" : "text-black"}`}>{new Date(Number(year), monthy).toLocaleString("nb-NO", {
                month: "short",
              })}
              </p>
              
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}
