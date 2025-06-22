import { MCPServer } from "@mastra/mcp";
import { ruleAgent } from "./rule-agent";

 
export const server = new MCPServer({
  name: "Rule Agent Server",
  version: "1.0.0",
  tools: {  },
  agents: {ruleAgent}, 
});
 