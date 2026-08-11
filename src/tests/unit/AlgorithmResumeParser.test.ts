// src/tests/unit/AlgorithmResumeParser.test.ts
import AlgorithmResumeParser from '../../services/AlgorithmResumeParser';
import { cleanText } from '../../utils/textCleaner';

describe('AlgorithmResumeParser', () => {
  let parser: AlgorithmResumeParser;

  beforeEach(() => {
    parser = new AlgorithmResumeParser();
  });

  it('should parse a standard resume text successfully', async () => {
    const resumeText = `
      JOHN DOE
      Software Engineer
      Email: john.doe@example.com
      Phone: +91 9876543210
      Location: Chennai
      
      Experience:
      5.5 years of experience as a Backend Developer.
      Worked at TCS as a Software Engineer.
      
      Education:
      B.E Computer Science Engineering from Anna University.
      
      Skills:
      Java, SQL, Jenkins, MongoDB, Selenium.
    `;

    const parsed = await parser.parseResume(cleanText(resumeText));

    expect(parsed.name).toBe('JOHN DOE');
    expect(parsed.email).toBe('john.doe@example.com');
    expect(parsed.phone).toBe('+91 9876543210');
    expect(parsed.location).toBe('Chennai');
    expect(parsed.role).toBe('Backend Developer');
    expect(parsed.company).toBe('TCS');
    expect(parsed.education).toContain('B.E Computer Science Engineering');
    expect(parsed.totalExperience).toBe(5.5);
    expect(parsed.skills).toContain('Java');
    expect(parsed.skills).toContain('SQL');
    expect(parsed.skills).toContain('Jenkins');
  });

  it('should fall back to default values when fields are missing', async () => {
    const emptyResume = `
      Some random unstructured text with no clear contact info or structured details.
    `;

    const parsed = await parser.parseResume(cleanText(emptyResume));

    expect(parsed.name).toBe('Some random unstructured text with no clear contact info or structured details.');
    expect(parsed.email).toBe('');
    expect(parsed.phone).toBe('');
    expect(parsed.location).toBe('');
    expect(parsed.totalExperience).toBe(0);
    expect(parsed.skills).toEqual([]);
  });

  it('should match location and role using heuristics', async () => {
    const resumeText = `
      Namakkal is where I reside.
      I work as a Full Stack Developer.
    `;

    const parsed = await parser.parseResume(cleanText(resumeText));
    expect(parsed.location).toBe('Namakkal');
    expect(parsed.role).toBe('Full Stack Developer');
  });

  it('should parse Sutheshna resume text correctly', async () => {
    const resumeText = `
SUTHESHNA A
Aspiring Gen AI Engineer
Namakkal, Tamil Nadu, India | +91 6383916603 | sutheshnaa@outlook.com
https://github.com/Suthi01 | linkedin.com/in/sutheshna-arumugam
SUMMARY
Aspiring Gen AI Engineer with a B.Tech in Artificial Intelligence and Data Science, passionate about building LLM-powered 
applications from RAG pipelines and vector-based semantic retrieval to prompt-engineered agents and embedding-driven search. Eager 
to grow across the full Gen AI stack: data ingestion, embeddings, vector databases, LLM orchestration, and API integration, with hands on experience turning unstructured documents and data into intelligent, working systems.
SKILLS
● Generative AI & LLMs: LLMs, RAG, Prompt Engineering, MCP, Lang Flow, Lang Chain, Deep Eval, GitHub Copilot
● Programming & Databases: Python, SQL, MongoDB
● APIs & Tools: REST APIs, Postman, Git, GitHub, VS Code
INTERNSHIP
ML Intern — Lennox India Technology Centre Pvt Ltd, Chennai (Jun 2025 – Jul 2025)
● Engineered an LLM-based summarization pipeline for FEA simulation reports, using prompt engineering to convert dense 
technical documents into structured, retrievable summaries.
● Partnered with the engineering team to design and validate AI-driven workflows, translating ambiguous requirements into 
structured, testable solutions.
Gen AI Intern — TestLeaf (May 2026 – Aug 2026)
● Building LLM-powered applications as part of a Generative AI Engineering program, working hands-on with prompt 
engineering, RAG pipelines, and Gen AI workflow design.
PROJECTS
AI Resume Screening Assistant (TypeScript, Node.js)
● Designed an AI-powered recruitment solution that combines Retrieval-Augmented Generation (RAG), embedding models, and 
a Vector Database to retrieve and analyse relevant resume content.
EDUCATION
Velalar College of Engineering and Technology, Erode
B.Tech in Artificial Intelligence and Data Science | CGPA: 8.01 | 2022 – 2026
`;

    const parsed = await parser.parseResume(cleanText(resumeText));

    expect(parsed.name).toBe('SUTHESHNA A');
    expect(parsed.email).toBe('sutheshnaa@outlook.com');
    expect(parsed.phone).toBe('+91 6383916603');
    expect(parsed.location).toBe('Namakkal');
    expect(parsed.role).toBe('ML Intern');
    expect(parsed.company).toBe('Lennox India Technology Centre');
    expect(parsed.education).toContain('B.Tech in Artificial Intelligence and Data Science');
    expect(parsed.totalExperience).toBe(0); // Internships do not count as full-time experience for freshers
    expect(parsed.skills).toContain('Python');
    expect(parsed.skills).toContain('RAG');
    expect(parsed.skills).toContain('LLMs');
  });
});
