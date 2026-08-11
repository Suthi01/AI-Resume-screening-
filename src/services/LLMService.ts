import axios, { AxiosInstance } from 'axios';
import { AppConfig } from '../config';
import { CandidateSnippet, SummarizeOptions } from '../types/search.types';
import pino from 'pino';

const logger = pino();

export class LLMService {
  private client: AxiosInstance;
  private model: string;

  constructor(config: AppConfig) {
    this.client = axios.create({
      baseURL: config.groqApiBaseUrl,
      headers: {
        'Authorization': `Bearer ${config.groqApiKey}`,
        'Content-Type': 'application/json',
      },
    });
    this.model = config.groqLlmModel;
  }

  /**
   * Re-ranks a list of candidates based on the query using the LLM.
   * Prompts the LLM to return exactly a JSON array of resumeIds ordered by relevance.
   */
  async rerankCandidates(query: string, candidates: CandidateSnippet[], topK: number = 10): Promise<CandidateSnippet[]> {
    if (!candidates || candidates.length === 0) {
      return [];
    }
    
    if (candidates.length === 1) {
      return candidates;
    }

    const candidateListText = candidates.map((c, index) => 
      `Candidate ${index + 1}:\nID: ${c.resumeId}\nSnippet: ${c.snippet}\n`
    ).join('\n---\n');

    const prompt = `You are an expert HR recruiter and technical hiring manager.
Your task is to re-rank a list of candidate resumes based on how well they match the given job search query.

Job Search Query: "${query}"

Candidates:
${candidateListText}

Instructions:
1. Analyze each candidate's snippet carefully against the search query.
2. Rank the candidates from MOST relevant to LEAST relevant.
3. You must output ONLY a valid JSON array of strings containing the exact candidate IDs (resumeId) in the ranked order. Do not include any other text, explanation, or markdown formatting like \`\`\`json.
Example output format:
["id-3", "id-1", "id-2"]`;

    try {
      const startTime = performance.now();
      const response = await this.client.post('/chat/completions', {
        model: this.model,
        messages: [
          { role: 'system', content: 'You are a helpful assistant that outputs exactly valid JSON arrays.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1, // Low temperature for deterministic behavior
        max_tokens: 1024,
      });

      const durationMs = Math.round(performance.now() - startTime);
      
      const content = response.data.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from LLM');
      }

      // Try to parse the JSON output
      let rankedIds: string[];
      try {
        // Strip out backticks if the model ignores the instruction
        let cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
        const firstBracket = cleanContent.indexOf('[');
        const lastBracket = cleanContent.lastIndexOf(']');
        if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
          cleanContent = cleanContent.substring(firstBracket, lastBracket + 1);
        }
        rankedIds = JSON.parse(cleanContent);
        if (!Array.isArray(rankedIds)) {
          throw new Error('Parsed result is not an array');
        }
      } catch (parseError) {
        logger.error({ err: parseError, content }, 'Failed to parse LLM re-rank output as JSON');
        // Fallback: return original candidates
        return candidates.slice(0, topK);
      }

      logger.info({ durationMs, count: rankedIds.length }, 'LLM Re-ranking completed successfully');

      // Map back to candidate objects based on the returned ordered IDs
      const candidateMap = new Map<string, CandidateSnippet>();
      candidates.forEach(c => candidateMap.set(c.resumeId, c));

      const finalRanked: CandidateSnippet[] = [];
      for (const id of rankedIds) {
        const candidate = candidateMap.get(id);
        if (candidate) {
          finalRanked.push(candidate);
        }
      }

      // If the LLM missed some candidates, append them at the end
      if (finalRanked.length < candidates.length) {
        for (const c of candidates) {
          if (!finalRanked.some(fc => fc.resumeId === c.resumeId)) {
            finalRanked.push(c);
          }
        }
      }

      return finalRanked.slice(0, topK);

    } catch (error) {
      logger.error({ err: error }, 'LLM Re-ranking failed, falling back to original ranking');
      // Fallback: return original candidates
      return candidates.slice(0, topK);
    }
  }

  /**
   * Generates a fit summary for a specific candidate against a search query.
   */
  async summarizeCandidateFit(
    query: string, 
    candidate: CandidateSnippet, 
    options: SummarizeOptions = {}
  ): Promise<string> {
    const style = options.style || 'detailed';
    const maxTokens = options.maxTokens || 300;

    let styleInstruction = '';
    if (style === 'short') {
      styleInstruction = 'Provide a brief, 2-3 sentence summary of why this candidate is a good fit.';
    } else {
      styleInstruction = 'Provide a detailed paragraph highlighting the specific strengths and any potential gaps of this candidate for the role.';
    }

    const prompt = `You are an expert technical recruiter.
Analyze the following candidate's resume snippet against the job search query.

Job Search Query: "${query}"

Candidate Snippet:
${candidate.snippet}

Instruction:
${styleInstruction}
Do not use markdown formatting or introductory phrases like "Here is a summary". Just return the plain text summary.`;

    try {
      const startTime = performance.now();
      const response = await this.client.post('/chat/completions', {
        model: this.model,
        messages: [
          { role: 'system', content: 'You are an expert technical recruiter.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3, 
        max_tokens: maxTokens,
      });
      
      const durationMs = Math.round(performance.now() - startTime);
      const content = response.data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('Empty response from LLM');
      }

      logger.info({ durationMs, style }, 'LLM Summarization completed successfully');
      return content.trim();
    } catch (error) {
      logger.error({ err: error }, 'LLM Summarization failed');
      return 'Summary generation failed due to an error.';
    }
  }
}
