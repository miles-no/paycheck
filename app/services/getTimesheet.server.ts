import { cache } from "~/services/cache";
import { mockedTimesheets } from "~/services/mockdata";

export function getMonthInterval(date: Date) {
  const newDate = new Date(date);
  // Set timezones to UTC so that the date is the same regardless of where the user is located
  newDate.setUTCHours(0, 0, 0, 0);

  const year = newDate.getUTCFullYear();
  const month = newDate.getUTCMonth();

  const startOfMonth = new Date(Date.UTC(year, month, 1));
  const endOfMonth = new Date(Date.UTC(year, month + 1, 1));
  const from = startOfMonth.toISOString().split("T")[0];
  const to = endOfMonth.toISOString().split("T")[0];

  return { from, to };
}

export function getTimesheetCacheKey(
  employeeDbId: string,
  from: string,
  to: string
) {
  return `timesheet-${employeeDbId}-${from}-${to}`;
}

export const getTimesheets = async (employeeDbId: string, date: Date) => {
  // Check env if we should mock the data
  if (process.env.MOCK_DATA === "TRUE") return mockedTimesheets;

  const { from, to } = getMonthInterval(date);
  // use cache if available
  const cacheKey = getTimesheetCacheKey(employeeDbId, from, to);
  if (cache.has(cacheKey)) {
    console.log("Using cached timesheet", cacheKey);
    return cache.get(cacheKey) as XLedgerGraphQLTimesheetQueryResponse;
  }

  console.log("Fetching timesheet from XLedger API", cacheKey);

  let timesheets: Node[] = [];
  let hasNextPage = true;
  let endCursor = null;

  let iteration = 0;
  const query = `
            query GetTimesheets($first: Int!, $after: String) {
              timesheets(first: $first, after: $after, filter: {employeeDbId: ${employeeDbId}, assignmentDate_gte: "${from}", assignmentDate_lt: "${to}"}, orderBy: {field: ASSIGNMENT_DATE, direction: ASC}) {
                pageInfo {
                  hasNextPage
                }
                edges {
                  cursor
                  node {
                    assignmentDate
                    workingHours
                    invoiceHours
                    hourlyRevenueCurrency
                    projectDbId
                    project{
                      description
                      projectGroup {
                       code
                      }
                    }
                    activity {
                      code
                      dbId
                      description
                    }
                  }
                }
              }
            }
          `;
  console.log("query", query);
  while (hasNextPage) {
    iteration++;
    const response = await fetch(`${process.env.XLEDGER_GRAPHQL_URL}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `token ${process.env.XLEDGER_TOKEN}`,
      },
      body: JSON.stringify({
        query: query,
        variables: { first: 100, after: endCursor },
      }),
    });

    const json: XLedgerGraphQLTimesheetQueryResponse = await response.json();
    if (json?.data?.timesheets?.edges) {
      timesheets = [
        ...timesheets,
        ...json.data.timesheets.edges.map((edge) => edge.node),
      ];
    }
    hasNextPage = json.data.timesheets.pageInfo.hasNextPage;
    endCursor = json.data.timesheets.pageInfo.endCursor;
  }

  console.log(
    `Fetched ${timesheets.length} timesheets in ${iteration} iteration${
      iteration > 1 ? "s" : ""
    } from XLedger API`
  );

  const result: XLedgerGraphQLTimesheetQueryResponse = {
    data: {
      timesheets: {
        pageInfo: {
          hasNextPage: hasNextPage,
          endCursor: `${endCursor}`,
        },
        edges: timesheets.map((node, index) => {
          return {
            cursor: index.toString(),
            node: node,
          };
        }),
      },
    },
  };

  // Cache the data
  cache.set(cacheKey, result);
  console.log("Save for mocking:", JSON.stringify(result));
  return result;
};
// Types
export interface XLedgerGraphQLTimesheetQueryResponse {
  errors?: any;
  data: Data;
}

export interface Data {
  timesheets: Timesheets;
}

export interface Timesheets {
  pageInfo: PageInfo;
  edges: Edge[];
}

export interface PageInfo {
  endCursor: string;
  hasNextPage: boolean;
}

export interface Edge {
  cursor: string;
  node: Node;
}

export interface Node {
  activity: {
    code: string;
    description: string;
    dbId: number;
  };
  assignmentDate: string;
  workingHours: string;
  invoiceHours: string;
  hourlyRevenueCurrency: string;
  projectDbId: number;
  text?: string;
  approved: boolean;
  project: Project;
}

export interface Project {
  description: string;
  projectGroup?: {
    code: string;
  }
}
