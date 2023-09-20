import { getNextMonthLink } from "~/utils/getNextMonthLink";

describe("getNextMonthLink", () => {
  it("returns an empty string if year or month is undefined", () => {
    expect(getNextMonthLink(undefined, "5")).toBe("");
    expect(getNextMonthLink("2023", undefined)).toBe("");
    expect(getNextMonthLink(undefined, undefined)).toBe("");
  });

  it("returns the correct link for December", () => {
    expect(getNextMonthLink("2023", "12")).toBe("2024/1");
  });

  it("returns the correct link for other months", () => {
    expect(getNextMonthLink("2023", "3")).toBe("2023/4");
    expect(getNextMonthLink("2023", "9")).toBe("2023/10");
  });

  it("overflows correctly", () => {
    expect(getNextMonthLink("2023", "12")).toBe("2024/1");
    expect(getNextMonthLink("2024", "12")).toBe("2025/1");
    expect(getNextMonthLink("2025", "12")).toBe("2026/1");
    expect(getNextMonthLink("2026", "12")).toBe("2027/1");
    expect(getNextMonthLink("2027", "12")).toBe("2028/1");
  });
});
