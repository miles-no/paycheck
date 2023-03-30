import { cache } from "~/services/cache";

/**
 * Get employees from Xledger
 *
 * Only current employees are included. The filter is:
 *  - employmentFrom_lte: today - Means that the employee was employed before -or on, today
 *  - employmentTo: null - Means that the employee is still employed
 *  - code_gt: "0" - Code is the employeeNumber. We filter out users that haven't been assigned an employeeNumber
 */
export const getEmployees = async () => {
  let employees: Employee[] = [];
  let hasNextPage = true;
  let endCursor = null;

  const from = new Date();
  from.setDate(1);
  const formattedFrom = from.toISOString().split("T")[0]; // 2021-03-01

  // Check cache first
  if (cache.has("employees")) {
    console.log("Using cached employees");
    return cache.get("employees") as Employee[];
  }

  while (hasNextPage) {
    try {
      const response = await fetch(`${process.env.XLEDGER_GRAPHQL_URL}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `token ${process.env.XLEDGER_TOKEN}`,
        },
        body: JSON.stringify({
          query: `
            query GetEmployees($first: Int!, $after: String) {
              employees(first: $first, after: $after, filter:{employmentFrom_lte:"${formattedFrom}",employmentTo:null,code_gt:"0"}) {
                pageInfo{hasNextPage}
                edges {
                  cursor
                  node {
                    description
                    code
                    dbId
                    email
                    positionValue{
                      description
                    }
                  }
                }
              }
            }
          `,
          variables: { first: 500, after: endCursor },
        }),
      });

      const json: EmployeeResponse = await response.json();
      employees = [
        ...employees,
        ...json.data.employees.edges.map((edge) => edge.node),
      ];
      hasNextPage = json.data.employees.pageInfo.hasNextPage;
      endCursor = json.data.employees.pageInfo.endCursor;
    } catch (error) {
      console.error(error);
    }
  }
  const sortedEmployees = employees.sort((a, b) => {
    const aName = a.description ? a.description.toLowerCase() : "";
    const bName = b.description ? b.description.toLowerCase() : "";
    if (aName < bName) return -1;
    if (aName > bName) return 1;
    return 0;
  });
  await cache.set("employees", sortedEmployees);
  return sortedEmployees;
};

// Types
type EmployeeResponse = {
  errors?: Error[];
  data: EmployeeData;
};
type EmployeeData = {
  employees: EmployeeConnection;
};
type EmployeeConnection = {
  edges: [EmployeeEdge];
  pageInfo: {
    hasNextPage: boolean;
    endCursor: string;
  };
};

type EmployeeEdge = {
  cursor: String;
  node: Employee;
};

export type Employee = {
  description: string;
  positionValue: {
    description: string;
  };
  email: string;
  code: string;
  dbId: number;
};
