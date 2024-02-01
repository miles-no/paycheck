import HoursNotDone from "~/assets/HoursNotDone";
import HoursNotSent from "~/assets/HoursNotSent";
import SentToApproval from "~/assets/SentToApproval";

export function ProgressBar(props: {
  totalHoursWorked: number;
  totalHoursInvoiced: number;
  monthlyPay: object;
  maxValue: number;
  isAdmin: boolean;
}) {
  const {
    totalHoursWorked,
    totalHoursInvoiced,
    monthlyPay,
    maxValue,
    isAdmin,
  } = props;
  const maxHours = maxValue;
  const percentage =
    ((totalHoursInvoiced != null ? totalHoursInvoiced : 1) / maxHours) * 100;
  const percentageProgress =
    ((totalHoursWorked != null ? totalHoursWorked : 1) / maxHours) * 100;
  const pay = (monthlyPay as { pay?: number }).pay;
  return (
    <div className={"w-full h-24"}>
      <div className="flex flex-row justify-between text-white ">
        <div>
          <div className="flex flex-row whitespace-nowrap">
            {isAdmin ? "Det er ført" : "Du har ført"} &nbsp;
            <div className="text-[#78E8DB] ">
              {totalHoursInvoiced.toLocaleString("nb-NO")}{" "}
            </div>{" "}
            &nbsp; av {maxHours.toLocaleString("nb-NO")} timer denne måneden
          </div>
        </div>
        <div>
          <div className="flex flex-row whitespace-nowrap">
            {" "}
            Totalt &nbsp;
            <div className="text-[#78E8DB] ">
              {Intl.NumberFormat("nb-NO", {
                style: "currency",
                currency: "NOK",
                maximumFractionDigits: 2,
              }).format(pay)}{" "}
            </div>
          </div>
        </div>
      </div>

      <div className="progress-bar">
        <div
          className="progress-bar__fillfirst"
          style={{ width: `${percentageProgress}%` }}
        >
          <p className="overflow-hidden">Sendt til godkjenning</p>

          <div className="pl-1 pr-6 ">
            <SentToApproval />
          </div>
        </div>
        <div className="progress-bar__fill" style={{ width: `${percentage}%` }}>
          {" "}
          <p className="overflow-hidden">Ført</p>
          <div className="pl-1 pr-6 ">
            <HoursNotDone />
          </div>
        </div>
        <div
          className="progress_bar__filllast"
          style={{ width: `${maxHours}%` }}
        >
          <p className="pl-2  overflow-hidden">Ikke ført</p>
          <div className="pl-2 pr-6 ">
            <HoursNotSent />
          </div>
        </div>
      </div>
    </div>
  );
}
