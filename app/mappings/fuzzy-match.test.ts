import { describe, expect, it } from 'bun:test';
import { fuzzyMatch } from '@/app/mappings/fuzzy-match';

describe('fuzzyMatch', () => {
  describe('empty query', () => {
    it('matches any non-empty target', () => {
      expect(fuzzyMatch('', 'nav.no')).toBe(true);
    });

    it('matches an empty target', () => {
      expect(fuzzyMatch('', '')).toBe(true);
    });
  });

  describe('query longer than target', () => {
    it('returns false', () => {
      expect(fuzzyMatch('toolongquery', 'nav')).toBe(false);
    });
  });

  describe('exact match', () => {
    it('matches when query equals target', () => {
      expect(fuzzyMatch('nav.no', 'nav.no')).toBe(true);
    });
  });

  describe('case insensitivity', () => {
    it('matches uppercase query against lowercase target', () => {
      expect(fuzzyMatch('NAV', 'nav.no')).toBe(true);
    });

    it('matches lowercase query against uppercase target', () => {
      expect(fuzzyMatch('nav', 'NAV.NO')).toBe(true);
    });
  });

  describe('subsequence matching', () => {
    it('matches characters at the start of the target', () => {
      expect(fuzzyMatch('nav', 'nav.no')).toBe(true);
    });

    it('matches non-contiguous characters spread across the target', () => {
      expect(fuzzyMatch('nv', 'nav.no')).toBe(true);
    });

    it('matches characters starting mid-target', () => {
      expect(fuzzyMatch('nav', 'intern.nav.no')).toBe(true);
    });

    it('matches characters spread across a long domain', () => {
      expect(fuzzyMatch('npd', 'np-dev.intern.nav.no')).toBe(true);
    });

    it('matches a query whose characters span the full target', () => {
      expect(fuzzyMatch('prod', 'app.prod.nav.no')).toBe(true);
    });

    it('matches the last character of the target', () => {
      expect(fuzzyMatch('o', 'nav.no')).toBe(true);
    });
  });

  describe('no match', () => {
    it('returns false when a query character is absent from the target', () => {
      expect(fuzzyMatch('xyz', 'nav.no')).toBe(false);
    });

    it('returns false when query characters appear in the wrong order', () => {
      // 'o' is at index 5, 'a' at index 1 — 'a' does not follow 'o' in 'nav.no'
      expect(fuzzyMatch('oa', 'nav.no')).toBe(false);
    });
  });
});
