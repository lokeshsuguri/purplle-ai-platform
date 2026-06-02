# Purplle AI Platform — Submission Readiness Checklist

**Generated:** June 2, 2026
**Status:** ⚠️ **CRITICAL ISSUES FOUND**

---

## 🔴 CRITICAL ISSUES (Must Fix Before Submission)

### 1. Missing `.gitignore` File
**Status:** ❌ NOT FOUND  
**Risk:** HIGH — Large files and dependencies will be committed

**Required entries:**
```gitignore
# Environment
.env
.env.local
.env.*.local

# Dependencies
node_modules/
backend/node_modules/
frontend/node_modules/
.venv/
venv/
ai-service/venv/
__pycache__/
*.pyc
*.pyo
*.egg-info/

# Large model files
ai-service/yolov8n.pt
ai-service/models/**/*.pt
ai-service/models/**/*.onnx

# Build artifacts
frontend/dist/
backend/build/
*.log
npm-debug.log*
yarn-debug.log*

# IDE
.vscode/
.idea/
*.swp
*.swo
.DS_Store
Thumbs.db

# OS
.DS_Store
desktop.ini

# Misc
.cache/
.pytest_cache/
.coverage
coverage/
dist/
build/
```

**Action:** Create `.gitignore` before commit

---

### 2. Large Model File (6.23 MB)
**File:** `ai-service/yolov8n.pt`  
**Status:** ❌ WILL BE COMMITTED (no .gitignore)  
**Risk:** HIGH — Repository bloat; slow clone/downloads

**Solution Options:**
- **Option A (Recommended):** Auto-download on first run
  ```python
  # ai-service/src/main.py — add to startup
  import os
  from pathlib import Path
  
  MODEL_PATH = Path("yolov8n.pt")
  if not MODEL_PATH.exists():
      from ultralytics import YOLO
      print("Downloading YOLOv8n model...")
      model = YOLO("yolov8n.yaml")
      model.export(format="pt", imgsz=640)
  ```

- **Option B:** Document in README for manual download
  ```bash
  # Add to quickstart
  cd ai-service && wget https://github.com/ultralytics/assets/releases/download/v8.1.0/yolov8n.pt
  ```

**Action:** Implement auto-download OR create download script

---

### 3. Missing Environment Variable Files

#### 3a. AI Service `.env.example`
**Status:** ❌ NOT FOUND  
**Current state:** No example `.env` for `ai-service/`

**Required file: `ai-service/.env.example`**
```env
BACKEND_URL=http://localhost:5000
AI_PORT=8000
```

**Action:** Create `ai-service/.env.example`

---

#### 3b. Frontend `.env.example`
**Status:** ❌ NOT FOUND  
**Current state:** Frontend uses `VITE_API_URL` but no example provided

**Required file: `frontend/.env.example`**
```env
VITE_API_URL=http://localhost:5000
```

**Action:** Create `frontend/.env.example`

---

## 🟡 MEDIUM PRIORITY ISSUES

### 4. Hardcoded Localhost in Vite Dev Server
**File:** `frontend/vite.config.js`  
**Lines:** 10, 14  
**Issue:** Proxy targets hardcoded to `localhost:5000` — fine for dev but should use env var for flexibility

**Current:**
```javascript
target: 'http://localhost:5000',
```

**Recommended (optional for hackathon):**
```javascript
target: process.env.VITE_API_URL || 'http://localhost:5000',
```

**Action:** Optional — clarify in README if judges need to modify

---

### 5. Incomplete Docker Setup
**Status:** ⚠️ PARTIAL  
**Found:** Docker configs in `docs/DEPLOYMENT.md` but no actual Dockerfiles

**Missing files:**
- `backend/Dockerfile` — ❌
- `ai-service/Dockerfile` — ❌
- `frontend/Dockerfile` — ❌
- `docker-compose.yml` — ❌
- `frontend/nginx.conf` — ❌ (referenced in docs)

**For Hackathon:** Docker is optional, but if judges want to deploy, this will fail

**Action:** Either:
1. Remove Docker references from README if not submitting Docker setup
2. Create actual Dockerfiles + docker-compose.yml
3. Note in README: "Docker configs in `docs/DEPLOYMENT.md` are template reference only"

---

### 6. Missing Dependencies Documentation
**Status:** ⚠️ PARTIAL

**Verified:✅**
- `backend/package.json` — Complete
- `frontend/package.json` — Complete  
- `ai-service/requirements.txt` — Complete

**Missing:** System-level dependencies not documented
- **Backend:** Node.js 20+
- **Frontend:** Node.js 20+
- **AI Service:** Python 3.10+, libgl1, libglib2.0-0 (for OpenCV)
- **Database:** MongoDB 6+ (local or Atlas)

**Action:** Add to README Prerequisites section

---

## 🟢 GOOD PRACTICES FOUND

✅ Root `package.json` with convenient scripts  
✅ `backend/.env.example` exists  
✅ Environment variables properly used (not hardcoded paths)  
✅ API calls use `VITE_API_URL` env var  
✅ Database connection uses `MONGO_URI` env var  
✅ `DEPLOYMENT.md` documentation exists  
✅ `README.md` comprehensive and clear  

---

## 🔧 PRE-SUBMISSION CHECKLIST

### Automated Checks
- [ ] Run `.gitignore` validation
- [ ] Verify no `node_modules/` committed
- [ ] Verify no `__pycache__/` committed
- [ ] Check for hardcoded paths (none found ✅)
- [ ] Verify all `.env.example` files exist
- [ ] Test build on clean machine

### Manual Checks
- [ ] Clone repo in temp folder and test full setup
- [ ] Verify all scripts in root `package.json` work
- [ ] Test `npm run install:all` 
- [ ] Test `npm run dev:backend`, `dev:frontend`, `dev:ai` individually
- [ ] Verify socket.io connection works
- [ ] Test `POST /analyze/all-cameras` flow end-to-end
- [ ] Check MongoDB collections created correctly
- [ ] Verify events are persisted (not just occupancy)

### Documentation Checks
- [ ] README has complete Quick Start section ✅
- [ ] All env vars documented ✅
- [ ] API reference complete ✅
- [ ] Architecture diagram clear ✅
- [ ] Instructions for demo (no cameras) included ✅

---

## 📋 SUBMISSION READINESS SUMMARY

| Category | Status | Priority |
|----------|--------|----------|
| Code Quality | ✅ Good | — |
| Dependencies | ✅ Complete | — |
| Documentation | ✅ Excellent | — |
| Environment Config | ⚠️ Partial | **HIGH** |
| Git Cleanliness | ❌ Missing .gitignore | **CRITICAL** |
| Large Files | ⚠️ Model not managed | **CRITICAL** |
| Docker Support | ⚠️ Templates only | Medium |
| Portability | ✅ Good | — |

---

## 🚀 FINAL ACTIONS BEFORE SUBMISSION

### Critical (Do First)
1. **Create `.gitignore`** — 5 minutes
   ```bash
   # Copy the .gitignore template above to repo root
   ```

2. **Create `ai-service/.env.example`** — 1 minute
   ```bash
   # File content shown above
   ```

3. **Create `frontend/.env.example`** — 1 minute
   ```bash
   # File content shown above
   ```

4. **Handle YOLOv8n Model** — 10 minutes  
   Choose one:
   - Remove from git: `git rm --cached ai-service/yolov8n.pt`
   - Implement auto-download
   - Add download script to README

### Recommended
5. **Clean Git History** — 5 minutes
   ```bash
   git add .gitignore
   git commit -m "Add .gitignore"
   # Then remove large files and re-commit
   ```

6. **Test Full Setup on Clean Clone** — 20 minutes
   ```bash
   cd /tmp
   git clone <repo>
   cd purplle-ai-platform
   npm run install:all
   # Terminal 1: npm run dev:backend
   # Terminal 2: npm run dev:frontend  
   # Terminal 3: npm run dev:ai
   # Test dashboard loads and curl POST /analyze/all-cameras
   ```

### Optional
7. **Create Dockerfiles** (if you want Docker support)
   - Copy templates from `docs/DEPLOYMENT.md`
   - Create `backend/Dockerfile`, `ai-service/Dockerfile`, etc.
   - Test `docker-compose up`

---

## 📝 NOTES FOR JUDGES

Add to README top-level:
```markdown
## 🏆 Hackathon Submission

**How to Run (No Real CCTV Needed):**

1. **Install**
   ```bash
   npm run install:all
   ```

2. **Configure**
   ```bash
   cd backend && cp .env.example .env
   cd ../ai-service && cp .env.example .env
   cd ../frontend && cp .env.example .env
   ```

3. **Start Services** (3 terminal windows)
   ```bash
   # Terminal 1 — Backend
   npm run dev:backend
   
   # Terminal 2 — Frontend
   npm run dev:frontend
   
   # Terminal 3 — AI Service
   npm run dev:ai
   ```

4. **Trigger Demo**
   ```bash
   # Simulated data for all 5 cameras
   curl -X POST http://localhost:8000/analyze/all-cameras
   ```

5. **View Dashboard**
   - Open http://localhost:5173
   - See occupancy, footfall, dwell time, queue depth updates in real-time

**Expected Results:**
- Occupancy dashboard updates live
- Event log fills with ENTRY/EXIT/DWELL/QUEUE events
- Charts show real-time analytics
```

---

## ✅ ESTIMATED COMPLETION TIME

- Critical fixes: **~15 minutes**
- Clean git history: **~5 minutes**
- Test full setup: **~20 minutes**

**Total: ~40 minutes before final submission**

---

**Next Step:** Start with Critical Issue #1 (Create `.gitignore`)
