/**
 * Test utilities for auth-related tests. Re-exports the password hash cache reset
 * so tests import from a dedicated test utils module rather than the production auth module.
 */
import { _testOnlyResetPasswordHashCache } from "../server/auth.js";

export function resetAuthCacheForTests(): void {
  _testOnlyResetPasswordHashCache();
}
