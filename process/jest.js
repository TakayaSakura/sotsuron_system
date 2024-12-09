const { analyzeRegex } = require("./mainForTest.js");

test("1|2)*1", () => {
  const regex = "(1|2)*1";
  const result = analyzeRegex(regex);
  expect(result).toBe("ReDoSを引き起こす可能性のない正規表現");
});
