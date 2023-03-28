import type { XLedgerGraphQLTimesheetQueryResponse } from "~/services/getTimesheet.server";

/**
 * Aggregates the timesheet timesheetQueryResponse by project and sums up the hours worked and the sum earned.
 *
 * NB: Assumes that the timesheet entries are for one month only.
 *
 * @param timesheetQueryResponse
 * @returns An array of objects with project information. Sorted by hours worked descending.
 *
 * @example
 * [
 *  {
 *  id: 28260176,
 *  name: "Example Project",
 *  hours: 160,
 *  rate: 1200,
 *  sum: 192000,
 *  explanation: "Same rate as main project"
 *  },
 *  ...
 *  ]
 */
export function aggregateProjectSummary(
  timesheetQueryResponse: XLedgerGraphQLTimesheetQueryResponse
) {
  const mainProjectRate = Number(
    getMainProjectTimeEntries(timesheetQueryResponse)?.[0].hourlyRevenueCurrency
  );

  const byProject = groupByProject(timesheetQueryResponse);
  // Map over grouped timesheetQueryResponse and calculate rate and sum for each project
  return Object.entries(byProject)
    .map(([projectName, timeEntries]) => {
      // Calculate rate and explanation based on activity code
      const { rate, explanation } = calculateRateAndExplanation(
        timeEntries,
        mainProjectRate
      );

      // Calculate total hours worked on a project
      const hoursWorked = calculateHoursWorked(timeEntries);

      // Calculate total sum earned for project
      const sumEarned = hoursWorked * rate;

      // Return an object with project information
      return {
        id: timeEntries[0].projectDbId,
        name: projectName,
        hours: hoursWorked,
        rate,
        sum: sumEarned,
        explanation,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
  // .sort((a, b) => b.hours - a.hours);
}

/**
 * Returns an object with project names as keys and time entries as values
 * @param timeEntries
 * @param mainProjectRate
 */
function calculateRateAndExplanation(
  timeEntries: XLedgerGraphQLTimesheetQueryResponse["data"]["timesheets"]["edges"][0]["node"][],
  mainProjectRate: number
) {
  const activityCode = timeEntries?.[0]?.activity?.code || "UNKNOWN";

  // Most projects have a rate from xlledger. So we default to that.
  let rate = Number(timeEntries[0].hourlyRevenueCurrency); // NB: Assuming the same rate for all time entries
  let explanation;

  // Some projects have a special rate. So we override the rate and explanation.
  // Set rate and explanation based on activity code
  if (["S-102"].includes(activityCode)) {
    // 1000 kr an hour
    rate = 1000;
    explanation = "Intern sats";
  } else if (["S-107"].includes(activityCode)) {
    // 50% of the main project
    rate = mainProjectRate / 2;
    explanation = "50% av hovedprosjekt";
  } else if (
    [
      "S-101",
      "S-103",
      "S-104",
      "S-105",
      "S-106",
      "S-108",
      "992",
      "993",
      "994",
      "995",
      "996",
    ].includes(activityCode)
  ) {
    // Same as the main project
    rate = mainProjectRate;
    explanation = "100% av hovedprosjekt";
  }

  return { rate, explanation };
}

/**
 * Returns the total hours worked on a project
 * @param timeEntries
 */
function calculateHoursWorked(
  timeEntries: XLedgerGraphQLTimesheetQueryResponse["data"]["timesheets"]["edges"][0]["node"][]
) {
  if (!timeEntries) return 0;
  // Calculate total hours worked on a project
  return timeEntries.reduce((totalHours, node) => {
    return totalHours + parseFloat(node.workingHours);
  }, 0);
}

/**
 * Returns the project with the most working hours
 * @param queryResponse
 */
function getMainProjectTimeEntries(
  queryResponse: XLedgerGraphQLTimesheetQueryResponse
) {
  const grouped = groupByProject(queryResponse);

  // Find the project with the most working hours
  let mainProjectKey = "";
  let maxWorkingHours = 0;

  Object.entries(grouped).forEach(([key, projectTimesheet]) => {
    const workHours = getTotalWorkingHoursForProject(projectTimesheet);
    if (workHours > maxWorkingHours) {
      maxWorkingHours = workHours;
      mainProjectKey = key;
    }
  });

  return grouped[mainProjectKey];
}

/**
 * Returns the total working hours for a project
 * @param projectData
 */
function getTotalWorkingHoursForProject(
  projectData: XLedgerGraphQLTimesheetQueryResponse["data"]["timesheets"]["edges"][0]["node"][]
) {
  if (!projectData) return 0;
  return projectData.reduce((acc, { workingHours }) => {
    return acc + parseFloat(workingHours);
  }, 0);
}

type GroupedByProject = {
  [
    key: string
  ]: XLedgerGraphQLTimesheetQueryResponse["data"]["timesheets"]["edges"][0]["node"][];
};

/**
 * Returns an object with project names as keys and time entries as values
 * @param data
 */
function groupByProject(
  data: XLedgerGraphQLTimesheetQueryResponse
): GroupedByProject {
  if (!data.data.timesheets.edges) return {};
  return (
    data.data.timesheets.edges?.reduce((groupedByProject, edge) => {
      const timesheetEntry = edge.node;
      const project = timesheetEntry?.project?.description || "Ukjent prosjekt";
      const activity =
        timesheetEntry?.activity?.description || "Ukjent aktivitet";

      const projectDescription = `${project} - ${activity}`;

      if (!groupedByProject[projectDescription])
        groupedByProject[projectDescription] = [];

      groupedByProject[projectDescription].push(timesheetEntry);

      return groupedByProject;
    }, {} as GroupedByProject) || {}
  );
}
