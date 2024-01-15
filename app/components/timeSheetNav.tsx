import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
} from "@heroicons/react/20/solid";
import { getNextMonthLink } from "~/utils/getNextMonthLink";
import { getPreviousMonthLink } from "~/utils/getPreviousMonthLink";
import { useEffect, useState } from "react";

export function TimeSheetNav(props: {
  employeeId: string | undefined;
  year: string | undefined;
  month: string | undefined;
}) {
  const { employeeId, year, month } = props;

  const [showCalendar, setShowCalendar] = useState(false);
  const [updatedYear, setUpdatedYear] = useState(year);

  
  console.log("asdf", updatedYear, month);

  useEffect(() => {
    setUpdatedYear(year);
  }
  , [year]);


  return (
    <div className="flex flex-col justify-center items-center">
      <nav className="hideInPrint m-4 flex justify-center">
        {!showCalendar ? (
          <div className ="pt-4">
            <a
              href={`/employees/${employeeId}/timesheets/${getPreviousMonthLink(
                year,
                month,
              )}`}
              className=" inline-flex items-center border-b-2 border-transparent  pb-4 pr-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
            >
              <ChevronLeftIcon
                className="mr-3 h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
            </a>
          </div>
        ) : (
          <div className ="pt-4">
            <button
              onClick={() => setUpdatedYear(String(Number(updatedYear) - 1))}
              className=" inline-flex items-center border-b-2 border-transparent  pb-4 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 pr-5"
            >
              <ChevronLeftIcon
                className="mr-3 h-5 w-5 text-gray-400 "
                aria-hidden="true"
              />
            </button>
          </div>
        )}

        {!showCalendar ? (
          <button onClick={() => setShowCalendar(!showCalendar)}>
            <div className="flex">
              <p
                className={
                  "mt-2 text-center font-mono text-xl capitalize color text-[#FF303B]"
                }
              >
                {new Date(
                  Number(updatedYear),
                  Number(month) - 1,
                ).toLocaleString("nb-NO", {
                  month: "long",
                })}{" "}
                {updatedYear}
              </p>
              <ChevronDownIcon
                className="ml-1 h-5 w-5 text-gray-400 mt-3"
                aria-hidden="true"
              />
            </div>
          </button>
        ) : (
          <button onClick={() => setShowCalendar(!showCalendar)}>
            <div className="flex">
              <p
                className={
                  "mt-2 text-center font-mono text-xl capitalize color text-white"
                }
              >
                {updatedYear}
              </p>
             
            </div>
          </button>
        )}
        {!showCalendar ? (
          <div className ="pt-4">
            <a
              href={
                // one month forward
                `/employees/${employeeId}/timesheets/${getNextMonthLink(
                  updatedYear,
                  month,
                )}`
              }
              className="inline-flex items-center border-transparent pb-4 pl-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 hover:border-b-2"
            >
              <ChevronRightIcon
                className="ml-3 h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
            </a>
          </div>
        ) : (
          <div className ="pt-4">
            <button
              onClick={() => setUpdatedYear(String(Number(updatedYear) + 1))}
              className="inline-flex items-center border-transparent pb-4 pl-5 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 hover:border-b-2"
            >
              <ChevronRightIcon
                className="ml-3 h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
            </button>
          </div>
        )}
      </nav>
      {showCalendar ? (
        <div className="lg:-mt-px grid grid-cols-3">
          {[...Array(12).keys()].map((monthy) => (
            <a
              key={monthy}
              href={`/employees/${employeeId}/timesheets/${updatedYear}/${
                monthy + 1
              }`}
              className={`inline-flex items-center border-b-2 border-transparent px-1 pt-4 text-sm font-medium
              capitalize text-white hover:text-white-900 dark:hover:text-gray-100
              ${
                monthy === Number(month) - 1
                  ? "border-gray-900 text-white dark:border-gray-100 dark:text-gray-100"
                  : ""
              }
              `}
            >
              <p className={`${!(Number(monthy) === Number(month) -1) ? "text-white " : "text-black bg-white rounded-md"} p-2`}>
                {new Date(Number(updatedYear), monthy).toLocaleString("nb-NO", {
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
