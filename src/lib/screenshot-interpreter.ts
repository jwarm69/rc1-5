/**
 * RealCoach.ai - Screenshot Interpreter
 *
 * Pipeline for interpreting screenshot content and generating signals.
 * Contains functions for classification, extraction, pattern detection,
 * contact matching, and signal generation.
 *
 * CRITICAL: Signals are DRAFTS for the Daily Action Engine.
 * They do NOT directly modify the database.
 */

import {
  ContentType,
  PatternType,
  DetectedPattern,
  ScreenshotInterpretation,
  ScreenshotSignal,
  SignalType,
  ContactMatch,
} from '@/types/screenshot';

// ============================================================================
// CONTENT CLASSIFICATION
// ============================================================================

/**
 * Classify content type from raw LLM analysis.
 * Returns the most likely content type based on keywords and patterns.
 */
export function classifyContent(rawAnalysis: string, llmContentType?: string): ContentType {
  // If LLM already provided a content type, validate and use it
  if (llmContentType && isValidContentType(llmContentType)) {
    return llmContentType as ContentType;
  }

  const text = rawAnalysis.toLowerCase();

  // Check for specific content type indicators
  if (text.includes('imessage') || text.includes('text message') || text.includes('sms')) {
    return 'text_conversation';
  }
  if (text.includes('whatsapp') || text.includes('instagram') || text.includes('facebook') || text.includes('direct message') || text.includes('dm')) {
    return 'social_dm';
  }
  if (text.includes('email') || text.includes('subject:') || text.includes('inbox')) {
    return 'email_thread';
  }
  if (text.includes('calendar') || text.includes('schedule') || text.includes('appointment')) {
    if (text.includes('week') || text.includes('weekly')) {
      return 'calendar_week';
    }
    return 'calendar_day';
  }
  if (text.includes('note') || text.includes('memo')) {
    return 'notes';
  }
  if (text.includes('crm') || text.includes('contact list') || text.includes('lead list')) {
    return 'crm_list';
  }
  if (text.includes('sign-in') || text.includes('sign in') || text.includes('open house')) {
    return 'open_house_signin';
  }
  if (text.includes('spreadsheet') || text.includes('excel') || text.includes('google sheets') || text.includes('rows and columns')) {
    return 'spreadsheet';
  }
  if (text.includes('multiple') || text.includes('different types')) {
    return 'mixed';
  }

  return 'unknown';
}

/**
 * Check if a string is a valid ContentType
 */
function isValidContentType(type: string): boolean {
  const validTypes: ContentType[] = [
    'text_conversation', 'social_dm', 'email_thread',
    'calendar_day', 'calendar_week', 'notes', 'crm_list',
    'open_house_signin', 'spreadsheet', 'mixed', 'unknown',
  ];
  return validTypes.includes(type as ContentType);
}

// ============================================================================
// PEOPLE EXTRACTION
// ============================================================================

/**
 * Extract names of people mentioned in the content.
 * Cleans and deduplicates the list.
 */
export function extractPeople(rawAnalysis: string, llmPeople?: string[]): string[] {
  // If LLM already extracted people, clean and return
  if (llmPeople && llmPeople.length > 0) {
    return cleanAndDeduplicateNames(llmPeople);
  }

  // Otherwise try to extract from raw text
  const names = extractNamesFromText(rawAnalysis);
  return cleanAndDeduplicateNames(names);
}

/**
 * Extract potential names from text using pattern matching
 */
function extractNamesFromText(text: string): string[] {
  const names: string[] = [];

  // Pattern: Capitalized words that look like names
  // Match patterns like "John Smith", "Sarah M.", "Dr. Johnson"
  const namePatterns = [
    // Full names: First Last
    /\b([A-Z][a-z]+)\s+([A-Z][a-z]+)\b/g,
    // Names with middle initial: First M. Last
    /\b([A-Z][a-z]+)\s+[A-Z]\.\s+([A-Z][a-z]+)\b/g,
    // Single capitalized name (common in messages)
    /(?:^|\s)([A-Z][a-z]{2,})\s+(?:said|wrote|replied|asked|mentioned)/gi,
  ];

  for (const pattern of namePatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (match[0]) {
        names.push(match[0].trim());
      }
    }
  }

  return names;
}

/**
 * Clean and deduplicate extracted names
 */
function cleanAndDeduplicateNames(names: string[]): string[] {
  const cleaned = names
    .map(name => name.trim())
    .filter(name => name.length > 1)
    .filter(name => !isCommonWord(name));

  // Deduplicate (case-insensitive)
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const name of cleaned) {
    const lower = name.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      unique.push(name);
    }
  }

  return unique.slice(0, 10); // Max 10 names
}

/**
 * Check if a word is too common to be a name
 */
function isCommonWord(word: string): boolean {
  const commonWords = [
    'the', 'and', 'but', 'for', 'not', 'you', 'all', 'can', 'had',
    'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him',
    'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'way',
    'who', 'did', 'yet', 'said', 'here', 'this', 'that', 'with',
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
    'january', 'february', 'march', 'april', 'june', 'july', 'august',
    'september', 'october', 'november', 'december',
  ];
  return commonWords.includes(word.toLowerCase());
}

// ============================================================================
// DATE EXTRACTION
// ============================================================================

/**
 * Extract and normalize dates from the content.
 * Returns dates in ISO format (YYYY-MM-DD).
 */
export function extractDates(rawAnalysis: string, llmDates?: string[]): string[] {
  const dates: string[] = [];

  // Process LLM-provided dates first
  if (llmDates && llmDates.length > 0) {
    for (const dateStr of llmDates) {
      const normalized = normalizeDateString(dateStr);
      if (normalized) {
        dates.push(normalized);
      }
    }
  }

  // Also extract from raw text
  const extractedDates = extractDatesFromText(rawAnalysis);
  for (const dateStr of extractedDates) {
    const normalized = normalizeDateString(dateStr);
    if (normalized && !dates.includes(normalized)) {
      dates.push(normalized);
    }
  }

  return dates.slice(0, 10); // Max 10 dates
}

/**
 * Extract date strings from text using patterns
 */
function extractDatesFromText(text: string): string[] {
  const dates: string[] = [];

  // Common date patterns
  const patterns = [
    // MM/DD/YYYY or MM-DD-YYYY
    /\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b/g,
    // Month DD, YYYY
    /\b((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?,?\s*\d{0,4})\b/gi,
    // DD Month YYYY
    /\b(\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)(?:\s+\d{4})?)\b/gi,
    // ISO format YYYY-MM-DD
    /\b(\d{4}-\d{2}-\d{2})\b/g,
    // Relative dates
    /\b(today|tomorrow|yesterday)\b/gi,
    // Day of week
    /\b((?:this|next|last)\s+(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday))\b/gi,
  ];

  for (const pattern of patterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        dates.push(match[1]);
      }
    }
  }

  return dates;
}

/**
 * Normalize a date string to ISO format (YYYY-MM-DD)
 */
function normalizeDateString(dateStr: string): string | null {
  const trimmed = dateStr.trim().toLowerCase();

  // Handle relative dates
  const today = new Date();
  if (trimmed === 'today') {
    return formatDateISO(today);
  }
  if (trimmed === 'tomorrow') {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return formatDateISO(tomorrow);
  }
  if (trimmed === 'yesterday') {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    return formatDateISO(yesterday);
  }

  // Try to parse the date string
  try {
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return formatDateISO(parsed);
    }
  } catch {
    // Fall through to return null
  }

  return null;
}

/**
 * Format a Date object to ISO date string (YYYY-MM-DD)
 */
function formatDateISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

// ============================================================================
// PATTERN DETECTION
// ============================================================================

/**
 * Detect patterns in the screenshot content that might indicate
 * follow-up needs, urgency, or other coaching opportunities.
 */
export function detectPatterns(
  rawAnalysis: string,
  llmPatterns?: Array<{ type: string; description: string; severity?: string }>,
): DetectedPattern[] {
  const patterns: DetectedPattern[] = [];

  // Process LLM-provided patterns first
  if (llmPatterns && llmPatterns.length > 0) {
    for (const p of llmPatterns) {
      const patternType = normalizePatternType(p.type);
      if (patternType) {
        patterns.push({
          type: patternType,
          description: p.description,
          severity: normalizeSeverity(p.severity),
        });
      }
    }
  }

  // Also detect patterns from raw analysis
  const text = rawAnalysis.toLowerCase();

  // Response gap patterns
  if (text.includes('gap') || text.includes('days since') || text.includes('hasn\'t replied') || text.includes("haven't responded")) {
    if (!patterns.some(p => p.type === 'response_gap')) {
      patterns.push({
        type: 'response_gap',
        description: 'Detected gap in response timeline',
        severity: text.includes('week') || text.includes('days') ? 'high' : 'medium',
      });
    }
  }

  // Calendar overload patterns
  if (text.includes('overbooked') || text.includes('back to back') || text.includes('too many') || text.includes('packed schedule')) {
    if (!patterns.some(p => p.type === 'calendar_overload')) {
      patterns.push({
        type: 'calendar_overload',
        description: 'Calendar appears overloaded',
        severity: 'medium',
      });
    }
  }

  // Urgency signals
  if (text.includes('urgent') || text.includes('asap') || text.includes('deadline') || text.includes('time sensitive')) {
    if (!patterns.some(p => p.type === 'urgency_signal')) {
      patterns.push({
        type: 'urgency_signal',
        description: 'Urgency indicators detected',
        severity: 'high',
      });
    }
  }

  // Unanswered questions
  if (text.includes('question') && (text.includes('unanswered') || text.includes('pending') || text.includes('asked'))) {
    if (!patterns.some(p => p.type === 'question_unanswered')) {
      patterns.push({
        type: 'question_unanswered',
        description: 'Question appears to be unanswered',
        severity: 'medium',
      });
    }
  }

  // Commitments made
  if (text.includes('promise') || text.includes('committed') || text.includes('agreed to') || text.includes('will call') || text.includes('will follow')) {
    if (!patterns.some(p => p.type === 'commitment_made')) {
      patterns.push({
        type: 'commitment_made',
        description: 'Commitment or promise detected',
        severity: 'medium',
      });
    }
  }

  // Multiple contacts
  if (text.includes('multiple people') || text.includes('several contacts') || text.includes('group')) {
    if (!patterns.some(p => p.type === 'multiple_contacts')) {
      patterns.push({
        type: 'multiple_contacts',
        description: 'Multiple people mentioned',
        severity: 'low',
      });
    }
  }

  return patterns.slice(0, 5); // Max 5 patterns
}

/**
 * Normalize a pattern type string to a valid PatternType
 */
function normalizePatternType(type: string): PatternType | null {
  const typeMap: Record<string, PatternType> = {
    'response_gap': 'response_gap',
    'gap': 'response_gap',
    'overdue_followup': 'overdue_followup',
    'overdue': 'overdue_followup',
    'follow_up': 'overdue_followup',
    'calendar_overload': 'calendar_overload',
    'overload': 'calendar_overload',
    'urgency_signal': 'urgency_signal',
    'urgency': 'urgency_signal',
    'urgent': 'urgency_signal',
    'commitment_made': 'commitment_made',
    'commitment': 'commitment_made',
    'question_unanswered': 'question_unanswered',
    'unanswered': 'question_unanswered',
    'multiple_contacts': 'multiple_contacts',
    'multiple': 'multiple_contacts',
  };

  return typeMap[type.toLowerCase()] || null;
}

/**
 * Normalize severity to valid values
 */
function normalizeSeverity(severity?: string): 'low' | 'medium' | 'high' {
  if (!severity) return 'medium';
  const lower = severity.toLowerCase();
  if (lower === 'high' || lower === 'critical') return 'high';
  if (lower === 'low' || lower === 'minor') return 'low';
  return 'medium';
}

// ============================================================================
// SUMMARY GENERATION
// ============================================================================

/**
 * Generate a concise bullet-point summary from the interpretation.
 * Returns max 5 bullet points.
 */
export function generateSummary(
  rawAnalysis: string,
  llmSummary?: string[],
): string[] {
  // If LLM provided summary, clean and return
  if (llmSummary && llmSummary.length > 0) {
    return cleanSummary(llmSummary);
  }

  // Otherwise generate from raw analysis
  return generateSummaryFromRaw(rawAnalysis);
}

/**
 * Clean and limit summary bullet points
 */
function cleanSummary(summary: string[]): string[] {
  return summary
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .slice(0, 5); // Max 5 points
}

/**
 * Generate summary from raw analysis text
 */
function generateSummaryFromRaw(rawAnalysis: string): string[] {
  // Split into sentences and take key ones
  const sentences = rawAnalysis
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 10 && s.length < 200);

  // Take up to 5 meaningful sentences
  return sentences.slice(0, 5);
}

// ============================================================================
// CONTACT MATCHING
// ============================================================================

/**
 * Match detected names against user's contacts using fuzzy matching.
 * Returns potential matches with confidence scores.
 */
export function matchContacts(
  detectedNames: string[],
  userContacts: Array<{ id: string; name: string }>,
): ContactMatch[] {
  const matches: ContactMatch[] = [];

  for (const detectedName of detectedNames) {
    const normalizedDetected = normalizeName(detectedName);

    for (const contact of userContacts) {
      const normalizedContact = normalizeName(contact.name);
      const similarity = calculateSimilarity(normalizedDetected, normalizedContact);

      if (similarity > 0.6) { // Threshold for potential match
        matches.push({
          contactId: contact.id,
          name: contact.name,
          confidence: similarity,
          confirmed: false,
        });
      }
    }
  }

  // Sort by confidence descending
  matches.sort((a, b) => b.confidence - a.confidence);

  // Remove duplicates (same contact matched multiple times)
  const seen = new Set<string>();
  const unique = matches.filter(m => {
    if (seen.has(m.contactId)) return false;
    seen.add(m.contactId);
    return true;
  });

  return unique.slice(0, 10); // Max 10 matches
}

/**
 * Normalize a name for comparison
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculate similarity between two strings using Levenshtein-inspired approach
 * Returns value between 0 (no match) and 1 (exact match)
 */
function calculateSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1;
  if (!str1 || !str2) return 0;

  // Check if one string contains the other
  if (str1.includes(str2) || str2.includes(str1)) {
    return 0.9;
  }

  // Simple character-based similarity
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  // Count matching characters
  let matches = 0;
  const shorterChars = shorter.split('');

  for (const char of shorterChars) {
    if (longer.includes(char)) {
      matches++;
    }
  }

  return matches / longer.length;
}

// ============================================================================
// SIGNAL GENERATION
// ============================================================================

/**
 * Generate signals from the confirmed interpretation.
 * These signals inform the Daily Action Engine but do NOT directly modify the database.
 */
export function generateSignals(
  interpretation: ScreenshotInterpretation,
  contactMatches: ContactMatch[],
): ScreenshotSignal[] {
  const signals: ScreenshotSignal[] = [];
  const now = new Date();

  // Generate signals based on patterns
  for (const pattern of interpretation.patterns) {
    const signalType = patternToSignalType(pattern.type);
    if (signalType) {
      signals.push(createSignal({
        type: signalType,
        content: generateSignalContent(pattern, interpretation),
        interpretation,
        contactMatches,
        timestamp: now,
      }));
    }
  }

  // Generate follow-up signal if response gap detected
  if (interpretation.patterns.some(p => p.type === 'response_gap' || p.type === 'overdue_followup')) {
    const existingFollowUp = signals.find(s => s.type === 'follow_up');
    if (!existingFollowUp) {
      signals.push(createSignal({
        type: 'follow_up',
        content: `Follow up needed${interpretation.peopleDetected[0] ? ` with ${interpretation.peopleDetected[0]}` : ''}`,
        interpretation,
        contactMatches,
        timestamp: now,
      }));
    }
  }

  // Generate contact note signal for conversations
  if (['text_conversation', 'social_dm', 'email_thread'].includes(interpretation.contentType)) {
    if (interpretation.summary.length > 0) {
      signals.push(createSignal({
        type: 'contact_note',
        content: interpretation.summary[0],
        interpretation,
        contactMatches,
        timestamp: now,
      }));
    }
  }

  // Generate scheduling signal for calendar content
  if (['calendar_day', 'calendar_week'].includes(interpretation.contentType)) {
    signals.push(createSignal({
      type: 'scheduling',
      content: `Calendar review: ${interpretation.summary[0] || 'Review upcoming schedule'}`,
      interpretation,
      contactMatches,
      timestamp: now,
    }));
  }

  // Generate coaching signal for patterns that indicate coaching opportunity
  if (interpretation.patterns.some(p => p.severity === 'high')) {
    signals.push(createSignal({
      type: 'coaching',
      content: `Coaching opportunity: ${interpretation.inferredIntent || 'Review detected patterns'}`,
      interpretation,
      contactMatches,
      timestamp: now,
    }));
  }

  return signals.slice(0, 5); // Max 5 signals
}

/**
 * Map pattern type to signal type
 */
function patternToSignalType(patternType: PatternType): SignalType | null {
  const mapping: Partial<Record<PatternType, SignalType>> = {
    response_gap: 'follow_up',
    overdue_followup: 'follow_up',
    calendar_overload: 'scheduling',
    urgency_signal: 'follow_up',
    commitment_made: 'contact_note',
    question_unanswered: 'follow_up',
    multiple_contacts: 'pipeline',
  };
  return mapping[patternType] || null;
}

/**
 * Generate descriptive content for a signal
 */
function generateSignalContent(
  pattern: DetectedPattern,
  interpretation: ScreenshotInterpretation,
): string {
  const person = interpretation.peopleDetected[0];
  const personStr = person ? ` with ${person}` : '';

  switch (pattern.type) {
    case 'response_gap':
      return `Response gap detected${personStr}: ${pattern.description}`;
    case 'overdue_followup':
      return `Overdue follow-up${personStr}: ${pattern.description}`;
    case 'calendar_overload':
      return `Calendar overload: ${pattern.description}`;
    case 'urgency_signal':
      return `Urgent${personStr}: ${pattern.description}`;
    case 'commitment_made':
      return `Commitment made${personStr}: ${pattern.description}`;
    case 'question_unanswered':
      return `Unanswered question${personStr}: ${pattern.description}`;
    case 'multiple_contacts':
      return `Multiple contacts: ${pattern.description}`;
    default:
      return pattern.description;
  }
}

/**
 * Create a signal with proper structure
 */
function createSignal(params: {
  type: SignalType;
  content: string;
  interpretation: ScreenshotInterpretation;
  contactMatches: ContactMatch[];
  timestamp: Date;
}): ScreenshotSignal {
  const { type, content, interpretation, contactMatches, timestamp } = params;

  // Find the best contact match for this signal
  const bestMatch = contactMatches.find(m => m.confidence > 0.7);

  return {
    id: generateId(),
    type,
    source: 'screenshot',
    timestamp,
    content,
    relatedContactId: bestMatch?.contactId,
    confidence: interpretation.confidence,
    metadata: {
      contentType: interpretation.contentType,
      participants: interpretation.peopleDetected.slice(0, 5),
      dates: interpretation.datesDetected.slice(0, 5),
      interpretationId: interpretation.id,
    },
  };
}

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

// ============================================================================
// MAIN INTERPRETATION PIPELINE
// ============================================================================

/**
 * Process raw LLM analysis into a structured interpretation.
 * This is the main entry point for post-processing LLM output.
 */
export function processInterpretation(
  rawAnalysis: string,
  llmOutput?: {
    contentType?: string;
    summary?: string[];
    peopleDetected?: string[];
    datesDetected?: string[];
    patterns?: Array<{ type: string; description: string; severity?: string }>;
    inferredIntent?: string;
    confidence?: number;
  },
): ScreenshotInterpretation {
  return {
    id: generateId(),
    contentType: classifyContent(rawAnalysis, llmOutput?.contentType),
    summary: generateSummary(rawAnalysis, llmOutput?.summary),
    peopleDetected: extractPeople(rawAnalysis, llmOutput?.peopleDetected),
    datesDetected: extractDates(rawAnalysis, llmOutput?.datesDetected),
    patterns: detectPatterns(rawAnalysis, llmOutput?.patterns),
    inferredIntent: llmOutput?.inferredIntent,
    confidence: llmOutput?.confidence ?? 0.7,
    rawAnalysis,
  };
}

/**
 * Complete interpretation pipeline: takes LLM output and user contacts,
 * returns interpretation and generated signals.
 */
export async function runInterpretationPipeline(
  rawAnalysis: string,
  llmOutput?: {
    contentType?: string;
    summary?: string[];
    peopleDetected?: string[];
    datesDetected?: string[];
    patterns?: Array<{ type: string; description: string; severity?: string }>;
    inferredIntent?: string;
    confidence?: number;
  },
  userContacts?: Array<{ id: string; name: string }>,
): Promise<{
  interpretation: ScreenshotInterpretation;
  contactMatches: ContactMatch[];
  signals: ScreenshotSignal[];
}> {
  // Step 1: Process interpretation
  const interpretation = processInterpretation(rawAnalysis, llmOutput);

  // Step 2: Match contacts if provided
  const contactMatches = userContacts
    ? matchContacts(interpretation.peopleDetected, userContacts)
    : [];

  // Step 3: Generate signals (only after user confirmation in real flow)
  // This function prepares signals but they should only be committed after confirmation
  const signals = generateSignals(interpretation, contactMatches);

  return {
    interpretation,
    contactMatches,
    signals,
  };
}
