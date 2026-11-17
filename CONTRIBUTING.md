# Contributing to Avenor System FE

Thank you for your interest in contributing!

## Development Setup

1. Fork and clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Optionally create a `.env` file from `.env.example` to point `VITE_API_BASE_URL` at your local or staging API server.
4. Start the web dev server (`npm run dev`) or desktop app (`npm run electron:dev`).

## Before Submitting a Pull Request

- Run lint and production build checks:
  ```bash
  npm run lint
  npm run build
  ```
- Keep changes focused and well-typed (TypeScript strict mode).
- **Never commit secrets**, API tokens, `.env` files, or `electron/github-token.txt`.
- Describe what changed and why in your pull request description.
