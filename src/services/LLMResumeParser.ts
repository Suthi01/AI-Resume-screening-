// src/services/LLMResumeParser.ts
import axios from 'axios';
import { config } from '../config';
import AlgorithmResumeParser from "./AlgorithmResumeParser";
import { Resume } from "../types/resume.types";
import logger from '../utils/logger';

class LLMResumeParser {
  private fallbackParser = new AlgorithmResumeParser();

  /**
   * Parses resume text using the Groq LLM. If the request fails, it falls back
   * to the Regex/heuristic-based AlgorithmResumeParser.
   * @param text Raw cleaned resume text
   * @param jobDescription Optional job description to evaluate fit against
   */
  async parseResume(text: string, jobDescription?: string): Promise<Resume> {
    const prompt = `You are an expert HR recruitment system assistant. Your job is to extract structured information from the following raw resume text.${jobDescription ? `\n\nYou must evaluate the candidate's profile against the following Job Description to determine their fit:\nJob Description:\n"""\n${jobDescription}\n"""\n` : ''}

Resume Text:
"""
${text}
"""

Output exactly a valid JSON object matching the following structure. Do not include markdown code block syntax like \`\`\`json or any explanations. Return only the JSON object.

{
  "name": "Full name of the candidate",
  "email": "Email address of the candidate",
  "phone": "Phone number of the candidate",
  "location": "City and/or State/Country of the candidate",
  "skills": ["Array of skills detected in the resume"],
  "company": "Current or most recent company of the candidate",
  "role": "Current or most recent job title/role of the candidate",
  "education": [
    {
      "degree": "Degree name (e.g. B.Tech in Artificial Intelligence and Data Science)",
      "institution": "College/University name",
      "year": 2026
    }
  ],
  "totalExperience": 3.3,
  "summary": "${jobDescription ? 'A summary of the candidate\'s fit for the provided Job Description.' : 'A brief professional summary of the candidate\'s profile.'}",
  "confidenceScore": ${jobDescription ? 'A candidate fit score from 0.0 to 1.0 based on how well they match the Job Description.' : 'Confidence score from 0.0 to 1.0 of the extraction quality.'},
  "validationStatus": "VALID"
}

Rules:
1. "totalExperience" must be a number representing number of years of experience (e.g., 3.5, 5, 0).
2. "education" must be an array of objects. If no year can be parsed, use null.
3. "validationStatus" should be "VALID" if they have a valid name, email, and skills. Otherwise, "INVALID".
4. If any field cannot be found, output empty string (or empty array/null where appropriate).`;

    try {
      const response = await axios.post(
        `${config.groqApiBaseUrl}/chat/completions`,
        {
          model: config.groqLlmModel,
          messages: [
            { role: 'system', content: 'You are a helpful assistant that outputs exactly valid JSON objects.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.1,
          max_tokens: 1024,
        },
        {
          headers: {
            'Authorization': `Bearer ${config.groqApiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000, // 10 seconds timeout
        }
      );

      const content = response.data?.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from Groq');
      }

      const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanContent) as Resume;

      return {
        name: String(parsed.name || ''),
        email: String(parsed.email || ''),
        phone: String(parsed.phone || ''),
        location: String(parsed.location || ''),
        skills: Array.isArray(parsed.skills) ? parsed.skills.map(String) : [],
        company: String(parsed.company || ''),
        role: String(parsed.role || ''),
        education: Array.isArray(parsed.education) ? parsed.education : [],
        totalExperience: typeof parsed.totalExperience === 'number' ? parsed.totalExperience : 0,
        summary: String(parsed.summary || ''),
        confidenceScore: typeof parsed.confidenceScore === 'number' ? parsed.confidenceScore : 1.0,
        validationStatus: String(parsed.validationStatus || 'VALID')
      };
    } catch (err: any) {
      logger.warn(`LLMResumeParser failed: ${err.message}. Falling back to AlgorithmResumeParser.`);
      return this.fallbackParser.parseResume(text);
    }
  }
}

export default LLMResumeParser;
