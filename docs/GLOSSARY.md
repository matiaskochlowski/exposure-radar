# Glossary

Domain terms the agent and the UI copy should use consistently.

| Term                     | Meaning                                                                                                    |
| ------------------------ | ---------------------------------------------------------------------------------------------------------- |
| **CVE**                  | Common Vulnerabilities and Exposures: the public id of a specific vulnerability, e.g. `CVE-2021-44228`.    |
| **KEV**                  | CISA's Known Exploited Vulnerabilities catalog: CVEs with evidence of exploitation in the wild.            |
| **Due date**             | The KEV remediation deadline for US federal agencies. Used here as an urgency signal for everyone.         |
| **Known ransomware use** | KEV flag: the CVE is known to be used in ransomware campaigns (`Known` / `Unknown`).                       |
| **EPSS**                 | FIRST's Exploit Prediction Scoring System: probability (0–1) that a CVE is exploited in the next 30 days.  |
| **EPSS percentile**      | Where a CVE's EPSS score ranks among all scored CVEs (0–1).                                                |
| **CVSS**                 | Severity of a vulnerability in isolation. Not used for ranking here. KEV + EPSS say more about likelihood. |
| **CWE**                  | Common Weakness Enumeration: the class of bug (e.g. `CWE-78`, OS command injection).                       |
| **Exposure**             | In this app, one KEV entry together with its EPSS score and your triage state.                             |
| **Priority score**       | 0–100 sum of explainable contributions (ADR 0002). Bands: Critical ≥ 70, High ≥ 50, Medium ≥ 30, Low.      |
| **Triage status**        | `new` → `investigating` → `mitigated`, or `accepted` (risk accepted). Closed = mitigated or accepted.      |
