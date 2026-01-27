import selectValidation from "../selectValidation";

describe("Test Select Validation", () => {
  it("if value is an array, should return accepted false when it's length is 0", () => {
    const value: number[] = [];
    const title = "Test Select";
    const result = selectValidation(title, value);
    expect(result).toEqual({
      accepted: false,
      message: `${title} is required.`,
    });
  });
  it("if value is an array, should return accepted true when it's length is greater than 0", () => {
    const value: number[] = [1, 2, 3];
    const title = "Test Select";
    const result = selectValidation(title, value);
    expect(result).toEqual({
      accepted: true,
      message: "Success",
    });
  });
  it("if value is a number, should return accepted false when it's 0", () => {
    const value = 0;
    const title = "Test Select";
    const result = selectValidation(title, value);
    expect(result).toEqual({
      accepted: false,
      message: `${title} is required.`,
    });
  });
  it("if value is a number, should return accepted true when it's greater than 0", () => {
    const value = 5;
    const title = "Test Select";
    const result = selectValidation(title, value);
    expect(result).toEqual({
      accepted: true,
      message: "Success",
    });
  });
});
