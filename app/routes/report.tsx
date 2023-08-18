import type { LoaderArgs } from "@remix-run/node";
import Excel from "exceljs";
import { Response } from "@remix-run/node";
import { Transform } from "node:stream";
import { getEmployees } from "~/services/getEmployees.server";
import { isAdminOrManager } from "~/utils/isAdminOrManager";
import { requireUser } from "~/services/user.server";
import { getTimesheets } from "~/services/getTimesheet.server";
import { aggregateProjectSummary } from "~/utils/aggregateProjectSummary.server";
import { getEmployeeDetailsByXledgerId } from "~/models/employeeDetails.server";
import { getXledgerEmployeeData } from "./employees/$employeeId";
import { calculateMonthlyPayFromSubTotal } from "~/utils/calculateMonthlyPayFromTimesheet";

function getCurrentReportDate(){
  const currentDate = new Date();

  // Calculate the last month's date
  const lastMonth = new Date(currentDate);
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  // Set the date to the first day of the last month
  lastMonth.setDate(1);

  return lastMonth;
}

function getMonthName(date: Date){
  const monthNames = [
    "January", "February", "March",
    "April", "May", "June",
    "July", "August", "September",
    "October", "November", "December"
  ];
  
  return monthNames[date.getMonth()];
}

export async function loader({ request }: LoaderArgs) {
  // Check if user is allowed to trigger this action
  const user = await requireUser(request);

  if (!user) return new Response("Unauthorized", { status: 401 });
  if (!user || (user.role.name !== ("admin" || "manager"))) {
    return new Response("Unauthorized", { status: 401 });
  }

  const date = getCurrentReportDate();

  const wb = new Excel.Workbook();
  const ws = wb.addWorksheet('Lønn');
  
  const employees = await getEmployees();

  employees.sort((a, b) => {
    return a.code > b.code ? 1 : a.code < b.code ? -1 : 0;
  })

  const employeRows = [];

  for(let i = 0; i < employees.length; i++){
    const employee = employees[i];
    const employeeId = `${employee.dbId}`;

    const timesheets = await getTimesheets(
      employeeId,
      date
    );
    if (!timesheets) throw new Error("No timesheets found");

    const employeeDetails = await getEmployeeDetailsByXledgerId(employeeId);
    const selfCostFactor = employeeDetails?.selfCostFactor || 1;
    const provisionPercentage = employeeDetails?.provisionPercentage || 1;

    // Calculate total hours and revenue by project
    const totalByProject = aggregateProjectSummary(timesheets);
    const subTotal = Object.values(totalByProject || {}).reduce(
      (acc, cur) => acc + cur.sum,
      0
    );

    const xledgerEmployeeData = await getXledgerEmployeeData(employeeId);
    const yearlyFixedSalary =
      xledgerEmployeeData?.data?.payrollRates?.edges?.[0]?.node?.rate || 12;

    // Calculate monthly pay
    const monthlyPay = calculateMonthlyPayFromSubTotal(
      subTotal,
      yearlyFixedSalary,
      selfCostFactor || 0,
      provisionPercentage || 0
    );

    employeRows.push(
      [employee.code, employee.description, monthlyPay.fixedSalary, monthlyPay.provision]
    )

    break;
  }

  ws.addRows([
      ['', '', '', ''],
      ['', 'Endringer denne måned i rødt'],
      [],
      [],
      ['', getMonthName(date)],
    ]
  );

  ws.columns[0].width = 17;
  ws.columns[0].alignment = {
    horizontal: 'right'
  };

  ws.columns[1].width = 35;
  ws.columns[2].width = 35;
  ws.columns[3].width = 17;

  ws.addTable({
    name: 'Lønn',
    ref: 'A6',
    headerRow: true,
    totalsRow: true,
    style: {
      theme: 'TableStyleMedium2',
      showRowStripes: true,
    },
    columns: [
      {name: 'Ansattnummer', filterButton: true},
      {name: 'Navn',  filterButton: true},
      {name: 'Fastlønn / variabel', totalsRowLabel: 'Total', totalsRowFunction: 'sum', filterButton: true},
      {name: 'Provisjon', totalsRowLabel: 'Total', totalsRowFunction: 'sum', filterButton: true},
    ],
    rows: [
      ...employeRows
    ],
  });

  //create a steam (writable and readable)
  const stream = new Transform({
    transform(chunk, encoding, callback) {
      this.push(chunk);
      callback();
    },
  });
  
  //Write the excel to it
  await wb.xlsx.write(stream)

  return new Response(stream,
    {
      headers:{
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
}

