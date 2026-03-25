import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { formatTimeAgo } from '../time';

// ── Unit tests ────────────────────────────────────────────────────────────────

describe('formatTimeAgo — unit examples', () => {
  it('returns "" for an invalid date string', () => {
    expect(formatTimeAgo('not-a-date')).toBe('');
  });

  it('returns seconds format for a date 30s ago', () => {
    const d = new Date(Date.now() - 30_000);
    expect(formatTimeAgo(d)).toMatch(/^\d+s ago$/);
  });

  it('returns minutes format for a date 5m ago', () => {
    const d = new Date(Date.now() - 5 * 60_000);
    expect(formatTimeAgo(d)).toBe('5m ago');
  });

  it('returns hours format for a date 3h ago', () => {
    const d = new Date(Date.now() - 3 * 3_600_000);
    expect(formatTimeAgo(d)).toBe('3h ago');
  });

  it('returns a locale date string for a date 2 days ago', () => {
    const d = new Date(Date.now() - 2 * 86_400_000);
    const result = formatTimeAgo(d);
    expect(result).not.toContain('ago');
    expect(result.length).toBeGreaterThan(0);
  });

  it('accepts a Date object as well as a string', () => {
    const d = new Date(Date.now() - 10_000);
    const fromDate = formatTimeAgo(d);
    const fromString = formatTimeAgo(d.toISOString());
    expect(fromDate).toBe(fromString);
  });
});

// ── Property-based tests ──────────────────────────────────────────────────────

describe('formatTimeAgo — property tests', () => {
  // Feature: black-sheep-completion, Property 3: formatTimeAgo non-empty for valid dates
  // Validates: Requirements 6.1, 6.9
  it('P3: returns a non-empty string for any valid ISO date', () => {
    fc.assert(
      fc.property(fc.date(), (d) => {
        const result = formatTimeAgo(d.toISOString());
        expect(result.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  // Feature: black-sheep-completion, Property 4: formatTimeAgo seconds branch
  // Validates: Requirements 6.2
  it('P4: returns "Xs ago" for dates 0–59s ago', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 59 }), (offsetSec) => {
        const d = new Date(Date.now() - offsetSec * 1000);
        expect(formatTimeAgo(d)).toMatch(/^\d+s ago$/);
      }),
      { numRuns: 100 }
    );
  });

  // Feature: black-sheep-completion, Property 5: formatTimeAgo minutes branch
  // Validates: Requirements 6.3
  it('P5: returns "Xm ago" for dates 60–3599s ago', () => {
    fc.assert(
      fc.property(fc.integer({ min: 60, max: 3599 }), (offsetSec) => {
        const d = new Date(Date.now() - offsetSec * 1000);
        expect(formatTimeAgo(d)).toMatch(/^\d+m ago$/);
      }),
      { numRuns: 100 }
    );
  });

  // Feature: black-sheep-completion, Property 6: formatTimeAgo hours branch
  // Validates: Requirements 6.4
  it('P6: returns "Xh ago" for dates 3600–86399s ago', () => {
    fc.assert(
      fc.property(fc.integer({ min: 3600, max: 86399 }), (offsetSec) => {
        const d = new Date(Date.now() - offsetSec * 1000);
        expect(formatTimeAgo(d)).toMatch(/^\d+h ago$/);
      }),
      { numRuns: 100 }
    );
  });

  // Feature: black-sheep-completion, Property 7: formatTimeAgo old-date branch
  // Validates: Requirements 6.5
  it('P7: returns a non-"ago" string for dates >= 86400s ago', () => {
    fc.assert(
      fc.property(fc.integer({ min: 86400, max: 86400 * 365 }), (offsetSec) => {
        const d = new Date(Date.now() - offsetSec * 1000);
        const result = formatTimeAgo(d);
        expect(result).not.toContain('ago');
        expect(result.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  // Feature: black-sheep-completion, Property 8: formatTimeAgo is deterministic
  // Validates: Requirements 6.10
  it('P8: calling twice with the same input returns the same string', () => {
    fc.assert(
      fc.property(fc.date(), (d) => {
        const iso = d.toISOString();
        expect(formatTimeAgo(iso)).toBe(formatTimeAgo(iso));
      }),
      { numRuns: 100 }
    );
  });
});
