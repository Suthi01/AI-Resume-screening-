// src/services/AlgorithmResumeParser.ts
import { Resume } from "../types/resume.types";
import { EMAIL_REGEX, PHONE_REGEX, EXPERIENCE_REGEX } from "../utils/regex";
import { SKILLS } from "../config/skills";

class AlgorithmResumeParser {
  async parseResume(text: string, _jobDescription?: string): Promise<Resume> {
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

    // 1. Name heuristic: Typically the first line or a prominent title on the first few lines
    let name = "";
    if (lines.length > 0) {
      // Find the first line that is short and contains letters (likely the candidate's name)
      for (const line of lines) {
        if (/^[a-zA-Z\s]+$/.test(line) && line.length > 2 && line.length < 40) {
          name = line;
          break;
        }
      }
      if (!name) {
        name = lines[0]; // fallback
      }
    }

    // 2. Email heuristic
    const emailMatch = text.match(EMAIL_REGEX);
    const email = emailMatch ? emailMatch[0] : "";

    // 3. Phone heuristic
    const phoneMatch = text.match(PHONE_REGEX);
    const phone = phoneMatch ? phoneMatch[0] : "";

    // 4. Experience heuristic
    const experienceMatch = text.match(EXPERIENCE_REGEX);
    let totalExperience = 0;
    if (experienceMatch) {
      totalExperience = parseFloat(experienceMatch[1]);
    } else {
      // Try to estimate from date ranges (e.g., Jun 2025 – Jul 2025)
      const dateRangeRegex = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})\s*[\-\–\u2013\u2014]\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4}|Present)\b/gi;
      let match;
      let totalMonths = 0;
      const monthMap: { [key: string]: number } = {
        jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
        jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
      };

      dateRangeRegex.lastIndex = 0;
      while ((match = dateRangeRegex.exec(text)) !== null) {
        const startMonthStr = match[1].toLowerCase().substring(0, 3);
        const startYear = parseInt(match[2], 10);
        const endMonthStr = match[3].toLowerCase().substring(0, 3);
        const endYear = match[4].toLowerCase() === 'present' ? new Date().getFullYear() : parseInt(match[4], 10);

        const startMonth = monthMap[startMonthStr];
        const endMonth = match[4].toLowerCase() === 'present' ? new Date().getMonth() : monthMap[endMonthStr];

        if (startMonth !== undefined && endMonth !== undefined) {
          const duration = (endYear - startYear) * 12 + (endMonth - startMonth) + 1;
          if (duration > 0 && duration < 240) {
            const contextText = text.substring(Math.max(0, match.index - 100), match.index);
            // Internships are not counted as full-time professional experience for freshers
            const isInternship = /intern/i.test(contextText);
            if (!isInternship) {
              if (duration <= 12 || /worker|developer|engineer|work|experience/i.test(contextText)) {
                totalMonths += duration;
              }
            }
          }
        }
      }
      if (totalMonths > 0) {
        totalExperience = Math.round((totalMonths / 12) * 10) / 10;
      }
    }

    // 5. Location heuristic: search for common cities or look for lines like "Location: Chennai"
    let location = "";
    const locationKeywords = ["Chennai", "Bangalore", "Bengaluru", "Namakkal", "Tamil Nadu", "Mumbai", "Pune", "Hyderabad", "Noida", "Delhi", "Gurgaon"];
    
    // Check first 5 lines (header section) first to capture permanent address instead of work locations
    const headerText = lines.slice(0, 5).join("\n");
    for (const city of locationKeywords) {
      const cityRegex = new RegExp(`\\b${city}\\b`, "i");
      if (cityRegex.test(headerText)) {
        location = city;
        break;
      }
    }
    
    if (!location) {
      for (const city of locationKeywords) {
        const cityRegex = new RegExp(`\\b${city}\\b`, "i");
        if (cityRegex.test(text)) {
          location = city;
          break;
        }
      }
    }

    // Fallback search for lines indicating Location or Address
    if (!location) {
      const locationLine = lines.find(line => /location|address/i.test(line));
      if (locationLine) {
        location = locationLine.replace(/location|address|[:,-]/gi, "").trim();
      }
    }

    // 6. Skills extraction from SKILLS dictionary
    const skills = SKILLS.filter(skill => {
      // Use word boundaries for skill names to avoid partial matching (e.g. "Go" in "Google")
      const escapedSkill = skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const skillRegex = new RegExp(`\\b${escapedSkill}\\b`, "i");
      return skillRegex.test(text);
    });

    // 7. Role heuristic
    let role = "";
    
    // Check if they have internship titles and extract the actual internship role first (to avoid matching aspiring summary titles for freshers)
    const internshipLine = lines.find(line => /\bIntern\b/i.test(line) && (line.includes('—') || line.includes('-')) && !/aspiring|summary/i.test(line));
    if (internshipLine) {
      const parts = internshipLine.split(/[—\-]/);
      if (parts.length > 0) {
        const potentialRole = parts[0].trim();
        if (potentialRole.length > 2 && potentialRole.length < 40 && /engineer|developer|analyst|programmer|designer|intern|ml|ai/i.test(potentialRole)) {
          role = potentialRole;
        }
      }
    }

    if (!role) {
      const commonRoles = ["QA Engineer", "Backend Developer", "Backend Engineer", "Software Engineer", "Frontend Developer", "Frontend Engineer", "Full Stack Developer", "Gen AI Engineer", "Data Scientist"];
      for (const r of commonRoles) {
        const roleRegex = new RegExp(`\\b${r}\\b`, "i");
        if (roleRegex.test(text)) {
          role = r;
          break;
        }
      }
    }
    if (!role) {
      // Find a line that looks like a title or matches a role pattern
      const roleLine = lines.find(line => /engineer|developer|analyst|programmer|lead/i.test(line));
      if (roleLine && roleLine.length < 50) {
        role = roleLine;
      }
    }

    // 8. Company heuristic
    let company = "";
    
    // Check specific Pvt Ltd / Ltd lines
    const pvtLtdLine = lines.find(line => /\bPvt\b.*\bLtd\b/i.test(line) || /\bLtd\b/i.test(line));
    if (pvtLtdLine) {
      const match = pvtLtdLine.match(/([A-Z][A-Za-z0-9\s\-—]+)\s+\bPvt\b.*\bLtd\b/i) || pvtLtdLine.match(/([A-Z][A-Za-z0-9\s\-—]+)\s+\bLtd\b/i);
      if (match) {
        let extracted = match[1].trim();
        // Remove roles or words like "ML Intern", "Gen AI Intern", etc. from the company name
        extracted = extracted.replace(/^(?:ML\s+|Gen\s+AI\s+)?(?:Intern|Internship|Developer|Engineer|Analyst|Lead|Manager|Software|QA)\b\s*(?:—|-|to)?\s*/i, '').trim();
        if (extracted.length > 2 && extracted.length < 50) {
          company = extracted;
        }
      }
    }

    // Check common companies
    if (!company) {
      const commonCompanies = ["TCS", "Wipro", "Infosys", "Cognizant", "CTS", "Accenture", "Google", "Microsoft", "Amazon", "TestLeaf"];
      for (const c of commonCompanies) {
        const compRegex = new RegExp(`\\b${c}\\b`, "i");
        if (compRegex.test(text)) {
          company = c;
          break;
        }
      }
    }

    // Check for "Intern — Company" or "Role — Company" patterns
    if (!company) {
      const internLine = lines.find(line => /(?:Intern|Developer|Engineer|Analyst|Lead|Manager)\s*[—\-]\s*([A-Z][A-Za-z0-9\s]+)/i.test(line));
      if (internLine) {
        const match = internLine.match(/(?:Intern|Developer|Engineer|Analyst|Lead|Manager)\s*[—\-]\s*([A-Z][A-Za-z0-9\s]+)/i);
        if (match) {
          company = match[1].trim();
        }
      }
    }

    // Check lines containing "at [Company]" pattern
    if (!company) {
      const workLine = lines.find(line => /\bat\b\s+([A-Z][A-Za-z0-9\s]+(?:\s+Solutions|\s+Technologies|\s+Pvt|\s+Ltd)?)/i.test(line));
      if (workLine) {
        const match = workLine.match(/\bat\b\s+([A-Z][A-Za-z0-9\s]+(?:\s+Solutions|\s+Technologies|\s+Pvt|\s+Ltd)?)/i);
        if (match) {
          company = match[1].trim();
        }
      }
    }

    // 9. Education heuristic
    let education = "";
    const educationKeywords = ["B.E", "B.Tech", "M.Tech", "MCA", "MBA", "B.Sc", "M.Sc", "Bachelor", "Master"];
    for (const edu of educationKeywords) {
      const eduRegex = new RegExp(`\\b${edu.replace(".", "\\.")}\\b`, "i");
      if (eduRegex.test(text)) {
        // Prioritize actual education record lines (having divider, CGPA, college, or university keywords)
        let eduLine = lines.find(line => eduRegex.test(line) && (line.includes('|') || /CGPA|GPA|University|College|Institute/i.test(line)));
        if (!eduLine) {
          // Fallback to lines that don't look like summary statements
          eduLine = lines.find(line => eduRegex.test(line) && line.length < 120 && !/passionate|motivated|seeking|build/i.test(line));
        }
        if (!eduLine) {
          eduLine = lines.find(line => eduRegex.test(line));
        }
        if (eduLine) {
          education = eduLine;
          break;
        }
      }
    }

    return {
      name,
      email,
      phone,
      location,
      skills,
      company,
      role,
      education,
      totalExperience,
      summary: `Candidate profile for ${name}`,
      confidenceScore: 0.9,
      validationStatus: "VALID"
    };
  }
}

export default AlgorithmResumeParser;
