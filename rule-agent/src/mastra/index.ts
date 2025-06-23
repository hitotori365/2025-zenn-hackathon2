import { Mastra } from "@mastra/core";
import { server } from "./rule-agent-server";
import { ruleAgent } from "./rule-agent";
 
export const mastra = new Mastra({
  mcpServers: { server },
  agents: { ruleAgent },
});