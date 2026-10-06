"use client";

import { useEffect, useRef } from "react";
import type { CompanionId } from "@/lib/companions";
import { companionArtworkRoot, companionLayerFiles, motionTime, type CompanionLayers, type CompanionMotion } from "@/lib/companion-motion";
import { useCompanionMotion } from "./companion-motion-preference";

const images = new Map<CompanionId, Promise<CompanionLayers>>();
function loadLayers(id: CompanionId) {
  let pending = images.get(id);
  if (!pending) {
    pending = Promise.all(Object.entries(companionLayerFiles).map(([key, file]) => new Promise<[string, HTMLImageElement]>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve([key, image]);
      image.onerror = () => reject(new Error("Companion artwork unavailable"));
      image.src = `${companionArtworkRoot}/${id}/${file}`;
    }))).then(entries => Object.fromEntries(entries) as CompanionLayers);
    images.set(id, pending);
    void pending.catch(() => images.delete(id));
  }
  return pending;
}

export function CompanionCanvas({ id, motion, size, celebration = 0 }: { id: CompanionId; motion: CompanionMotion; size: number; celebration?: number }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const current = useRef({ motion, celebration });
  useEffect(() => { current.current = { motion, celebration }; }, [motion, celebration]);
  const enabled = useCompanionMotion();

  useEffect(() => {
    const element = canvas.current;
    if (!element || !enabled) return;
    const context = element.getContext("2d");
    if (!context) return;
    let disposed = false, visible = false, frame = 0, loading = false;
    let render: ((now: number) => void) | undefined;
    let last = 0, elapsed = 0, stateElapsed = 0, transitionElapsed = 1;
    let state = current.current.motion, lastCelebration = current.current.celebration;
    let fromPose: import("@/lib/companion-motion").CompanionPose | undefined;
    let lastPose: typeof fromPose;

    const tick = (now: number) => {
      if (disposed || !visible || document.hidden || !render) return;
      frame = requestAnimationFrame(tick);
      if (last && now - last < 1000 / 24) return;
      const delta = last ? Math.min((now - last) / 1000, .12) : 0;
      last = now; elapsed += delta; stateElapsed += delta; transitionElapsed += delta;
      let next = current.current.motion;
      if (current.current.celebration > lastCelebration) {
        lastCelebration = current.current.celebration;
        next = "reaction";
      } else if (state === "reaction" && stateElapsed < 3) next = "reaction";
      if (next !== state) { fromPose = lastPose; state = next; stateElapsed = 0; transitionElapsed = 0; }
      render(now);
    };
    const sync = async () => {
      cancelAnimationFrame(frame); last = 0;
      if (disposed || !visible || document.hidden) return;
      if (!render) {
        if (loading) return;
        loading = true;
        try {
          const [renderer, layers] = await Promise.all([import("@/lib/companion-renderer.mjs"), loadLayers(id)]);
          if (disposed) return;
          const rig = renderer.createRig(layers, (width, height) => {
            const buffer = document.createElement("canvas"); buffer.width = width; buffer.height = height; return buffer;
          });
          render = () => {
            const pose = renderer.poseAt(id, state, motionTime(state, stateElapsed));
            lastPose = fromPose && transitionElapsed < .4 ? renderer.blendPose(fromPose, pose, transitionElapsed / .4) : pose;
            renderer.draw(context, rig, id, state, motionTime(state, stateElapsed), { pose: lastPose, furTime: elapsed % 8 });
            element.dataset.ready = "true";
            element.dataset.motion = state;
          };
        } catch { return; /* The matching still illustration remains visible. */ }
        finally { loading = false; }
      }
      if (!disposed && visible && !document.hidden) frame = requestAnimationFrame(tick);
    };
    const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; void sync(); });
    observer.observe(element);
    const visibility = () => { void sync(); };
    document.addEventListener("visibilitychange", visibility);
    return () => {
      disposed = true; cancelAnimationFrame(frame); observer.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      delete element.dataset.ready;
    };
  }, [enabled, id]);

  return <canvas ref={canvas} className="companion-canvas" width={size > 160 ? 512 : 256} height={size > 160 ? 512 : 256} aria-hidden="true" data-enabled={enabled} />;
}
