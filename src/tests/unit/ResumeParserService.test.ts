// src/tests/unit/ResumeParserService.test.ts
import ResumeParserService from '../../services/ResumeParserService';

describe('ResumeParserService', () => {
  describe('detectSkills', () => {
    it('should detect skills from the static dictionary', async () => {
      const text = 'I am experienced in Node.js, React, TypeScript, and MongoDB.';
      const detected = await ResumeParserService.detectSkills(text);

      expect(detected).toContain('Node.js');
      expect(detected).toContain('React');
      expect(detected).toContain('TypeScript');
      expect(detected).toContain('MongoDB');
      expect(detected).not.toContain('Java');
    });

    it('should match skills case-insensitively and respect word boundaries', async () => {
      const text = 'Expert in typescript, mongodb. Mentioning React Native.';
      const detected = await ResumeParserService.detectSkills(text);

      expect(detected).toContain('TypeScript');
      expect(detected).toContain('MongoDB');
      expect(detected).toContain('React');
    });
  });
});
