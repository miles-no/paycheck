import jest from "jest-mock";
// Import necessary modules and functions for testing

// Mock GraphQL response data
const mockGraphQLResponse = {
  timesheets: {
    edges: [
      {
        node: {
          project: {
            projectGroup: {
              code: "201"
            }
          },
          workingHours: 40,
          invoiceHours: 40
        }
      },
      {
        node: {
          project: {
            projectGroup: {
              code: "201-Haug "
            }
          },
          workingHours: 35,
          invoiceHours: 30 // Notice the incorrect input
        }
      }
      // Add more mock data as needed
    ]
  }
};

// Mock function to fetch GraphQL data
const getMockGraphQLData = () => {
  return Promise.resolve(mockGraphQLResponse);
};

// Mock function to show alerts
const mockShowAlert = jest.fn();

// Import the module or function responsible for processing and checking data
// Let's assume it's named processAndCheckData

function processAndCheckData(graphqlData, mockShowAlert) {
  const timesheetsWithIncorrectInput = [];
  const okTimesheets = [];

  graphqlData.timesheets.edges.forEach(({ node }) => {
    const { project, workingHours, invoiceHours } = node;
    if (
      project &&
      project.projectGroup &&
      (project.projectGroup.code === "201" || project.projectGroup.code === "201-Haug ")
    ) {
      if (workingHours !== invoiceHours) {
        mockShowAlert(
          `Incorrect input in xledger for project: ${project.projectGroup.code}`
        );
        timesheetsWithIncorrectInput.push(node);
      } else {
        okTimesheets.push(node);
      }
    }
  });
  if (timesheetsWithIncorrectInput.length > 0) {
    return Promise.reject(timesheetsWithIncorrectInput);
  }
  return Promise.resolve(okTimesheets);
}

// Actual test
test("Verify workingHours match invoiceHours for projects with specific projectGroupCode", async () => {
  const graphqlData = await getMockGraphQLData();

  // Mock the showAlert function to capture calls
  await processAndCheckData(graphqlData, mockShowAlert).catch((timesheetsWithIncorrectInput) => {
    expect(timesheetsWithIncorrectInput.length).toBe(1);
  });

  // Verify if showAlert was called with the correct message for incorrect input
  expect(mockShowAlert).toHaveBeenCalledWith(
    "Incorrect input in xledger for project: 201-Haug "
  );
  expect(mockShowAlert).toHaveBeenCalledTimes(1);
});