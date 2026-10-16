# Avenor System - 1-Click Setup & Cross-Platform Auto-Update Guide

This document explains the **1-Click Setup** and **Automatic Update System** for **Avenor Management System** across both **Windows** and **macOS**.

---

## ⚡ 1-Click Setup Experience for Users

### 1. Windows (1-Click Installer)
- **File**: `Avenor-System-Setup-X.X.X.exe`
- **Installation**: Double-click the file **ONCE**.
- **What happens automatically**:
  - Installs silently in seconds without any confusing wizards or "Next" buttons.
  - Automatically creates a Desktop shortcut.
  - Automatically creates a Start Menu shortcut.
  - Automatically launches the application right after installation.
  - Does NOT prompt for administrator elevation (installs into user application space).

### 2. macOS (DMG Installation & Gatekeeper Note)
- **Disk Image (`.dmg`)**:
  - **Apple Silicon (M1/M2/M3/M4)**: Download `Avenor-System-X.X.X-arm64.dmg`
  - **Intel Macs**: Download `Avenor-System-X.X.X-x64.dmg`
  - Mount the DMG and drag `Avenor System` into `/Applications`.

> [!IMPORTANT]
> **If macOS says *"“Avenor System” is damaged and can’t be opened"***:
> This is macOS **Gatekeeper** blocking apps downloaded from the internet that are not signed with a paid Apple Developer certificate.
> 
> **To fix it instantly on your Mac:**
> 1. Open **Terminal** (`Cmd + Space` -> type `Terminal`).
> 2. Run this single command:
>    ```bash
>    xattr -cr "/Applications/Avenor System.app"
>    ```
> 3. Double-click **Avenor System** in `/Applications`. It will now launch smoothly!
> 
> *Alternatively on macOS Sonoma / Sequoia:*
> Open **System Settings** → **Privacy & Security** → scroll to the bottom under **Security** → click **"Open Anyway"**.

---

## 🚀 How Installed Devices Get Updates Automatically

Because your GitHub Personal Access Token is embedded in the application bundle (`electron/github-token.txt`):
- **All installed devices authenticate to your private GitHub repository automatically.**
- **No manual token entry or configuration is required on client computers!**

### The Automatic Update Lifecycle:
1. **Startup Check**:
   - 4 seconds after opening the app, it contacts GitHub Releases via the GitHub API using the bundled token.
   - If a new version exists, it silently downloads the update in the background.

2. **In-App Progress & Alerts**:
   - Shows a downloading indicator with progress percentage in the bottom corner.
   - Once ready, an alert with a **"Restart & Update Now"** button appears.
   - If the user ignores it, **the update will automatically apply the next time they close and re-open the software**.

3. **Background Periodic Checks**:
   - Every 4 hours while the app remains open.

4. **Manual Check**:
   - Users can click the **"Updates"** button at the bottom of the sidebar at any time.

---

## 📦 How to Publish a New Update to All Devices (3 Steps)

### Step 1: Bump the Version in `package.json`
Change `"version"` (e.g. from `0.0.1` to `0.0.2`):
```json
{
  "name": "avenor-system-fe",
  "productName": "Avenor Management System",
  "version": "0.0.2",
  ...
}
```

### Step 2: Commit and Push
```bash
git add .
git commit -m "Release v0.0.2: Description of updates"
git push origin master
```

### Step 3: Tag and Trigger the Release
```bash
git tag v0.0.2
git push origin v0.0.2
```
*(Or go to GitHub -> **Actions** -> **Release & Auto Update** -> **Run workflow**).*

---

## ⚙️ What GitHub Actions Builds

The workflow (`.github/workflows/release.yml`) builds and publishes to GitHub Releases:

| Platform | Files Produced | Purpose |
|---|---|---|
| **Windows** | `Avenor System Setup X.X.X.exe` | 1-Click Installer |
| **Windows** | `latest.yml` | Auto-update manifest for Windows |
| **macOS (Apple Silicon)** | `Avenor System-X.X.X-arm64.pkg` | 1-Click macOS Installer |
| **macOS (Apple Silicon)** | `Avenor System-X.X.X-arm64.dmg` | DMG Disk Image |
| **macOS (Apple Silicon)** | `Avenor System-X.X.X-arm64-mac.zip` | Background auto-update package |
| **macOS (Intel)** | `Avenor System-X.X.X.pkg` | 1-Click macOS Installer |
| **macOS (Intel)** | `Avenor System-X.X.X.dmg` | DMG Disk Image |
| **macOS (Intel)** | `Avenor System-X.X.X-mac.zip` | Background auto-update package |
| **macOS** | `latest-mac.yml` | Auto-update manifest for macOS |
