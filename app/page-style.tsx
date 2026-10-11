"use client";
import { useDaywellStyle } from "./design-switcher";

// Applies the person's chosen look to standalone pages that are otherwise rendered on the server.
export function PageStyle() { useDaywellStyle(); return null; }
