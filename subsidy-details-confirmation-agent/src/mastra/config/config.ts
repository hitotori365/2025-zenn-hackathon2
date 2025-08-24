// Configuration for the subsidy details confirmation agent
export const config = {
  // Data source for subsidy details (json is the primary source)
  dataSource: (process.env.SUBSIDY_DATA_SOURCE || "json") as "json" | "db",
  
  // Directory path containing subsidy details JSON files
  jsonDirectory: process.env.SUBSIDY_DETAILS_JSON_DIR || "./subsidy-details",
  
  // Database configuration (for future use)
  database: {
    url: process.env.DATABASE_URL || "file:../mastra.db",
  },
  
  // Agent configuration
  agent: {
    model: "gemini-2.0-flash",
    memoryUrl: "file:../mastra.db",
  },
};