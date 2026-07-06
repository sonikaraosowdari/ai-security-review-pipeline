import { Mastra } from '@mastra/core/mastra';
import { securityTriageAgent } from './agents/security-triage-agent.js';
import { securityTriageWorkflow } from './workflows/security-triage-workflow.js';

export const mastra = new Mastra({
  agents: { securityTriageAgent },
  workflows: { securityTriageWorkflow },
});
