const SENSITIVE_PATTERNS: RegExp[] = [
  /\bpain\b/i,
  /\binjur(?:y|ed|ies)\b/i,
  /\bsharp\b.*\b(shoulder|knee|back|hip|elbow|wrist|neck)\b/i,
  /\b(doctor|physio|physiotherap(?:y|ist)|medical|clinic)\b/i,
  /\bnumb(?:ness|ing)?\b/i,
  /\bswell(?:ing|ed)?\b/i,
  /\bdizzy|dizziness|nause(?:a|ous)\b/i
];

export function detectSensitiveContent(text: string | null | undefined): boolean {
  if (!text) return false;
  return SENSITIVE_PATTERNS.some((re) => re.test(text));
}
