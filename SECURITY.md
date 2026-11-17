# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this repository, please **do not** open a public issue with exploit details. Instead, report it privately to the maintainers at `hello@avenorapparel.lk` or via GitHub's private security advisory feature (if enabled on the repository).

Please include:
- A description of the vulnerability and its potential impact
- Steps to reproduce or a minimal proof of concept
- Any suggested remediation if known

## Security Hygiene for Contributors

- Never commit `.env` files, tokens, passwords, certificates, or private keys.
- Desktop auto-updates fetch from public GitHub Releases (`electron-updater`), so no GitHub Personal Access Token should ever be added to `electron/github-token.txt` or committed to the repository.
