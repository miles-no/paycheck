import { cache } from "~/cache";

// /**
//  * Get timesheets from XLedger GraphQL API
//  * @param employeeDbId
//  * @param date
//  */
// export const getTimesheets = async (employeeDbId: number, date: Date) => {
//   const year = date.getFullYear();
//   const month = date.getMonth();
//
//   const startOfMonth = new Date(year, month, 1);
//   const startOfNextMonth = new Date(year, month + 1, 1);
//   const from = startOfMonth.toISOString().split("T")[0]; //`2023-02-01`;
//   const to = startOfNextMonth.toISOString().split("T")[0]; //`2023-03-01`;
//
//   // use cache if available
//   const cacheKey = `timesheet-${employeeDbId}-${from}-${to}`;
//   if (cache.has(cacheKey))
//     return cache.get(cacheKey) as XLedgerGraphQLTimesheetQueryResponse;
//   console.log("Fetching timesheet from XLedger API");
//
//   return fetch(`${process.env.XLEDGER_GRAPHQL_URL}`, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `token ${process.env.XLEDGER_TOKEN}`,
//     },
//     body: JSON.stringify({
//       query: `
//       {
//         timesheets(first: 100, filter: {employeeDbId: ${employeeDbId}, assignmentDate_gte: "${from}", assignmentDate_lt: "${to}"}, orderBy: {field: ASSIGNMENT_DATE, direction: ASC}) {
//           pageInfo {
//             hasNextPage
//           }
//           edges {
//             cursor
//             node {
//               assignmentDate
//               workingHours
//               hourlyRevenueCurrency
//               projectDbId
//               project{
//                 description
//               }
//               activity {
//                 code
//                 dbId
//                 description
//               }
//             }
//           }
//         }
//       }
//     `,
//       variables: null,
//       operationName: null,
//     }),
//   })
//     .then(async (response) => {
//       // Cache the data
//       const json: XLedgerGraphQLTimesheetQueryResponse = await response.json();
//       cache.set(cacheKey, json);
//       return json;
//     })
//     .catch((error) => console.error(error));
// };
export const getTimesheets = async (employeeDbId: number, date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth();

  const startOfMonth = new Date(year, month, 1);
  const startOfNextMonth = new Date(year, month + 1, 1);
  const from = startOfMonth.toISOString().split("T")[0]; //`2023-02-01`;
  const to = startOfNextMonth.toISOString().split("T")[0]; //`2023-03-01`;

  // use cache if available
  const cacheKey = `timesheet-${employeeDbId}-${from}-${to}`;
  if (cache.has(cacheKey))
    return cache.get(cacheKey) as XLedgerGraphQLTimesheetQueryResponse;

  console.log("Fetching timesheet from XLedger API");

  let timesheets: Node[] = [];
  let hasNextPage = true;
  let endCursor = null;

  let iteration = 0;

  while (hasNextPage) {
    iteration++;
    const response = await fetch(`${process.env.XLEDGER_GRAPHQL_URL}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `token ${process.env.XLEDGER_TOKEN}`,
      },
      body: JSON.stringify({
        query: `
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
                    hourlyRevenueCurrency
                    projectDbId
                    project{
                      description
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
          `,
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
  hourlyRevenueCurrency: string;
  projectDbId: number;
  text?: string;
  approved: boolean;
  project: Project;
}

export interface Project {
  description: string;
}
