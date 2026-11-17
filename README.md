# Avenor Management System (Frontend)

Web and cross-platform Electron desktop frontend for the **Avenor Apparel Management System** — an internal operations, sales, production, inventory, delivery, and billing application built with React, TypeScript, Vite, Tailwind CSS, and Electron.

## Key Features

- **Role-Based Access Control**: Six staff roles (`Admin`, `Sales`, `Production`, `Store Keeper`, `Accounts`, `Delivery`) with route and action guards.
- **Brand Scoping**: Multi-brand separation across customers, catalog, inventory, quotations, orders, invoices, and reporting.
- **Sales & CRM**: Customer profiles, notes, documents, quotations, and centralized order tracking (`ORD-YYYY-XXXXXX`).
- **Operations & Production**: Artwork approvals, blank garment & raw material inventory, WIP allocation, customizable production stages (`Cutting`, `Printing`, `Embroidery`, `Sewing`, `Finishing`, `Packing`), and delivery dispatch tracking.
- **Finance & Commercial Printing**: Deposit bills, invoices, payment receipts, order profitability & expense tracking, and A4 PDF/print templates.
- **Desktop Packaging & Auto-Updates**: Windows NSIS and macOS DMG/ZIP builds with automatic updates from public GitHub Releases via `electron-updater`.

## Tech Stack

- **UI & Routing**: React 19, TypeScript, React Router (`HashRouter`), Tailwind CSS, Lucide Icons, Sonner
- **PDF & Print**: `jspdf`, `html2canvas`
- **Desktop Shell**: Electron, `electron-builder`, `electron-updater`
- **Build & Lint**: Vite, ESLint

## Prerequisites

- **Node.js**: v20+ recommended (v18+ supported)
- **npm**

## Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/savindu19990928/AvenorSystemFE.git
cd AvenorSystemFE
npm install
```

### 2. Environment Configuration (Optional)

By default, the app points to the configured API base URL in `src/utils/api.ts`. To point to a local or custom backend during development, copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Then set `VITE_API_BASE_URL` in `.env`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## Running the App

### Web Mode

Start the development server:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

Build the production static bundle (outputs to `dist/`):

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

### Desktop Mode (Electron)

Launch Vite and the Electron desktop window together with HMR:

```bash
npm run electron:dev
```

### Packaging Desktop Installers

Outputs are written to the `release/` directory:

- **Windows (x64 NSIS installer)**:
  ```bash
  npm run electron:build:win
  ```
- **macOS (Apple Silicon — M1/M2/M3/M4)**:
  ```bash
  npm run electron:build:mac:arm64
  ```
- **macOS (Intel)**:
  ```bash
  npm run electron:build:mac:x64
  ```
- **macOS (Universal / All architectures)**:
  ```bash
  npm run electron:build:mac:universal
  ```
  Or build both `arm64` and `x64` targets:
  ```bash
  npm run electron:build:mac
  ```

On macOS, drag `Avenor System` from the generated `.dmg` (`Avenor-System-<version>-<arch>.dmg`) into **Applications**. See [AUTO_UPDATE_GUIDE.md](./AUTO_UPDATE_GUIDE.md) for Gatekeeper notes on unsigned builds and details on GitHub Releases auto-updates.

### Docker (Web Hosting)

Build and serve the static web frontend via Docker on port `8080`:

```bash
docker build -t avenor-system-fe .
docker run -p 8080:8080 avenor-system-fe
```

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Vite web dev server |
| `npm run build` | Build production web bundle into `dist/` |
| `npm run lint` | Run ESLint across the repository |
| `npm run preview` | Preview the built `dist/` bundle |
| `npm run electron:dev` | Run Vite dev server and Electron desktop app |
| `npm run electron:build` | Build frontend and run `electron-builder` for current OS |
| `npm run electron:build:win` | Build Windows NSIS installer |
| `npm run electron:build:mac` | Build macOS `arm64` and `x64` targets |
| `npm run electron:build:mac:arm64` | Build macOS Apple Silicon target |
| `npm run electron:build:mac:x64` | Build macOS Intel target |
| `npm run electron:build:mac:universal` | Build macOS universal target |

## Project Structure

```text
├── .github/workflows/   # CI/CD workflows (release & macOS builds)
├── build/               # Desktop app icons (.ico, .icns, .png)
├── electron/            # Electron main process & preload bridge
├── public/              # Static public assets
├── src/
│   ├── assets/          # Bundled images and brand marks
│   ├── components/      # UI, workflow, layout, and print document components
│   ├── contexts/        # Auth and brand scope providers
│   ├── data/            # Navigation, workflow constants, company & brand metadata
│   ├── docs/            # Backend REST API & reporting specifications
│   ├── hooks/           # Custom React hooks
│   ├── pages/           # Application views (sales, operations, finance, admin)
│   ├── types/           # TypeScript interfaces
│   └── utils/           # API client, formatting, CSV, and PDF/print helpers
├── AUTO_UPDATE_GUIDE.md # Cross-platform installer & auto-update workflow guide
├── Dockerfile           # Multi-stage container build for web deployment
└── electron-builder.json
```

## Contributing & Security

- Contributions are welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a pull request.
- Please review [SECURITY.md](./SECURITY.md) for reporting vulnerabilities and secret-handling rules.

## License

Licensed under the [MIT License](./LICENSE).
