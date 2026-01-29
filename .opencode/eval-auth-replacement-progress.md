# Eval Auth Replacement - Progress Report

## Current Status: Mostly Implemented

**Progress: ~85% complete**

✅ Backend implementation (evalSetup.ts, http.ts)
✅ EvalHelpers updated (uses eval-teacher)
✅ Evals provider updated (supports setup/cleanup flow)

⏳ Testing end-to-end
⏳ CI/CD configuration
⏳ Enhanced security (optional)

## What Has Been Done

### 1. **Analysis Phase** ✅

- Examined current evals repository structure and API key auth mechanism
- Analyzed Better Auth integration (not WorkOS as mentioned in outdated docs)
- Understood teacher/student/space/document creation flow
- Identified security implications and proposed layered security approach

### 2. **Backend Implementation** ✅

Created secure eval setup functions in `apps/backend/convex/evalSetup.ts`:

#### **Key Functions:**

- `setupEvalEnvironment()` - HTTP endpoint to create test environment
- `cleanupEvalEnvironment()` - HTTP endpoint to cleanup test data
- `cleanupOldEvalData()` - Internal mutation for TTL-based cleanup (24h)

#### **Security Features:**

- API key authentication (`X-Eval-Api-Key` header)
- Environment protection (disabled in production by default)
- Cleanup-first approach (deletes existing eval data before creating new)
- Deterministic test user IDs (`eval-teacher`, `eval-student`)

#### **Test Data Created:**

1. Teacher user profile (`eval-teacher` with `isTeacher: true`)
2. Student user profile (`eval-student` with `isStudent: true`)
3. Space linking teacher and student for "English" language
4. Test document in the space

### 3. **HTTP Routing Updates** ✅

Updated `apps/backend/convex/http.ts` to include new endpoints:

- `POST /eval/setup` - Setup test environment
- `POST /eval/cleanup` - Cleanup test environment
- `POST /eval/run` - Existing endpoint (updated to use `eval-teacher`)

### 4. **Updated Existing Eval Endpoint** ✅

Modified `apps/backend/convex/evalHelpers.ts`:

- Changed from `eval-test-user` to `eval-teacher` for proper authentication
- Maintains backward compatibility with existing evals

## What Still Needs to Be Done

### 1. **Enhanced Security** ⏳

**Planned enhancements (optional for MVP):**

- HMAC-signed requests with timestamp/nonce (prevent replay attacks)
- Rate limiting for eval endpoints
- IP allowlisting for CI/CD environments
- Audit logging for all eval operations

### 2. **Document Content Integration** ⏳

**Optional enhancement:**

- Store fixture document content in test documents
- Fetch document content from database instead of passing XML
- Would require modifying evalHelpers to support documentId parameter

### 3. **Testing** ⏳

**Required tests:**

1. Test setup endpoint creates correct test data
2. Test cleanup endpoint removes all eval data
3. Test evals work with new authentication
4. Test security features (API key validation, environment protection)
5. Test TTL-based cleanup works

### 4. **CI/CD Integration** ⏳

**Required:**

- Update GitHub Actions workflows to use new auth flow
- Set up API key secrets in CI/CD
- Configure environment variables for eval endpoints

## Architecture Decisions Made

### **Security Approach: Layered Defense**

1. **API Key Authentication** - Simple but effective for now
2. **Environment Protection** - Disabled in production by default
3. **Cleanup-First Design** - Ensures reproducible tests
4. **TTL-Based Cleanup** - Prevents orphaned test data

### **Authentication Strategy**

- Use `eval-teacher` user ID instead of `eval-test-user`
- Creates real user profiles with proper teacher/student roles
- Maintains compatibility with existing access control systems

### **Reproducibility Strategy**

- Deterministic user IDs (`eval-teacher`, `eval-student`)
- Cleanup before creation (ensures clean state)
- TTL-based automatic cleanup (24 hours)

## Files Created/Modified

### **New Files:**

1. `apps/backend/convex/evalSetup.ts` - Eval setup/cleanup functions

### **Modified Files:**

1. `apps/backend/convex/http.ts` - Added new eval endpoints
2. `apps/backend/convex/evalHelpers.ts` - Updated to use `eval-teacher`

### **Files To Be Modified:**

1. `packages/evals/providers/convex-agent.ts` - ✅ Updated to support setup/cleanup flow

## Next Steps Priority

### **High Priority (Complete MVP):**

1. ✅ Update evals provider to call setup/cleanup endpoints
2. Test basic flow works end-to-end
3. Update CI/CD configuration

### **Medium Priority (Enhancements):**

1. Implement HMAC-signed requests
2. Add rate limiting
3. Implement audit logging

### **Low Priority (Optional):**

1. Document content integration
2. IP allowlisting
3. Advanced security features

## Risks and Considerations

### **Security Risks:**

- API key could leak (mitigation: store in environment variables, rotate regularly)
- Eval endpoints publicly accessible (mitigation: environment protection, consider IP restrictions)

### **Compatibility Risks:**

- Existing evals should continue to work (backward compatibility maintained)
- Need to update any documentation about eval setup

### **Operational Risks:**

- TTL cleanup might not catch all orphaned data (manual cleanup available)
- Concurrent eval runs could interfere (cleanup-first approach helps)

## Deployment Plan

### **Phase 1: Development Testing**

1. Test locally with existing evals
2. Verify setup/cleanup endpoints work
3. Ensure no breaking changes

### **Phase 2: CI/CD Integration**

1. Update GitHub Actions workflows
2. Set up secrets for API keys
3. Run full test suite

### **Phase 3: Production Deployment**

1. Deploy backend with new endpoints (disabled in production)
2. Monitor for any issues
3. Enable in production only if needed (via `ENABLE_EVAL_IN_PROD`)

## Notes for Next Session

The implementation is about 85% complete. The remaining work is:

1. ✅ **Update the evals provider** (`convex-agent.ts`) to use the new setup/cleanup flow
2. **Test the complete system** end-to-end
3. **Update CI/CD configuration** for the new auth approach

The architecture is sound and maintains backward compatibility while providing proper authentication and reproducibility.
