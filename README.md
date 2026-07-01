# AI Security Review Pipeline

An AI agent-based pipeline that automates web application security review — combining static/dependency scanning (Trivy), a live target application (OWASP Juice Shop), and an AI agent framework (Mastra.ai) to triage, contextualize, and report findings with less manual review overhead.

## Status

- [x] OWASP Juice Shop set up locally via Docker
- [x] Trivy scanning integrated
- [ ] Mastra.ai agent pipeline built
- [ ] Findings workflow documented
- [ ] Example run + sample output published

## Why this project

Manual security review doesn't scale — triaging scanner output, correlating findings across tools, and writing them up for a team takes as long as the scan itself. This project explores whether an AI agent pipeline can take raw scanner output and produce a structured, prioritized, human-readable review with minimal manual intervention — using a known-vulnerable app (Juice Shop) as a safe, reproducible testbed.

## Architecture

```
┌─────────────────┐      ┌──────────────┐      ┌────────────────────┐      ┌──────────────────┐
│  OWASP Juice     │      │   Trivy      │      │   Mastra.ai Agent   │      │  Findings Report  │
│  Shop (target)   │─────▶│  (scanner)   │─────▶│   (triage/analyze)  │─────▶│  (markdown/JSON)  │
│  Docker, :3000   │      │              │      │   TypeScript        │      │                   │
└─────────────────┘      └──────────────┘      └────────────────────┘      └──────────────────┘
```

*(Diagram will be updated as the agent pipeline is built out — infrastructure runs on AWS.)*

- **Target application:** [OWASP Juice Shop](https://owasp.org/www-project-juice-shop/), an intentionally vulnerable web app, run locally via Docker as a safe, reproducible test target.
- **Scanning:** [Trivy](https://trivy.dev/) for dependency, container, and vulnerability scanning against the running app/image.
- **Agent layer:** Built with [Mastra.ai](https://mastra.ai/) (TypeScript) — takes raw scan output and produces triaged, prioritized, and explained findings.
- **Infrastructure:** AWS, with CubeGoat used for cloud misconfiguration/infra-side testing.

## OWASP Juice Shop (Local Setup)

Juice Shop is running locally as the first step in this project, providing a consistent vulnerable target for the pipeline to scan.

### How it was set up

```bash
docker pull bkimminich/juice-shop
docker run -d --name juice-shop -p 3000:3000 bkimminich/juice-shop
```

### Verifying it's running

```bash
docker ps --filter name=juice-shop
curl -I http://localhost:3000
```

The app is available at http://localhost:3000.

### Useful commands

```bash
docker stop juice-shop     # stop the container
docker start juice-shop    # restart it
docker rm -f juice-shop    # remove it
docker logs juice-shop     # view logs
```

## Trivy Scanning

[Trivy](https://trivy.dev/) scans the running Juice Shop image for OS package and Node.js dependency vulnerabilities. Reports are saved under `scans/` — a human-readable table for review and a JSON version intended as structured input for the future Mastra.ai agent stage.

### How it was run

```bash
# Human-readable table
trivy image --scanners vuln --severity CRITICAL,HIGH,MEDIUM,LOW \
  -f table -o scans/juice-shop-trivy-report.txt bkimminich/juice-shop

# Structured JSON (for agent consumption)
trivy image --scanners vuln --severity CRITICAL,HIGH,MEDIUM,LOW \
  -f json -o scans/juice-shop-trivy-report.json bkimminich/juice-shop
```

### Results (2026-07-01)

79 total vulnerabilities found across OS packages and Node.js dependencies:

| Severity | Count |
|---|---|
| CRITICAL | 5 |
| HIGH | 35 |
| MEDIUM | 28 |
| LOW | 11 |

Top 5 most severe (by CVSS score):

| # | Package | CVE / ID | Severity | CVSS | Issue |
|---|---|---|---|---|---|
| 1 | `jsonwebtoken` | CVE-2015-9235 | CRITICAL | 9.8 | Verification step can be bypassed with an altered token — attacker can forge valid-looking JWTs |
| 2 | `crypto-js` | CVE-2023-46233 | CRITICAL | 9.1 | PBKDF2 implementation is ~1.3M times weaker than the 1993 spec — trivially crackable key derivation |
| 3 | `lodash` | CVE-2019-10744 | CRITICAL | 9.1 | Prototype pollution in `defaultsDeep` — can lead to RCE or DoS depending on usage |
| 4 | `express-jwt` | CVE-2020-15084 | HIGH | 9.1 | Authorization bypass — improper audience/algorithm validation lets attackers forge auth |
| 5 | `tar` (node-tar) | CVE-2026-23950 | HIGH | 8.8 | Arbitrary file overwrite via Unicode path collision during extraction |

The `jsonwebtoken` and `express-jwt` findings are notable together — they hit the exact authentication mechanism Juice Shop's login/JWT flow relies on, making them good candidates to prioritize first once the agent triage stage exists.

This is expected — Juice Shop intentionally ships outdated, vulnerable dependencies as training material. Full details are in `scans/juice-shop-trivy-report.txt` and `scans/juice-shop-trivy-report.json`.

## Mastra.ai Agent Pipeline

*(To be documented once built — will include agent architecture, what the agent does with raw scanner output, and how it prioritizes/contextualizes findings.)*

## Example Finding

*(To be added once the pipeline produces its first end-to-end result — a before/after showing raw Trivy output vs. the agent's triaged, human-readable version.)*

## Tech Stack

- **Language:** TypeScript
- **Agent framework:** Mastra.ai
- **Scanner:** Trivy
- **Target app:** OWASP Juice Shop (Docker)
- **Infrastructure:** AWS, CubeGoat

## Next Steps

- [ ] Define scope for AI-assisted security review
- [ ] Add tooling/scripts for automated scanning
- [ ] Document findings workflow
- [ ] Publish sample findings output

## Background

This project is part of a Security Engineering internship focused on building AI agent-based tooling for security review automation.
