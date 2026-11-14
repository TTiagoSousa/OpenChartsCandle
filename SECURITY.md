# Security policy

## Supported versions

Only the latest release receives security fixes. Update to the newest tag before reporting.

| Version | Supported |
|---|---|
| Latest `1.x` | Yes |
| Older versions | No |

## Reporting a vulnerability

Please **do not open a public issue** for security problems.

Report it privately through GitHub: open the repository's **Security** tab and choose **Report a vulnerability** ([direct link](https://github.com/TTiagoSousa/OpenChartsCandle/security/advisories/new)). Include:

- the affected version or commit;
- what an attacker can do and how (a minimal page or snippet that reproduces it helps a lot);
- any idea you have for a fix.

You can expect a first answer within a week. Once the problem is confirmed, a fix is prepared in private and released as a new version, and the advisory is published with credit to you (unless you prefer to stay anonymous).

## Scope

OpenChartsCandle runs in the browser and has no runtime dependencies. The most relevant problems are, for example, script injection through data shown in the charts (labels, tooltips, symbol names) or through saved state read back from `localStorage`. Problems in the demo site's simulated data or in development dependencies are usually out of scope, but tell us if you are unsure.
