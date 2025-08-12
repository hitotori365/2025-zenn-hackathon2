export const config = {
  csvPath: process.env.SUBSIDY_CSV_PATH || "hojokin2024.csv",
  dataSource: process.env.SUBSIDY_DATA_SOURCE || "csv",
} as const;
