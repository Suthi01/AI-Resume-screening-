// src/services/ResumeParserService.ts
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require('pdf-parse');
import fs from 'fs';

class ResumeParserService {
  static async extractTextFromPdf(filePath: string): Promise<string> {
    // Read PDF file into buffer
    const dataBuffer = await fs.promises.readFile(filePath);
    const data = await pdfParse(dataBuffer);
    const text = (data?.text ?? '').trim();
    if (!text) {
      throw new Error('Extracted text is empty');
    }
    return text;
  }

  static async detectSkills(rawText: string): Promise<string[]> {
    const { SKILLS } = await import("../config/skills");
    return SKILLS.filter(skill => {
      const escapedSkill = skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const skillRegex = new RegExp(`\\b${escapedSkill}\\b`, "i");
      return skillRegex.test(rawText);
    });
  }
}

export default ResumeParserService;
