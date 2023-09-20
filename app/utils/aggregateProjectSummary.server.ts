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
  const mainProjectName = getMainProjectTimeEntries(timesheetQueryResponse)?.[0].project.description;
  console.log("mainProjectRate", mainProjectRate,mainProjectName);

  const byProject = groupByProject(timesheetQueryResponse);
  // Map over grouped timesheetQueryResponse and calculate rate and sum for each project
  return Object.entries(byProject)
    .map(([projectName, timeEntries]) => {
      // Calculate rate and explanation based on activity code
      const { rate, explanation, error } = calculateRateAndExplanation(
        timeEntries,
        mainProjectRate
      );

      // Calculate total hours worked on a project
      const hoursWorked = calculateHoursWorked(timeEntries);
      const hoursInvoiced = calculateHoursInvoiced(timeEntries);

      // The sum that should be invoiced for a project
      const sumInvoiced = hoursInvoiced * rate;

      // The sum that should be count as earned for a project by the employee
      const sumEarned = hoursWorked * rate;

      // Return an object with project information
      return {
        id: timeEntries[0].projectDbId,
        name: projectName,
        hours: { worked: hoursWorked, invoiced: hoursInvoiced },
        rate,
        sum: { earned: sumEarned, invoiced: sumInvoiced},
        explanation,
        error,
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

  // Most projects have a rate from Xledger. So we default to that.
  let rate = Number(timeEntries[0].hourlyRevenueCurrency); // NB: Assuming the same rate for all time entries
  let explanation = "";
  let error = "";

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

  // If projectName is PayCheck, then use the main project rate
  // if (timeEntries[0].project?.description === "Paycheck") {
  //   // Todo: only do this for Henry
  //   console.log("Using main project rate for Paycheck",mainProjectRate);
  //   rate = 1370;
  //   explanation = "100% av hovedprosjekt";
  //
  //   timeEntries.forEach((node) => {
  //     node.invoiceHours = node.workingHours;
  //   });
  // }

  // Check if the invoice hours is the same as the working hours
  timeEntries.forEach((node) => {
    const { invoiceHours, workingHours, project } = node;
    const { projectGroup } = project;
    if (projectGroup?.code === "201" || projectGroup?.code === "201-Haug ") {
      if (workingHours !== invoiceHours) {
        error = "Fakturerte timer er ikke lik arbeidstimer. Usikker på hva det betyr? Spør Siri.";
      }
    }
  });

  return { rate, explanation, error };
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
 * Returns the total hours invoiced on a project
 * @param timeEntries
 */
function calculateHoursInvoiced(
  timeEntries: XLedgerGraphQLTimesheetQueryResponse["data"]["timesheets"]["edges"][0]["node"][]
) {
  if (!timeEntries) return 0;

  // Calculate total hours worked on a project
  return timeEntries.reduce((totalHours, node) => {
    return totalHours + parseFloat(node.invoiceHours);
  }, 0);
}


/**
 * Returns the project with the most invoiced hours (TODO: check if this is correct)
 * @param queryResponse
 */
function getMainProjectTimeEntries(
  queryResponse: XLedgerGraphQLTimesheetQueryResponse
) {
  const grouped = groupByProject(queryResponse);

  // Find the project with the most working hours
  let mainProjectKey = "";
  let maxInvoicedHours = 0;

  Object.entries(grouped).forEach(([key, projectTimesheet]) => {
    const invoicedHours = calculateHoursInvoiced(projectTimesheet);
    if (invoicedHours > maxInvoicedHours) {
      maxInvoicedHours = invoicedHours;
      mainProjectKey = key;
    }
  });

  return grouped[mainProjectKey];
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
