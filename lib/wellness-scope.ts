import scope from '../config/wellness-scope.json' with { type: 'json' };

export const wellnessInstructions = scope.instructions;
export const wellnessScopeVersion = scope.version;

// Everyday phrases that share a word with a clinical request. They are removed before
// the boundary check, so the clinical words on their own still match.
const everydayPhrases = /\b(?:medicine (?:balls?|cabinets?|cupboards?)|alcohol[- ]free|(?:non|low|no|zero)[- ]alcohol(?:ic)?|(?:rubbing|isopropyl) alcohol|alcohol (?:hand )?(?:wipes?|gel|spray|swabs?))\b/g;
// "Diagnose" and "test results" are also everyday words for things and exams, but only
// when the request doesn't mention the body or health.
const healthWords = /\b(?:injur\w*|pains?|painful|hurts?|hurting|aches?|aching|sore|rash\w*|lumps?|symptoms?|swell\w*|bleed\w*|fever|ill|illness|sick|disease\w*|infect\w*|blood|heart|chest|breath\w*|skin|mental|anxi\w*|depress\w*|insomnia|allerg\w*|pregnan\w*|medical|doctor|health)\b/;
const diagnoseThing = /\bdiagnos\w*\s+(?:[\w'-]+\s+){0,4}?(?:bikes?|bicycles?|cars?|engines?|laptops?|computers?|phones?|wi-?fi|internet|routers?|printers?|code|apps?|websites?|tvs?|boilers?|washing machines?|dishwashers?|fridges?|ovens?|plants?|garden|lawn)\b/g;
const examWords = /\b(?:exams?|driving|theory|mock|school|class|college|university|uni|spelling|maths?|gcses?|a[- ]levels?|sats?|typing|quiz|coursework)\b/;

// A bounded refusal for explicit requests, not a symptom checker or a claim
// that all medical language can be recognised. Live AI also needs the policy.
export function wellnessBoundary(input: string): string | undefined {
  const text = input.toLowerCase().replace(/[’']/g, "'").replace(/[‐-―]/g, "-");
  if (/\b(?:overdose|kill myself|end my life|can't stay safe|cannot stay safe|can't keep myself safe|cannot keep myself safe|throat is swelling|chest pain)\b/.test(text)) return scope.urgentReply;
  let checked = text.replace(everydayPhrases, " ");
  if (!healthWords.test(checked)) {
    checked = checked.replace(diagnoseThing, " ");
    if (examWords.test(checked)) checked = checked.replace(/\btest results\b/g, " ");
  }
  if (/\b(?:diagnos\w*|prescrib\w*|medication|medicines?|sleeping (?:pills?|tablets?)|supplements?|melatonin|alcohol|medical advice|clinical advice|rehabilitation|insulin|test results|(?:treat|cure) (?:my|a|an) (?:condition|illness|disease|disorder|depression|anxiety|insomnia|injury)|calorie deficit|starve myself)\b/.test(checked)) return scope.boundaryReply;
  return undefined;
}
