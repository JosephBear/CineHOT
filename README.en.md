# CinemaHOT v0.1.0

A cinematography news aggregator based on the [AIHOT framework](https://github.com/KKKKhazix/AIHOT), under the retained [MIT License](LICENSE).

**Local trial only.** Not publicly launched. Collection, paid model calls and outbound integrations are disabled by default. Selection thresholds have not been calibrated for cinematography.

The 17 configured sources include manufacturers, professional media, organizations and creators, including CineHello. Articles default to summaries and original links. The application supports event grouping, topics, daily/weekly/monthly reports, RSS, API, Markdown and MCP.

See the [Chinese README](README.md), [local setup](docs/deployment/local-trial.md), [sources](docs/sources/catalog.md), [branding](docs/branding/README.md) and [labeling workflow](docs/quality/calibration.md).

The local `.data/labeling/` directory contains 101 real article metadata records with blank human labels. This convenience sample covers five sources and is not evidence of selection quality. No paid evaluation was run. Public launch requires calibration, live collection verification, operator/contact details and user approval of the terms and privacy notice.

Requires Node 24 and PostgreSQL 17 with LZ4 and pg_trgm. The prepared runtime paths are specific to this computer; follow the local setup instructions to start it. Private `.env` files and `.data/` must remain outside Git.


The current local installation has explicitly enabled an eight-hour collection trial and a rolling 120-request/day LLM budget. Fresh deployments retain disabled defaults. See the [documentation index](docs/README.md), [deployment](docs/deployment/README.md), [source management](docs/sources/README.md), [operations](docs/operations/README.md) and [release notes](docs/releases/v0.1.0.md). Runtime secrets, budgets and article databases are not part of the repository.
