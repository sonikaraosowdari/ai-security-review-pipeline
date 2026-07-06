import { mastra } from './mastra/index.js';

const run = await mastra.getWorkflow('securityTriageWorkflow').createRun();
const result = await run.start({ inputData: {} });

if (result.status !== 'success') {
  console.error('Triage workflow did not complete successfully:', result.status);
  if (result.status === 'failed') console.error(result.error);
  process.exit(1);
}

console.log(`Wrote ${result.result.files.json}`);
console.log(`Wrote ${result.result.files.markdown}`);
console.log('\n' + result.result.report.executiveSummary);
