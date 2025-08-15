import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { LibSQLStore } from "@mastra/libsql";
import { subsidyInquiryWorkflow } from "./workflows/subsidy-inquiry-workflow";
import { createAgent } from "./agents/inquiry-agent";
import { subsidySearchTool } from "./tools/subsidy-search-tool";
import { createJSONSubsidyRepository } from "./infrastructure/json/subsidyRepositoryImplOnJson";
import { createCSVSubsidyRepository } from "./infrastructure/csv/subsidyRepositoryImplOnCsv";
import { config } from "./config/config.js";
import { createSubsidySearchUsecase } from "./usecase/create-subsidy-search-usecase";

// Factory function to create repository based on environment
const createRepository = (subsidyDataSource: string, dataPath: string) => {
  switch (subsidyDataSource) {
    case "json":
      return createJSONSubsidyRepository();
    case "db":
      // Future: return createDatabaseSubsidyRepository();
      throw new Error("Database repository not implemented yet");
    case "csv":
      return createCSVSubsidyRepository(dataPath);
    default:
      return createCSVSubsidyRepository(dataPath);
  }
};

// Initialize usecase with repository (functional dependency injection)
const subsidyRepository = createRepository(config.dataSource, config.csvPath);
const subsidySearchUsecase = createSubsidySearchUsecase(subsidyRepository);
const searchTools = subsidySearchTool(subsidySearchUsecase);

// Create the inquiry agent with the search tools
const inquiryAgent = createAgent(searchTools);

export const mastra = new Mastra({
  workflows: { subsidyInquiryWorkflow },
  agents: { inquiryAgent },
  storage: new LibSQLStore({
    // stores telemetry, evals, ... into memory storage, if it needs to persist, change to file:../mastra.db
    url: ":memory:",
  }),
  logger: new PinoLogger({
    name: "Mastra",
    level: "info",
  }),
});
