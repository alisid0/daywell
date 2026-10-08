import scope from '../config/wellness-scope.json' with { type: 'json' };

export const wellnessInstructions = scope.instructions;
export const wellnessScopeVersion = scope.version;

// A bounded refusal for explicit requests, not a symptom checker or a claim
// that all medical language can be recognised. Live AI also needs the policy.
export function wellnessBoundary(input: string): string | undefined {
  const text = input.toLowerCase().replace(/[’']/g, "'");
  if (/\b(?:overdose|kill myself|end my life|can't stay safe|cannot stay safe|can't keep myself safe|cannot keep myself safe|throat is swelling|chest pain)\b/.test(text)) return scope.urgentReply;
  if (/\b(?:diagnos\w*|prescrib\w*|medication|medicines?|sleeping (?:pills?|tablets?)|supplements?|melatonin|alcohol|medical advice|clinical advice|rehabilitation|insulin|test results|(?:treat|cure) (?:my|a|an) (?:condition|illness|disease|disorder|depression|anxiety|insomnia|injury)|calorie deficit|starve myself)\b/.test(text)) return scope.boundaryReply;
  return undefined;
}
