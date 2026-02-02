# 🧪 How to Test Story-Genius

## 1. Automated Verification (Recommended)
The easiest way to verify the entire stack is using the included Node.js script. It handles all endpoints and authentication checks automatically.

```bash
node scripts/verify-full-stack.js
```
**Expected Output:** `Results: 7 Passed, 0 Failed`

---

## 2. API Health Check
Open your browser to ensure the API is running:
- **Heath Status:** [http://localhost:3001/health](http://localhost:3001/health)
- **API Documentation:** [http://localhost:3001/api](http://localhost:3001/api)

---

## 3. Manual Testing (PowerShell / Windows)

> **Note:** In PowerShell, `curl` is an alias for `Invoke-WebRequest` which behaves differently than standard cURL. Use `curl.exe` explicitly.

### ✅ Check Health (Public)
```powershell
curl.exe -v http://localhost:3001/health
```
**Expected:** `200 OK`

### 🔒 Check Protected Endpoints (Auth Required)
Since these endpoints are protected by Clerk authentication, receiving a `401 Unauthorized` response **confirms the API is listening and secure**.

**Check Video Providers:**
```powershell
curl.exe -s http://localhost:3001/api/generation/providers
```
**Expected:** `{"error":"Unauthorized"}`

**Try Creating a Project:**
```powershell
curl.exe -s -X POST http://localhost:3001/api/assembly/create -H "Content-Type: application/json" -d "{}"
```
**Expected:** `{"error":"Unauthorized"}`

---

## 4. Troubleshooting
- **ECONNREFUSED:** The API server is not running. Start it with:
  ```bash
  pnpm --filter api dev
  ```
- **ERR_MODULE_NOT_FOUND:** Dependencies might be missing. Run:
  ```bash
  pnpm install
  pnpm --filter ai build
  pnpm --filter api build
  ```
