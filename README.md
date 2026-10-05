# Avenor System

Admin system frontend built with React, Vite, Tailwind CSS, and Electron.

---

## 🚀 Running on MacBook (macOS)

### 1. Prerequisites
- **Node.js**: v18+ (v20+ recommended)
- **npm** or **pnpm** / **yarn**

### 2. Setup
Clone the repository to your MacBook and install dependencies:
```bash
git clone <repository-url>
cd AvenorSystemFE
npm install
```

### 3. Run in Desktop Mode (Development)
To start Vite dev server and launch the native Electron desktop window simultaneously:
```bash
npm run electron:dev
```
- The desktop application window will open automatically.
- Hot module replacement (HMR) is active: code changes in `src/` will instantly update inside the desktop app.

### 4. Build & Package for macOS (.dmg / .app)
To compile the production frontend and bundle it into an installable macOS application:

- **For Apple Silicon (M1 / M2 / M3 / M4 Macs)** *(Recommended)*:
  ```bash
  npm run electron:build:mac:arm64
  ```

- **For Intel Macs**:
  ```bash
  npm run electron:build:mac:x64
  ```

- **For All Architectures (arm64 & x64)**:
  ```bash
  npm run electron:build:mac
  ```

After building:
- Inspect the output files in the `release/` folder:
  - `Avenor System-<version>-arm64.dmg`
  - `Avenor System-<version>-mac.zip`
- Double-click the `.dmg` file and drag `Avenor System` into your **Applications** folder.

---

## 🌐 Running in Browser (Web Mode)
If you also want to run it as a regular web application:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

To build the static web bundle:
```bash
npm run build
```
Output is in the `dist/` directory.
