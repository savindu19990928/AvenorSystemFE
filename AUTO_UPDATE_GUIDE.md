# Avenor System - Cross-Platform Auto-Update & Release Guide (Windows & macOS)

This document explains how the automatic update system works for **Avenor Management System** on both **Windows** and **macOS**, and how you can release new versions to all installed devices via GitHub.

---

## 🚀 How Auto-Update Works for Users

When a new version is released on GitHub:

1. **Automatic Check on Startup**:
   - Every time a user launches the software on Windows or macOS, the app checks GitHub Releases in the background (after a brief 4-second delay so startup is immediate and smooth).
   - If an update is detected, the app automatically begins downloading it in the background.

2. **In-App & System Notifications**:
   - **While downloading**: A progress indicator appears in the bottom right corner showing the download percentage.
   - **Once downloaded**: Both a native system prompt and an in-app banner appear with a **"Restart & Update Now"** button.
   - **Zero-effort updates**: If the user ignores the prompt or clicks "Later", the update will **automatically install the moment they close the app**. Next time they launch it, it will already be running the newest version!

3. **macOS-Specific Experience**:
   - **Both Architectures Supported**: Builds and manifests are provided for both Apple Silicon (`arm64` — M1, M2, M3, M4 Macs) and Intel Macs (`x64`).
   - **Seamless Zip Updates**: On macOS, `electron-updater` uses `.zip` files and `latest-mac.yml` to replace the `/Applications/Avenor System.app` bundle.
   - **Smart Fallback**: If running in an unsigned or ad-hoc environment where macOS Gatekeeper blocks automatic binary swapping, the app immediately presents a 1-click **"Download DMG & Update"** card that directly opens the matching installer DMG for their specific Mac architecture.

4. **Periodic & Manual Checks**:
   - The app automatically re-checks for updates every 4 hours if left open all day.
   - Users can also click the **"Updates"** button next to the version number at the bottom of the sidebar at any time.

---

## 📦 How to Publish an Update (Step-by-Step)

Whenever you push new code or features to GitHub and want all installed machines (Windows & Mac) to update automatically, follow these 3 steps:

### Step 1: Bump the Version Number
Open `package.json` and increase the version number (e.g., from `0.0.1` to `0.0.2`):
```json
{
  "name": "avenor-system-fe",
  "productName": "Avenor Management System",
  "version": "0.0.2",
  ...
}
```

### Step 2: Commit and Push to GitHub
```bash
git add .
git commit -m "Release v0.0.2: Description of updates"
git push origin master
```

### Step 3: Trigger the Build & Release

You have two simple ways to trigger the release:

#### Option A: Using a Git Tag (Recommended)
Tag your commit with `v` followed by the version number:
```bash
git tag v0.0.2
git push origin v0.0.2
```

#### Option B: From the GitHub Website
1. Go to your repository on GitHub: `https://github.com/savindu19990928/AvenorSystemFE`
2. Click the **Actions** tab.
3. Select **Release & Auto Update** from the left sidebar.
4. Click **Run workflow** -> **Run workflow**.

---

## ⚙️ What Happens in GitHub Actions

The workflow (`.github/workflows/release.yml`) runs a parallel matrix build on both `windows-latest` and `macos-14`:

1. **Windows Build**:
   - Builds `Avenor System Setup X.X.X.exe` and blockmaps.
   - Publishes `latest.yml` (Windows update manifest).

2. **macOS Build**:
   - Builds `Avenor-System-X.X.X-arm64.dmg` & `Avenor-System-X.X.X-arm64-mac.zip` (Apple Silicon).
   - Builds `Avenor-System-X.X.X.dmg` & `Avenor-System-X.X.X-mac.zip` (Intel).
   - Publishes `latest-mac.yml` (macOS update manifest).

3. All assets are published into a single, unified GitHub Release.

---

## 🔒 Public vs Private Repository Setup

### If your GitHub Repository is Public:
No additional configuration is needed! GitHub Releases are publicly accessible, and all Windows and Mac client devices will download updates seamlessly.

### If your GitHub Repository is Private:
GitHub blocks unauthorized access to private release assets. You have two options:
- **Option 1 (Easiest)**: Set the repository to Public on GitHub (**Settings** -> **Change repository visibility** -> **Public**).
- **Option 2 (Keep repo private)**:
  1. In GitHub, go to **Settings** -> **Developer Settings** -> **Personal Access Tokens** -> **Fine-grained tokens**.
  2. Create a token with Read-Only access to **Contents** (which includes releases).
  3. On client machines, place the token into a file named `github-token.txt` in the app's user data folder:
     - **Windows**: `%APPDATA%\Avenor System\github-token.txt`
     - **macOS**: `~/Library/Application Support/Avenor System/github-token.txt`
     - Or set the environment variable `GH_TOKEN`.
