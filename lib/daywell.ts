import { z } from "zod";
import { workoutSetSchema } from "./wellbeing.ts";
import { foodTrackingFields, activityTrackingFields } from "./food-tracking.ts";
export const moduleIds = ["alarm","clock","focus","sleep","grocery","food","move"] as const;
export const settingsSchema = z.object({name:z.string().trim().min(1).max(40),modules:z.array(z.enum(moduleIds)).min(1).max(7).transform(v=>[...new Set(v)]),calorieGoal:z.number().int().min(0).max(10000),bedtime:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),wakeTime:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),onboarded:z.boolean(),guideDismissed:z.boolean().default(false)});
export const defaults = {name:"You", modules:[...moduleIds],calorieGoal:2000,bedtime:"22:30",wakeTime:"07:00",onboarded:false,guideDismissed:false};
const title=z.string().trim().min(1).max(160), date=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value=>{const [year,month,day]=value.split("-").map(Number);const parsed=new Date(Date.UTC(year,month-1,day));return year>=1900&&year<=9999&&parsed.getUTCFullYear()===year&&parsed.getUTCMonth()===month-1&&parsed.getUTCDate()===day},"Choose a valid calendar date"), time=z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
export const schemas = {
 task:z.object({title,done:z.boolean(),date,completedDate:date.nullable().optional(),completedAt:z.string().datetime().nullable().optional(),minutes:z.number().int().min(1).max(240)}),
 grocery:z.object({title,completedDate:date.nullable().optional(),completedAt:z.string().datetime().nullable().optional(),quantity:z.string().trim().min(1).max(80),done:z.boolean(),foodChangedBy:z.string().regex(/^[a-zA-Z0-9-]{1,87}$/).optional()}),
 food:z.object({title,date,calories:z.number().min(0).max(10000),protein:z.number().min(0).max(1000),carbs:z.number().min(0).max(1000),fat:z.number().min(0).max(1000),nutritionKnown:z.boolean().optional(),meal:z.enum(["Breakfast","Lunch","Dinner","Snack"]),...foodTrackingFields}),
 sleep:z.object({date,bedtime:time,wakeTime:time,minutes:z.number().min(1).max(960),quality:z.enum(["Rested","Okay","Tired"])}),
 move:z.object({title,date,minutes:z.number().int().min(1).max(600),sets:z.array(workoutSetSchema).min(1).max(20).optional(),...activityTrackingFields}),
 alarm:z.object({title,time,enabled:z.boolean(),days:z.array(z.number().int().min(0).max(6)).max(7),lastFired:z.string().max(50).optional(),snoozeAt:z.number().nullable().optional()}),
 timer:z.object({title:z.string().max(160),duration:z.number().min(1).max(86400),remaining:z.number().min(0).max(86400),endAt:z.number().nullable(),mode:z.enum(["Focus","Break","Timer"]),companion:z.enum(["pip","luma","bounce","tock"]).optional(),startedAt:z.number().optional()}),
 event:z.object({title,date,allDay:z.boolean(),time,minutes:z.number().int().min(1).max(1440),location:z.string().max(200),notes:z.string().max(3000),done:z.boolean(),completedDate:date.nullable().optional(),completedAt:z.string().datetime().nullable().optional()}),
 reflection:z.object({date,text:z.string().trim().min(1).max(3000)}),
 session:z.object({title,date,minutes:z.number().min(0).max(1440)})
};
export type Settings=z.infer<typeof settingsSchema>;
export type Kind=keyof typeof schemas;
export type Entry={id:string,kind:Kind,data:any};
export function today(at=Date.now()){const d=new Date(at);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
export function sleepMinutes(bed:string,wake:string){const n=(x:string)=>Number(x.split(":")[0])*60+Number(x.split(":")[1]);return (n(wake)-n(bed)+1440)%1440}
export function displayTime(time:string){const [h,m]=time.split(":").map(Number);return `${h%12||12}:${String(m).padStart(2,"0")} ${h>=12?"pm":"am"}`}
