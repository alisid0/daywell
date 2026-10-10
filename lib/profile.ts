// Details a person chooses to share about themselves: their age (required, 18 and over) and, if they like, sex,
// height and weight. They're for the person's own record and, only while calorie tracking is on, a daily calorie
// guide. Keep them inside Daywell: never send them to AI services, and never turn them into BMI labels, goal
// weights, deficits or reminders to weigh in.
export const ADULT_AGE = 18;
export const MAX_AGE = 120;
export const HEIGHT_CM = { min: 120, max: 230 } as const;
export const WEIGHT_KG = { min: 30, max: 300 } as const;
export const MAX_WEIGHT_RECORDS = 100;
export const sexOptions = ["female", "male", "unspecified"] as const;
export type Sex = typeof sexOptions[number];
export type WeightRecord = { date: string; kg: number };
export type BodyDetails = { calorieTracking: boolean; calorieGoal: number; birthYear: number | null; sex: Sex | null; heightCm: number | null; weights: WeightRecord[] };

// Age is kept as a year of birth worked out from the age given, so it stays roughly current.
export const yearOf = (at = Date.now()) => new Date(at).getFullYear();
export const ageFrom = (birthYear: number, at = Date.now()) => yearOf(at) - birthYear;
export const birthYearFor = (age: number, at = Date.now()) => yearOf(at) - age;
export const roundTenth = (value: number) => Math.round(value * 10) / 10;

export function latestWeight(weights: WeightRecord[]) {
  return weights.reduce<WeightRecord | null>((latest, record) => !latest || record.date >= latest.date ? record : latest, null);
}

// Adds or replaces one day's weight, oldest first, keeping the most recent records.
export function withWeight(weights: WeightRecord[], date: string, kg: number) {
  return [...weights.filter(record => record.date !== date), { date, kg: roundTenth(kg) }]
    .sort((x, y) => x.date.localeCompare(y.date))
    .slice(-MAX_WEIGHT_RECORDS);
}

// Mifflin–St Jeor resting energy, times 1.375 for a lightly active day, rounded to the nearest 50 kcal.
// Without a stated sex it uses the midpoint of the female (−161) and male (+5) constants.
const SEX_CONSTANT: Record<Sex, number> = { female: -161, male: 5, unspecified: -78 };
export function calorieEstimate({ age, heightCm, weightKg, sex }: { age: number; heightCm: number; weightKg: number; sex: Sex | null }) {
  return Math.round((10 * weightKg + 6.25 * heightCm - 5 * age + SEX_CONSTANT[sex ?? "unspecified"]) * 1.375 / 50) * 50;
}

export type CalorieGuide = { kcal: number; source: "own" | "estimate" };
// The daily calorie guide: the person's own number if they set one, otherwise their estimate. None while tracking is off
// or while height, weight or age is missing.
export function calorieGuide(details: BodyDetails, at = Date.now()): CalorieGuide | null {
  if (!details.calorieTracking) return null;
  if (details.calorieGoal > 0) return { kcal: details.calorieGoal, source: "own" };
  const weight = latestWeight(details.weights);
  if (details.birthYear === null || details.heightCm === null || !weight) return null;
  return { kcal: calorieEstimate({ age: ageFrom(details.birthYear, at), heightCm: details.heightCm, weightKg: weight.kg, sex: details.sex }), source: "estimate" };
}

// Imperial units for the form: feet and inches, stone and pounds.
const POUND_KG = 0.45359237;
export function toFeetInches(cm: number) { const inches = Math.round(cm / 2.54); return { feet: Math.floor(inches / 12), inches: inches % 12 }; }
export const fromFeetInches = (feet: number, inches: number) => (feet * 12 + inches) * 2.54;
export function toStonePounds(kg: number) { const pounds = Math.round(kg / POUND_KG); return { stone: Math.floor(pounds / 14), pounds: pounds % 14 }; }
export const fromStonePounds = (stone: number, pounds: number) => (stone * 14 + pounds) * POUND_KG;
