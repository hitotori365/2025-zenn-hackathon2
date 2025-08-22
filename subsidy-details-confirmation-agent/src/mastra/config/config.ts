// Configuration for the subsidy details confirmation agent
export const config = {
  // Data source for subsidy details (json is the primary source)
  dataSource: (process.env.SUBSIDY_DATA_SOURCE || "json") as "json" | "db",
  
  // Path to the subsidy details JSON file
  jsonPath: process.env.SUBSIDY_DETAILS_JSON_PATH || "./subsidy-details.json",
  
  // Database configuration (for future use)
  database: {
    url: process.env.DATABASE_URL || "file:../mastra.db",
  },
  
  // Agent configuration
  agent: {
    model: "gemini-2.5-pro",
    memoryUrl: "file:../mastra.db",
  },
};