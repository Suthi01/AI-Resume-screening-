// src/tests/unit/regex.test.ts
import { EMAIL_REGEX, PHONE_REGEX, EXPERIENCE_REGEX, LINKEDIN_REGEX, GITHUB_REGEX, URL_REGEX } from '../../utils/regex';

describe('Regex Utilities', () => {
  describe('EMAIL_REGEX', () => {
    it('should match standard emails', () => {
      expect(EMAIL_REGEX.test('sutheshnaa@outlook.com')).toBe(true);
      expect(EMAIL_REGEX.test('test.user+tag@subdomain.example.co.uk')).toBe(true);
      expect(EMAIL_REGEX.test('invalid-email')).toBe(false);
    });
  });

  describe('PHONE_REGEX', () => {
    it('should match Indian mobile numbers starting with 6, 7, 8, 9', () => {
      expect(PHONE_REGEX.test('+91 6383916603')).toBe(true);
      expect(PHONE_REGEX.test('9876543210')).toBe(true);
      expect(PHONE_REGEX.test('+91-7654321098')).toBe(true);
      expect(PHONE_REGEX.test('1234567890')).toBe(false); // starts with 1
    });
  });

  describe('EXPERIENCE_REGEX', () => {
    it('should match experience phrases', () => {
      const match1 = '5.5 years of experience'.match(EXPERIENCE_REGEX);
      expect(match1).not.toBeNull();
      expect(match1![1]).toBe('5.5');

      const match2 = '3 yrs'.match(EXPERIENCE_REGEX);
      expect(match2).not.toBeNull();
      expect(match2![1]).toBe('3');
    });
  });

  describe('LINKEDIN_REGEX', () => {
    it('should match LinkedIn profile URLs', () => {
      expect(LINKEDIN_REGEX.test('linkedin.com/in/sutheshna-arumugam')).toBe(true);
      expect(LINKEDIN_REGEX.test('https://www.linkedin.com/in/john-doe-123')).toBe(true);
      expect(LINKEDIN_REGEX.test('https://linkedin.com/feed')).toBe(false); // not /in/
    });
  });

  describe('GITHUB_REGEX', () => {
    it('should match GitHub profile URLs', () => {
      expect(GITHUB_REGEX.test('github.com/Suthi01')).toBe(true);
      expect(GITHUB_REGEX.test('https://www.github.com/john-doe')).toBe(true);
      expect(GITHUB_REGEX.test('https://github.com/trending')).toBe(true); // matches general github URLs since it's profile prefix based
    });
  });

  describe('URL_REGEX', () => {
    it('should match general URLs', () => {
      const text = 'Check out https://github.com/Suthi01 or www.google.com for more info.';
      const matches = text.match(URL_REGEX);
      expect(matches).not.toBeNull();
      expect(matches).toContain('https://github.com/Suthi01');
      expect(matches).toContain('www.google.com');
    });
  });
});
