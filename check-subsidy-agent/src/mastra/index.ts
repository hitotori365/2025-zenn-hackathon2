
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { subsidyInquiryWorkflow } from './workflows/subsidy-inquiry-workflow';
import { inquiryAgent } from './agents/inquiry-agent';

export const mastra = new Mastra({
  workflows: { subsidyInquiryWorkflow },
  agents: { inquiryAgent },
  storage: new LibSQLStore({
    // stores telemetry, evals, ... into memory storage, if it needs to persist, change to file:../mastra.db
    url: ":memory:",
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
});
