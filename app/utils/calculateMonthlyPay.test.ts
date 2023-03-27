import { generateXledgerTimesheetTestData } from "~/utils/generateXledgerTimesheetTestData";
import { calculateMonthlyPayFromTimesheet } from "./calculateMonthlyPayFromTimesheet";
import type { XLedgerGraphQLTimesheetQueryResponse } from "~/services/getTimesheet.server";

// Todo: generateXledgerTimesheetTestData has changed to accommodate special cases... update this test
test("Calculate monthly pay for employee", () => {
  expect(
    calculateMonthlyPayFromTimesheet(
      generateXledgerTimesheetTestData(2023, 1),
      600000,
      1.5,
      0.2
    ).pay
  ).toBe(68000);
  expect(
    calculateMonthlyPayFromTimesheet(
      generateXledgerTimesheetTestData(2023, 2),
      600000,
      1.5,
      0.2
    ).pay
  ).toBe(65000);
});

test("Handle special tasks", () => {
  // Todo: handle special tasks/cases
  //   There are some special tasks that have special rules for calculating the pay.
  // ### Special cases
  //
  //   The following tasks have special rules for calculating the pay:
  //
  //     | Code	  | Task                   | 	Comment              |
  //   |--------|------------------------|-----------------------|
  //   | S-101	 | Fagsamtaler	           | "Main project"        |
  //   | S-102	 | Faglig intervju	       | 1000 kr an hour       |
  //   | S-103	 | Bistand innsalg	       | "Main project"        |
  //   | S-104	 | Profilaktiviteter	     | "Main project"        |
  //   | S-105	 | Mentor	                | "Main project"        |
  //   | S-106	 | Fagtjener	             | "Main project"        |
  //   | S-107	 | Verneplikt	            | 50% of "Main project" |
  //   | S-108	 | Interntim m/p          | 	"Main project"       |
  //   | 992	   | Syk, egenmelding       | 	"Main project"       |
  //   | 993	   | Sykt                   | 	"Main project"       |
  //   | 994	   | Sykemelding            | 	"Main project"       |
  //   | 995	   | Foreldrepermisjon      | 	"Main project"       |
  //   | 996	   | Annen lønnet permisjon | 	"Main project"       |
  //
  //   As you see above, most tasks are part of the "Main project".
  //     The "Main project" is the project that the employee has
  //   worked the most hours for the given month.
  //
  //     Note, that the "Main project" is not necessarily the project with the highest pay but the project with the most hours.
  //
  // #### Special cases
  //   S-102 should be paid at 1000 kr an hour.
  //   S-107 should be paid at 50% of the "Main project".
  const year = 2023;
  const month = 1;
  const day = 1;
  let sampleTimesheet: XLedgerGraphQLTimesheetQueryResponse = {
    data: {
      timesheets: {
        pageInfo: {
          hasNextPage: false,
          endCursor: Math.random().toString(),
        },
        edges: [
          {
            cursor: Math.random().toString(),
            node: {
              assignmentDate: `${year}-${month
                .toString()
                .padStart(2, "0")}-${day.toString().padStart(2, "0")}`,
              workingHours: "2",
              hourlyRevenueCurrency: "0",
              projectDbId: 28260176,
              project: {
                description: "Example Project",
              },
              activity: {
                code: "S-102",
                description: "Faglig intervju",
                dbId: 28260176,
              },
              approved: true,
            },
          },
        ],
      },
    },
  };
  expect(
    calculateMonthlyPayFromTimesheet(sampleTimesheet, 600000, 1.5, 0.2).pay
  ).toBe(2000);

  sampleTimesheet = {
    data: {
      timesheets: {
        pageInfo: {
          hasNextPage: false,
          endCursor: Math.random().toString(),
        },
        edges: [
          {
            cursor: Math.random().toString(),
            node: {
              assignmentDate: `${year}-${month
                .toString()
                .padStart(2, "0")}-${day.toString().padStart(2, "0")}`,
              workingHours: "7.5000",
              hourlyRevenueCurrency: "1200.0000",
              projectDbId: 123456789,
              project: {
                description: "MAIN PROJECT",
              },
              approved: true,
              activity: {
                code: "S-000",
                description: "Main project",
                dbId: 28260176,
              },
            },
          },
          {
            cursor: Math.random().toString(),
            node: {
              assignmentDate: `${year}-${month
                .toString()
                .padStart(2, "0")}-${day.toString().padStart(2, "0")}`,
              workingHours: "7.5000",
              hourlyRevenueCurrency: "1200.0000",
              projectDbId: 123456789,
              project: {
                description: "MAIN PROJECT",
              },
              approved: true,
              activity: {
                code: "S-000",
                description: "Main project",
                dbId: 28260176,
              },
            },
          },
        ],
      },
    },
  };
  expect(
    calculateMonthlyPayFromTimesheet(sampleTimesheet, 600000, 1.5, 0.2).pay
  ).toBe(50000);
});
