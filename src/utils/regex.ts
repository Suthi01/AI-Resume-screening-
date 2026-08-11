// src/utils/regex.ts
/**
 * Regular expressions used for resume parsing.
 */

// Email pattern
export const EMAIL_REGEX = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;

// Phone number pattern (handles optional country code +91 or 91, and standard 10-digit Indian mobile numbers starting with 6, 7, 8, or 9)
export const PHONE_REGEX = /(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}/;

// Years of experience pattern (e.g., 3.3 years, 5 yrs, etc.)
export const EXPERIENCE_REGEX = /(\d+(\.\d+)?)\s*(years|yrs)/i;

// LinkedIn profile URL pattern
export const LINKEDIN_REGEX = /(https?:\/\/)?(www\.)?linkedin\.com\/in\/[a-zA-Z0-9\-\_]+/i;

// GitHub profile URL pattern
export const GITHUB_REGEX = /(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9\-\_]+/i;

// General URL pattern
export const URL_REGEX = /\b(https?:\/\/|www\.)[^\s|]+\b/gi;
