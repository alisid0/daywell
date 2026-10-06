import type { CompanionId } from "./companions";
import type { CompanionDrawOptions, CompanionLayers, CompanionMotion, CompanionPose } from "./companion-motion";

export interface CompanionRig { assets: CompanionLayers }
export const chars: Record<CompanionId, { name: string; color: string; message: string; action: string; prop: number[]; type: string }>;
export const modes: Record<CompanionMotion, string>;
export const furDefaults: { strength: number };
export function duration(mode: CompanionMotion): number;
export function poseAt(id: CompanionId, mode: CompanionMotion, time: number): CompanionPose;
export function blendPose(a: CompanionPose, b: CompanionPose, t: number): CompanionPose;
export function createRig(assets: CompanionLayers, makeCanvas: (width: number, height: number) => HTMLCanvasElement): CompanionRig;
export function draw(context: CanvasRenderingContext2D, rig: CompanionRig, id: CompanionId, mode: CompanionMotion, time: number, options?: CompanionDrawOptions): CompanionPose;
