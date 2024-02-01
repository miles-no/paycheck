function isWeekday(year: number, month: number, day: number) {
  const days = new Date(year, month, day).getDay();
  return days != 0 && days != 6;
}
function daysInMonth(month: number, year: number) {
  const wtf = 32 - new Date(year, month, 32).getDate();
  return wtf;
}

function getWeekdaysInMonth(month: number, year: number) {
  let days = daysInMonth(month, year);
  let weekdays = 0;
  for (let i = 0; i < days; i++) {
    if (isWeekday(year, month, i + 1)) weekdays++;
  }
  return weekdays + 1;
}

export function getHowManyDaysInAMonth(month: number, year: number) {
  return getWeekdaysInMonth(month, year);
}
