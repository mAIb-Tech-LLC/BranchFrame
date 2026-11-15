/**
 * Provides an isolated per-browser-tab Judge Sandbox Session ID so that
 * concurrent anonymous judges/visitors never collide in /api/v1/sandbox/*.
 */

const STORAGE_KEY = 'bf_judge_sandbox_session_id';

export function getJudgeSessionId(): string {
  if (typeof window === 'undefined') {
    return 'ssr-judge-session';
  }

  try {
    const params = new URLSearchParams(window.location.search);
    const querySession = params.get('sessionId');
    if (querySession && /^[a-zA-Z0-9_-]{3,48}$/.test(querySession)) {
      return querySession;
    }

    let existing = window.sessionStorage.getItem(STORAGE_KEY);
    if (!existing) {
      const randomPart =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID().replace(/-/g, '').slice(0, 16)
          : `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      existing = `judge_${randomPart}`;
      window.sessionStorage.setItem(STORAGE_KEY, existing);
    }
    return existing;
  } catch {
    return 'fallback-judge-session';
  }
}

export function getJudgeSandboxHeaders(
  extra: Record<string, string> = {}
): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'X-Judge-Sandbox-Session': getJudgeSessionId(),
    ...extra,
  };
}
