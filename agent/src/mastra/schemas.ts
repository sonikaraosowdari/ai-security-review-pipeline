import { z } from 'zod';

export const severityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

export const trivyFindingSchema = z.object({
  target: z.string(),
  pkg: z.string(),
  vulnerabilityId: z.string(),
  severity: severityEnum,
  installedVersion: z.string().optional(),
  fixedVersion: z.string().optional(),
  title: z.string().optional(),
  cvssScore: z.number().optional(),
});

export const trivyReportSchema = z.object({
  summary: z.object({
    total: z.number(),
    critical: z.number(),
    high: z.number(),
    medium: z.number(),
    low: z.number(),
  }),
  findings: z.array(trivyFindingSchema),
});

export const triagePromptSchema = z.object({
  prompt: z.string(),
});

export const triagedFindingSchema = z.object({
  rank: z.number().describe('Priority order, 1 = most urgent'),
  package: z.string(),
  vulnerabilityId: z.string(),
  severity: severityEnum,
  riskExplanation: z
    .string()
    .describe('1-2 sentences on why this matters in context, not just the CVE description'),
  recommendation: z.string().describe('Concrete remediation step, e.g. upgrade to version X'),
});

export const triageReportSchema = z.object({
  executiveSummary: z.string().describe('2-4 sentence summary for a non-security audience'),
  severityCounts: z.object({
    critical: z.number(),
    high: z.number(),
    medium: z.number(),
    low: z.number(),
  }),
  prioritizedFindings: z.array(triagedFindingSchema),
});
