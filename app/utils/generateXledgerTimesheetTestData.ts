import type { XLedgerGraphQLTimesheetQueryResponse } from "~/services/getTimesheet.server";

export function generateXledgerTimesheetTestData(
  year: number,
  month: number
): XLedgerGraphQLTimesheetQueryResponse {
  const daysInMonth = new Date(year, month, 0).getDate();
  const edges: XLedgerGraphQLTimesheetQueryResponse["data"]["timesheets"]["edges"] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    if (!isWeekend) {
      edges.push({
        cursor: Math.random().toString(),
        node: {
          assignmentDate: `${year}-${month.toString().padStart(2, "0")}-${day
            .toString()
            .padStart(2, "0")}`,
          workingHours: "7.5000",
          invoiceHours: "7.5000",
          hourlyRevenueCurrency: "1200.0000",
          projectDbId: 28260176,
          project: {
            description: "Example Project",
            projectGroup: {
              code: "000",
            }
          },
          activity: {
            code: "Example Activity",
            dbId: 28260176,
            description: "Example Activity",
          },
          approved: true,
        },
      });
    }
  }

  return {
    data: {
      timesheets: {
        pageInfo: {
          hasNextPage: false,
          endCursor: Math.random().toString(),
        },
        edges,
      },
    },
  };
}
