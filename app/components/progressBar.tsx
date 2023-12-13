import HoursNotDone from "~/assets/HoursNotDone";
import HoursNotSent from "~/assets/HoursNotSent";
import SentToApproval from "~/assets/SentToApproval";

export function ProgressBar(props: {
  totalHoursWorked: number;
  totalHoursInvoiced: number;
  monthlyPay: object;
}) {
  const { totalHoursWorked, totalHoursInvoiced, monthlyPay } = props;
  const maxHours = 172.5;
  const percentage =
    ((totalHoursInvoiced != null ? totalHoursInvoiced : 1) / maxHours) * 100;
  const percentageProgress =
    ((totalHoursWorked != null ? totalHoursWorked : 1) / maxHours) * 100;
  const pay = (monthlyPay as { pay?: number }).pay;

  console.log(percentage, percentageProgress, "asdf");

  // fix css positioning of the progress bar, lage fill last klasse ? 
  return (
    <div>
      <div className="flex flex-row justify-between text-white">
        <div>
          <p className="flex flex-row whitespace-nowrap">
            Du har ført &nbsp;{" "}
            <div className="text-[#78E8DB] ">{totalHoursInvoiced} </div> &nbsp;
            av 172,5 timer denne måneden
          </p>
        </div>
        <div>
          <p className="flex flex-row whitespace-nowrap">
            {" "}
            Totalt &nbsp;
            <div className="text-[#78E8DB] ">
              {Intl.NumberFormat("nb-NO", {
                style: "currency",
                currency: "NOK",
                maximumFractionDigits: 2,
              }).format(pay)}{" "}
            </div>
          </p>
        </div>
      </div>

      <div className="progress-bar">
        <div
          className="progress-bar__fillfirst"
          style={{ width: `${percentageProgress}%` }}
        >
          <p>Sendt til godkjenning</p>
          <div className="pl-1 pr-6 ">
            <SentToApproval />
          </div>
        </div>
        <div className="progress-bar__fill" style={{ width: `${percentage}%` }}>
          {" "}
          <p>Ført</p>
          <div className="pl-1 pr-6 ">
            <HoursNotDone />
          </div>
        </div>
        <div className="progress_bar__filllast" style={{width: `${maxHours}%`}}>
          <p className="pl-2 ">Ikke ført</p>
          <div className="pl-2 pr-6 ">
            <HoursNotSent />
          </div>
        </div>
      </div>
    </div>
  );
}
