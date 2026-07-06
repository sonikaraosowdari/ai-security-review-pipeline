import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { severityEnum, trivyReportSchema } from '../schemas.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// agent/src/mastra/tools -> repo root is four levels up
const REPO_ROOT = path.resolve(__dirname, '../../../..');
const DEFAULT_REPORT_PATH = path.join(REPO_ROOT, 'scans', 'juice-shop-trivy-report.json');

function bestCvssScore(cvss: Record<string, any> | undefined): number | undefined {
  if (!cvss) return undefined;
  let best: number | undefined;
  for (const source of Object.values(cvss)) {
    for (const key of ['V3Score', 'V2Score']) {
      const score = source?.[key];
      if (typeof score === 'number') best = Math.max(best ?? 0, score);
    }
  }
  return best;
}

export const readTrivyReportTool = createTool({
  id: 'read-trivy-report',
  description:
    'Reads a Trivy JSON vulnerability scan report and returns a normalized, optionally severity-filtered list of findings with summary counts.',
  inputSchema: z.object({
    reportPath: z
      .string()
      .optional()
      .describe('Absolute path to a Trivy JSON report. Defaults to scans/juice-shop-trivy-report.json in the repo.'),
    minSeverity: severityEnum
      .optional()
      .describe('If set, only findings at or above this severity are returned.'),
  }),
  outputSchema: trivyReportSchema,
  execute: async (inputData) => {
    const reportPath = inputData.reportPath ?? DEFAULT_REPORT_PATH;
    const raw = JSON.parse(readFileSync(reportPath, 'utf-8'));

    const severityRank = { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 } as const;
    const minRank = inputData.minSeverity ? severityRank[inputData.minSeverity] : 0;

    const findings = [];
    for (const result of raw.Results ?? []) {
      for (const vuln of result.Vulnerabilities ?? []) {
        const severity = (vuln.Severity ?? 'LOW') as keyof typeof severityRank;
        if (severityRank[severity] < minRank) continue;
        findings.push({
          target: result.Target as string,
          pkg: vuln.PkgName as string,
          vulnerabilityId: vuln.VulnerabilityID as string,
          severity,
          installedVersion: vuln.InstalledVersion,
          fixedVersion: vuln.FixedVersion,
          title: vuln.Title,
          cvssScore: bestCvssScore(vuln.CVSS),
        });
      }
    }

    const summary = { total: findings.length, critical: 0, high: 0, medium: 0, low: 0 };
    for (const f of findings) {
      if (f.severity === 'CRITICAL') summary.critical++;
      else if (f.severity === 'HIGH') summary.high++;
      else if (f.severity === 'MEDIUM') summary.medium++;
      else summary.low++;
    }

    return { summary, findings };
  },
});
