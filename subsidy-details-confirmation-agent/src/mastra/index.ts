import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { LibSQLStore } from "@mastra/libsql";
import { createAgent } from "./agents/inquiry-agent";
import { subsidyDetailsTool as subsidyDetailsToolFactory } from "./tools/subsidy-details-tool";
import { messageGeneratorTool as messageGeneratorToolFactory } from "./tools/message-generator-tool";
import { createJSONSubsidyDetailsRepository } from "./infrastructure/json/subsidyDetailsRepositoryImplOnJson";
import { createSubsidyDetailsUsecase } from "./usecase/getSubsidyDetailsUsecase";
import { createMessageGenerationUsecase } from "./usecase/generateMessageUsecase";
import { config } from "./config/config";

// Factory function to create repository based on environment
const createRepository = (dataSource: string, jsonDirectory: string) => {
  switch (dataSource) {
    case "json":
      return createJSONSubsidyDetailsRepository(jsonDirectory);
    case "db":
      // Future: return createDatabaseSubsidyDetailsRepository();
      throw new Error("Database repository not implemented yet");
    default:
      return createJSONSubsidyDetailsRepository(jsonDirectory);
  }
};

// Initialize repository and usecases with functional dependency injection
const subsidyDetailsRepository = createRepository(
  config.dataSource,
  config.jsonDirectory
);
const subsidyDetailsUsecase = createSubsidyDetailsUsecase(
  subsidyDetailsRepository
);
const messageGenerationUsecase = createMessageGenerationUsecase();

// Create the inquiry agent with dependency injection
const subsidyDetailsAgent = createAgent(
  subsidyDetailsToolFactory,
  messageGeneratorToolFactory,
  subsidyDetailsUsecase,
  messageGenerationUsecase
);

export const mastra = new Mastra({
  workflows: {},
  agents: { subsidyDetailsAgent },
  storage: new LibSQLStore({
    url: config.database.url,
  }),
  logger: new PinoLogger({
    name: "Subsidy Details Confirmation Agent",
    level: "info",
  }),
});
