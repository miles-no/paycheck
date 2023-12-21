import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/20/solid";
import { getNextMonthLink } from "~/utils/getNextMonthLink";
import { getPreviousMonthLink } from "~/utils/getPreviousMonthLink";

export function TimeSheetNav(props: {
  employeeId: string | undefined;
  year: string | undefined;
  month: string | undefined;
}) {
  const { employeeId, year, month } = props;
  return (
    <>
     
      <nav className="hideInPrint m-4 flex justify-center">
        <div>
          <a
            href={`/employees/${employeeId}/timesheets/${getPreviousMonthLink(
              year,
              month
            )}`}
            className=" inline-flex items-center border-t-2 border-transparent pt-4 pr-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
          >
            <ChevronLeftIcon
              className="mr-3 h-5 w-5 text-gray-400"
              aria-hidden="true"
            />
           
          </a>
        </div>
        <p className={"mt-4 text-center font-mono text-xl capitalize color text-[#FF303B]"}>
        {new Date(Number(year), Number(month) - 1).toLocaleString("nb-NO", {
          month: "long",
        })}{" "}
        {year}
      </p>
       {/*  <div className="hidden lg:-mt-px lg:flex">
          {[...Array(12).keys()].map((monthy) => (
            <a
              key={monthy}
              href={`/employees/${employeeId}/timesheets/${year}/${monthy + 1}`}
              className={`inline-flex items-center border-b-2 border-transparent px-1 pt-4 text-sm font-medium
              capitalize text-gray-500 hover:text-gray-900 dark:hover:text-gray-100
              ${
                monthy === Number(month) - 1
                  ? "border-gray-900 text-gray-900 dark:border-gray-100 dark:text-gray-100"
                  : ""
              }
              `}
            >
              {new Date(Number(year), monthy).toLocaleString("nb-NO", {
                month: "long",
              })}
            </a>
          ))}
        </div> */}
        <div>
          <a
            href={
              // one month forward
              `/employees/${employeeId}/timesheets/${getNextMonthLink(
                year,
                month
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
    </>
  );
}
