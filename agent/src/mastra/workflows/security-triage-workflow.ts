import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { securityTriageAgent } from '../agents/security-triage-agent.js';
import { triageReportSchema, trivyReportSchema } from '../schemas.js';
import { readTrivyReportTool } from '../tools/read-trivy-report-tool.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// agent/src/mastra/workflows -> repo root is four levels up
const REPO_ROOT = path.resolve(__dirname, '../../../..');
const SCANS_DIR = path.join(REPO_ROOT, 'scans');

const readReportStep = createStep(readTrivyReportTool);

const buildPromptStep = createStep({
  id: 'build-triage-prompt',
  inputSchema: trivyReportSchema,
  outputSchema: z.object({ prompt: z.string() }),
  execute: async ({ inputData }) => {
    const prompt = `Triage the following Trivy scan findings for OWASP Juice Shop.

Summary counts: ${JSON.stringify(inputData.summary)}

Findings:
${JSON.stringify(inputData.findings, null, 2)}`;
    return { prompt };
  },
});

const triageStep = createStep(securityTriageAgent, {
  structuredOutput: { schema: triageReportSchema },
});

const writeReportStep = createStep({
  id: 'write-triage-report',
  inputSchema: triageReportSchema,
  outputSchema: z.object({
    report: triageReportSchema,
    files: z.object({ json: z.string(), markdown: z.string() }),
  }),
  execute: async ({ inputData }) => {
    mkdirSync(SCANS_DIR, { recursive: true });
    const jsonPath = path.join(SCANS_DIR, 'agent-triage-report.json');
    const markdownPath = path.join(SCANS_DIR, 'agent-triage-report.md');

    writeFileSync(jsonPath, JSON.stringify(inputData, null, 2));

    const lines = [
      '# Agent Triage Report — OWASP Juice Shop',
      '',
      inputData.executiveSummary,
      '',
      `**Severity counts:** Critical ${inputData.severityCounts.critical}, High ${inputData.severityCounts.high}, Medium ${inputData.severityCounts.medium}, Low ${inputData.severityCounts.low}`,
      '',
      '## Prioritized Findings',
      '',
      ...inputData.prioritizedFindings.map(
        (f) =>
          `${f.rank}. **${f.package}** (${f.vulnerabilityId}, ${f.severity})\n   - Risk: ${f.riskExplanation}\n   - Fix: ${f.recommendation}`,
      ),
    ];
    writeFileSync(markdownPath, lines.join('\n') + '\n');

    return { report: inputData, files: { json: jsonPath, markdown: markdownPath } };
  },
});

export const securityTriageWorkflow = createWorkflow({
  id: 'security-triage-workflow',
  inputSchema: readTrivyReportTool.inputSchema!,
  outputSchema: writeReportStep.outputSchema,
})
  .then(readReportStep)
  .then(buildPromptStep)
  .then(triageStep)
  .then(writeReportStep)
  .commit();
