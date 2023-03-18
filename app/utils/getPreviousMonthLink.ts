export function getPreviousMonthLink(
  year: string | undefined,
  month: string | undefined
) {
  if (!year || !month) return "";
  if (Number(month) === 1) {
    return `${Number(year) - 1}/12`;
  }
  return `${year}/${Number(month) - 1}`;
}
