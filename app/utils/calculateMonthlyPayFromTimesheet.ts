import { XLedgerGraphQLTimesheetQueryResponse } from "~/services/getTimesheet.server";

/**
 * Calculates the pay for a given timesheet.
 * Note, only invoiced hours are taken into account atm. Also, the calculation is very basic and does not take into account any other factors.
 *
 * NB: The provided timesheet must be for one month only.
 *
 * @param timesheets - The timesheet to calculate the pay for.
 * @param yearlyFixedSalary - The yearly fixed salary.
 * @param selfCostFactor - The self cost factor.
 * @param provisionPercentage - The provision percentage.
 * @returns monthlyPay - The monthly pay for the given timesheet.
 */
export function calculateMonthlyPayFromTimesheet(
  timesheets: XLedgerGraphQLTimesheetQueryResponse,
  yearlyFixedSalary: number,
  selfCostFactor: number,
  provisionPercentage: number
) {
  const invoicedAmount = getInvoicedAmount(timesheets);
  return calculateMonthlyPayFromSubTotal(
    invoicedAmount,
    yearlyFixedSalary,
    selfCostFactor,
    provisionPercentage
  );
}

/**
 * Calculates the pay for a given sub-total. Here, the sub-total is whatever you want the pay to be based on.
 * For example, if you want to include hours that are not invoiced, you can add those to the sub-total.
 * @param subTotal - The sub-total to calculate the pay for.
 * @param yearlyFixedSalary - The yearly fixed salary.
 * @param selfCostFactor -  The self cost factor.
 * @param provisionPercentage - The provision percentage.
 * @returns monthlyPay - The monthly pay for the given sub-total.
 */
export function calculateMonthlyPayFromSubTotal(
  subTotal: number,
  yearlyFixedSalary: number,
  selfCostFactor: number,
  provisionPercentage: number
) {
  // Monthly Fixed Salary
  const fixedSalary = getMonthlyFixedSalary(yearlyFixedSalary);

  // Monthly Provision
  const selfCost = getMonthlySelfCost(fixedSalary, selfCostFactor);
  const netAmountInvoiced = getNetAmountInvoiced(subTotal, selfCost);
  const provision = getMonthlyProvision(netAmountInvoiced, provisionPercentage);

  // Monthly Pay
  return {
    fixedSalary,
    selfCost,
    invoicedAmount: subTotal,
    netAmountInvoiced,
    provision,
    pay: fixedSalary + provision,
  };
}

/**
 * Get the monthly self-cost (aka. Selvkost)
 */
export function getMonthlySelfCost(
  monthlyFixedSalary: number,
  selfCostFactor: number
) {
  return monthlyFixedSalary * selfCostFactor;
}

/**
 * Get the total amount invoiced (aka. Totalt utfakturert beløp)
 */
export function getInvoicedAmount(
  timesheets: XLedgerGraphQLTimesheetQueryResponse
) {
  return (
    timesheets.data.timesheets.edges?.reduce((acc, edge) => {
      const { hourlyRevenueCurrency, workingHours } = edge.node;
      const hours = parseFloat(workingHours);
      const hourlyRevenue = parseFloat(hourlyRevenueCurrency);
      const invoicedAmount = hours * hourlyRevenue;
      return acc + invoicedAmount;
    }, 0) || 0
  );
}

/**
 * Get the net amount invoiced. (aka. Netto utfakturert beløp som overstiger selvkost)
 * This is the amount that is left after subtracting the monthly self-cost from the total amount invoiced.
 */
export function getNetAmountInvoiced(
  invoicedAmount: number,
  monthlySelfCost: number
) {
  return Math.max(invoicedAmount - monthlySelfCost, 0);
}

/**
 * Get the monthly provision (aka. Provision)
 */
export function getMonthlyProvision(
  netAmountInvoiced: number,
  provisionPercentage: number
) {
  return netAmountInvoiced * provisionPercentage;
}

/**
 * Get the monthly fixed salary (aka. Månedlig Fastlønn)
 */
export function getMonthlyFixedSalary(yearlyFixedSalary: number) {
  return yearlyFixedSalary / 12;
}
