export function getNextMonthLink(
  year: string | undefined,
  month: string | undefined
) {
  if (!year || !month) return "";
  if (Number(month) === 12) {
    return `${Number(year) + 1}/1`;
  }
  return `${year}/${Number(month) + 1}`;
}
