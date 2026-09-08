---
name: Carte des entraves metro - Deployment Safety
description: "Safety rules for deploying code to production. NEVER push without explicit permission."
---

# ⛔ CRITICAL DEPLOYMENT RULES FOR CESTDEJALENFER

## ABSOLUTE RULE: Never Deploy Without Explicit Permission

**main branch = PRODUCTION (GitHub Pages). Every commit is live in ~2-3 minutes.**

### You MUST:
- ✓ Validate code locally (`node --check`)
- ✓ Test fully on localhost before ANY git operation
- ✓ Wait for user to explicitly say "ok deploy", "pousse", "push", or "deploy"
- ✓ Report all errors immediately before committing

### You MUST NOT:
- ✗ Run `git push origin main` without explicit user permission
- ✗ Commit untested code
- ✗ Deploy buggy viewport filtering, enrichment logic, or rendering changes without full validation
- ✗ Assume testing passed just because `node --check` succeeds (HTTP 200 and syntax pass ≠ behavior works)
- ✗ Deploy and then test in production (this puts broken code on the live site)

### Error Pattern to Avoid (September 8, 2026):
1. Made viewport filtering changes to reduce render lag
2. Committed to main without full behavior testing  
3. Pushed to production
4. Lines disappeared during panning on live site
5. Had to revert multiple times publicly
6. User discovered broken code was live

**This sequence will not happen again.**

### Correct Workflow:
1. Make changes to files
2. `node --check` on modified files
3. Create test script or manual validation
4. Run test on http://localhost:5500
5. Show results to user
6. **Wait for "ok deploy" or explicit permission**
7. Only then: `git commit` + `git push origin main`

### If You Accidentally Commit:
- Do NOT push
- Tell user immediately
- Propose `git reset --soft HEAD~1` (undo locally) or `git revert` (revert publicly)
- Wait for permission before pushing

---

*Last incident: Deployed buggy code without testing, caused geometry disappearance, user had to see broken production site.*
*Do not repeat this.*
