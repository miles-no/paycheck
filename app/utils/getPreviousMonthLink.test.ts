import { getPreviousMonthLink } from "~/utils/getPreviousMonthLink";

describe('getPreviousMonthLink', () => {
  it('returns an empty string if year or month is undefined', () => {
    expect(getPreviousMonthLink(undefined, '5')).toBe('');
    expect(getPreviousMonthLink('2023', undefined)).toBe('');
    expect(getPreviousMonthLink(undefined, undefined)).toBe('');
  });

  it('returns the correct link for January', () => {
    expect(getPreviousMonthLink('2023', '1')).toBe('2022/12');
  });

  it('returns the correct link for other months', () => {
    expect(getPreviousMonthLink('2023', '3')).toBe('2023/2');
    expect(getPreviousMonthLink('2023', '9')).toBe('2023/8');
  });

  it('overflows correctly', () => {
    expect(getPreviousMonthLink('2023', '1')).toBe('2022/12');
    expect(getPreviousMonthLink('2022', '1')).toBe('2021/12');
    expect(getPreviousMonthLink('2021', '1')).toBe('2020/12');
    expect(getPreviousMonthLink('2020', '1')).toBe('2019/12');
    expect(getPreviousMonthLink('2019', '1')).toBe('2018/12');
  });

});