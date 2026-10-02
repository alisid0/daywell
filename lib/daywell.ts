import { z } from "zod";
export const moduleIds = ["alarm","clock","focus","sleep","grocery","food","move"] as const;
export const settingsSchema = z.object({name:z.string().trim().min(1).max(40),modules:z.array(z.enum(moduleIds)).min(1).max(7).transform(v=>[...new Set(v)]),calorieGoal:z.number().int().min(0).max(10000),bedtime:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),wakeTime:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),onboarded:z.boolean()});
export const defaults = {name:"You", modules:[...moduleIds],calorieGoal:2000,bedtime:"22:30",wakeTime:"07:00",onboarded:false};
const title=z.string().trim().min(1).max(160), date=z.string().regex(/^\d{4}-\d{2}-\d{2}$/), time=z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
export const schemas = {
 task:z.object({title,done:z.boolean(),date,minutes:z.number().int().min(1).max(240)}),
 grocery:z.object({title,quantity:z.string().trim().min(1).max(40),done:z.boolean()}),
 food:z.object({title,date,calories:z.number().min(0).max(10000),protein:z.number().min(0).max(1000),carbs:z.number().min(0).max(1000),fat:z.number().min(0).max(1000),meal:z.enum(["Breakfast","Lunch","Dinner","Snack"])}),
 sleep:z.object({date,bedtime:time,wakeTime:time,minutes:z.number().min(1).max(960),quality:z.enum(["Rested","Okay","Tired"])}),
 move:z.object({title,date,minutes:z.number().int().min(1).max(600)}),
 alarm:z.object({title,time,enabled:z.boolean(),days:z.array(z.number().int().min(0).max(6)).max(7),lastFired:z.string().max(50).optional(),snoozeAt:z.number().nullable().optional()}),
 timer:z.object({title:z.string().max(160),duration:z.number().min(1).max(86400),remaining:z.number().min(0).max(86400),endAt:z.number().nullable(),mode:z.enum(["Focus","Break","Timer"])}),
 session:z.object({title,date,minutes:z.number().min(0).max(1440)})
};
export type Settings=z.infer<typeof settingsSchema>;
export type Kind=keyof typeof schemas;
export type Entry={id:string,kind:Kind,data:any};
export function today(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
export function sleepMinutes(bed:string,wake:string){const n=(x:string)=>Number(x.split(":")[0])*60+Number(x.split(":")[1]);return (n(wake)-n(bed)+1440)%1440}
export function displayTime(time:string){const [h,m]=time.split(":").map(Number);return `${h%12||12}:${String(m).padStart(2,"0")} ${h>=12?"pm":"am"}`}
