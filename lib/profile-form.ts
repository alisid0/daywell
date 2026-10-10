// Form logic for the "About you" details, shared by sign-up, the one-time prompt for existing accounts and
// Your details in settings. The fields hold text as typed; checkDraft turns them into settings or kind messages.
import { today, type Settings } from "./daywell.ts";
import { ADULT_AGE, HEIGHT_CM, MAX_AGE, WEIGHT_KG, ageFrom, birthYearFor, calorieEstimate, calorieGuide, fromFeetInches, fromStonePounds, latestWeight, roundTenth, toFeetInches, toStonePounds, withWeight, type Sex } from "./profile.ts";

export type HeightUnit = "cm" | "ftin";
export type WeightUnit = "kg" | "stlb";
export type Units = { height: HeightUnit; weight: WeightUnit };
export type DetailsDraft = { age: string; sex: Sex | null; heightUnit: HeightUnit; cm: string; feet: string; inches: string; weightUnit: WeightUnit; kg: string; stone: string; pounds: string; consent: boolean; calorieTracking: boolean; ownNumber: string };
export type DetailsProblems = { age?: string; body?: string; badHeight?: boolean; badWeight?: boolean; consent?: string; ownNumber?: string };
export type DetailsPatch = Pick<Settings, "birthYear" | "sex" | "heightCm" | "weights" | "bodyConsentAt" | "calorieTracking" | "calorieGoal">;

export const UNDER_AGE = "Daywell is for adults, so we can’t set up a space for someone under 18. If that’s a typo, change the number.";
const OWN_NUMBER = /^\d{1,5}$/;
const read = (raw: string) => { const value = raw.trim().replace(",", "."); if (!value) return null; return /^\d+(\.\d+)?$/.test(value) ? Number(value) : NaN; };
const within = (value: number | null, range: { min: number; max: number }) => value !== null && value >= range.min && value <= range.max;
const ownNumber = (raw: string) => { const value = raw.trim(); return OWN_NUMBER.test(value) && Number(value) >= 1 && Number(value) <= 10000 ? Number(value) : null; };

export function draftFrom(settings: Settings, units: Partial<Units> = {}, at = Date.now()): DetailsDraft {
  const weight = latestWeight(settings.weights);
  const draft: DetailsDraft = {
    age: settings.birthYear === null ? "" : String(ageFrom(settings.birthYear, at)), sex: settings.sex,
    heightUnit: "cm", cm: settings.heightCm === null ? "" : String(roundTenth(settings.heightCm)), feet: "", inches: "",
    weightUnit: "kg", kg: weight ? String(weight.kg) : "", stone: "", pounds: "",
    consent: settings.bodyConsentAt !== null, calorieTracking: settings.calorieTracking, ownNumber: settings.calorieGoal > 0 ? String(settings.calorieGoal) : "",
  };
  return withWeightUnit(withHeightUnit(draft, units.height ?? "cm", settings.heightCm), units.weight ?? "kg", weight?.kg ?? null);
}

// Height in cm and weight in kg from whichever units are showing: null when blank, NaN when it isn't a number.
export function draftHeight(d: DetailsDraft) {
  if (d.heightUnit === "cm") return read(d.cm);
  const feet = read(d.feet), inches = read(d.inches);
  return feet === null && inches === null ? null : fromFeetInches(feet ?? 0, inches ?? 0);
}
export function draftWeight(d: DetailsDraft) {
  if (d.weightUnit === "kg") return read(d.kg);
  const stone = read(d.stone), pounds = read(d.pounds);
  return stone === null && pounds === null ? null : fromStonePounds(stone ?? 0, pounds ?? 0);
}

// Whether the fields show this saved value in the units showing, so rounding between units never counts as a change.
function showsHeight(d: DetailsDraft, cm: number) {
  if (d.heightUnit === "cm") return read(d.cm) === roundTenth(cm);
  const { feet, inches } = toFeetInches(cm);
  return (read(d.feet) ?? 0) === feet && (read(d.inches) ?? 0) === inches;
}
function showsWeight(d: DetailsDraft, kg: number) {
  if (d.weightUnit === "kg") return read(d.kg) === roundTenth(kg);
  const { stone, pounds } = toStonePounds(kg);
  return (read(d.stone) ?? 0) === stone && (read(d.pounds) ?? 0) === pounds;
}

// Switching units converts what's there, so nothing typed is lost. A saved value converts from the saved number.
export function withHeightUnit(d: DetailsDraft, unit: HeightUnit, savedCm: number | null = null): DetailsDraft {
  if (unit === d.heightUnit) return d;
  const cm = savedCm !== null && showsHeight(d, savedCm) ? savedCm : draftHeight(d), known = cm !== null && cm >= 50 && cm <= 300;
  if (unit === "cm") return { ...d, heightUnit: unit, cm: cm !== null && known ? String(roundTenth(cm)) : "" };
  const imperial = cm !== null && known ? toFeetInches(cm) : null;
  return { ...d, heightUnit: unit, feet: imperial ? String(imperial.feet) : "", inches: imperial ? String(imperial.inches) : "" };
}
export function withWeightUnit(d: DetailsDraft, unit: WeightUnit, savedKg: number | null = null): DetailsDraft {
  if (unit === d.weightUnit) return d;
  const kg = savedKg !== null && showsWeight(d, savedKg) ? savedKg : draftWeight(d), known = kg !== null && kg >= 10 && kg <= 400;
  if (unit === "kg") return { ...d, weightUnit: unit, kg: kg !== null && known ? String(roundTenth(kg)) : "" };
  const imperial = kg !== null && known ? toStonePounds(kg) : null;
  return { ...d, weightUnit: unit, stone: imperial ? String(imperial.stone) : "", pounds: imperial ? String(imperial.pounds) : "" };
}

export const hasBodyText = (d: DetailsDraft) => [d.cm, d.feet, d.inches, d.kg, d.stone, d.pounds].some(value => value.trim() !== "");

// Checks the draft and, when it's fine, returns the settings to save. A blank weight keeps the record as it is;
// a changed weight becomes today's entry. Deleting height and weight is a separate, explicit action.
export function checkDraft(d: DetailsDraft, settings: Settings, at = Date.now()): { problems: DetailsProblems; patch: DetailsPatch | null } {
  const problems: DetailsProblems = {};
  const ageText = d.age.trim(), age = /^\d{1,3}$/.test(ageText) ? Number(ageText) : NaN;
  if (!ageText) problems.age = "Add your age to continue.";
  else if (!(age >= 1 && age <= MAX_AGE)) problems.age = "Check your age. Use whole numbers, like 35.";
  else if (age < ADULT_AGE) problems.age = UNDER_AGE;
  const height = draftHeight(d), weight = draftWeight(d);
  const badHeight = height !== null && !within(height, HEIGHT_CM), badWeight = weight !== null && !within(weight, WEIGHT_KG);
  if (badHeight || badWeight) Object.assign(problems, { badHeight, badWeight, body: badHeight && badWeight ? "That height and weight don’t look right. Check the numbers, or leave them blank." : `That ${badHeight ? "height" : "weight"} doesn’t look right. Check the numbers, or leave it blank.` });
  else if ((height !== null || weight !== null) && !d.consent) problems.consent = "Tick the box to keep your height and weight, or clear them to skip.";
  if (d.calorieTracking && d.ownNumber.trim() && ownNumber(d.ownNumber) === null) problems.ownNumber = "Use a whole number of kcal, like 1800, or leave it blank to use your estimate.";
  if (Object.keys(problems).length) return { problems, patch: null };
  const latest = latestWeight(settings.weights);
  const weights = weight === null || (latest && showsWeight(d, latest.kg)) ? settings.weights : withWeight(settings.weights, today(at), weight);
  const heightCm = height === null ? null : settings.heightCm !== null && showsHeight(d, settings.heightCm) ? settings.heightCm : roundTenth(height);
  const keepsBody = heightCm !== null || weights.length > 0;
  return { problems, patch: {
    birthYear: birthYearFor(age, at), sex: d.sex, heightCm, weights,
    bodyConsentAt: keepsBody ? settings.bodyConsentAt ?? new Date(at).toISOString() : null,
    calorieTracking: d.calorieTracking,
    calorieGoal: d.calorieTracking ? ownNumber(d.ownNumber) ?? 0 : settings.calorieGoal,
  } };
}

// What the calorie guide would be with the details as typed, for the note under the switch.
export type GuidePreview = { kind: "off" } | { kind: "own"; kcal: number } | { kind: "estimate"; kcal: number; averaged: boolean } | { kind: "needs-age" } | { kind: "needs-body" };
export function guidePreview(d: DetailsDraft, settings: Settings): GuidePreview {
  if (!d.calorieTracking) return { kind: "off" };
  const own = ownNumber(d.ownNumber);
  if (own !== null) return { kind: "own", kcal: own };
  const ageText = d.age.trim(), age = Number(ageText);
  if (!/^\d{1,3}$/.test(ageText) || age < ADULT_AGE || age > MAX_AGE) return { kind: "needs-age" };
  const height = draftHeight(d), weight = draftWeight(d) ?? latestWeight(settings.weights)?.kg ?? null;
  if (height === null || weight === null || !within(height, HEIGHT_CM) || !within(weight, WEIGHT_KG)) return { kind: "needs-body" };
  return { kind: "estimate", kcal: calorieEstimate({ age, heightCm: height, weightKg: weight, sex: d.sex }), averaged: d.sex !== "female" && d.sex !== "male" };
}

export function formatHeight(cm: number, unit: HeightUnit = "cm") {
  if (unit === "cm") return `${roundTenth(cm)} cm`;
  const { feet, inches } = toFeetInches(cm);
  return `${feet} ft ${inches} in`;
}
export function formatWeight(kg: number, unit: WeightUnit = "kg") {
  if (unit === "kg") return `${roundTenth(kg)} kg`;
  const { stone, pounds } = toStonePounds(kg);
  return `${stone} st ${pounds} lb`;
}
export const formatKcal = (kcal: number) => kcal.toLocaleString("en-GB");

const dayMonth = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

// Plain-language rows for the Ready step and Your details; dated adds when the latest weight was recorded.
export function detailsSummary(settings: Settings, { units = {}, dated = false }: { units?: Partial<Units>; dated?: boolean } = {}, at = Date.now()): [string, string][] {
  const weight = latestWeight(settings.weights), guide = calorieGuide(settings, at);
  return [
    ["Age", settings.birthYear === null ? "Not added" : String(ageFrom(settings.birthYear, at))],
    ["Sex, for estimates", settings.sex === "female" ? "Female" : settings.sex === "male" ? "Male" : "Not said"],
    ["Height", settings.heightCm === null ? "Not added" : formatHeight(settings.heightCm, units.height)],
    ["Weight", weight ? `${formatWeight(weight.kg, units.weight)}${dated ? `, ${dayMonth(weight.date)}` : ""}` : "Not added"],
    ["Calorie tracking", !settings.calorieTracking ? "Off" : guide ? `On, ${guide.source === "estimate" ? "about " : ""}${formatKcal(guide.kcal)} kcal a day` : "On, with no daily guide yet"],
  ];
}
