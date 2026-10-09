import type { ComponentProps } from "react";

// Vinext's production client router currently fails when following Next Link.
// Native navigation works behind Access and preserves normal link behaviour.
export default function DaywellLink(props: ComponentProps<"a">) {
  return <a {...props} />;
}
