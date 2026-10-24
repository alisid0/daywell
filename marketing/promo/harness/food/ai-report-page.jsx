// Harness-only page (page=aireport): the real AiReport under a conversation reply and under a food estimate.
import { AiReport } from "@/app/ai-report";

const reply = "Let’s slow things down together. Try letting your shoulders drop, then breathe out a little longer than you breathe in.";
const estimate = "Chicken noodle soup, 1 bowl: about 350 kcal, sugar about 4 g.";
export default function AiReportPage() {
  return <div style={{ maxWidth: 420, margin: "0 auto", padding: 16, display: "grid", gap: 28, background: "#fae7ef", minHeight: "100vh", color: "#522d46" }}>
    <section aria-label="Conversation" className="daywell-host">
      <div className="host-conversation"><p className="host-heard">You: Can you help me feel less wound up?</p><p className="host-reply"><span>Daywell</span>{reply}</p></div>
      <AiReport source="conversation" text={reply}/>
    </section>
    <section aria-label="Food estimate" className="capture-review" style={{ background: "#fff7fb", borderRadius: 18, padding: 16 }}>
      <article className="capture-draft-item"><strong>Chicken noodle soup, 1 bowl</strong><small>About 350 kcal · sugar about 4 g</small></article>
      <AiReport source="food-estimate" noun="estimate" text={estimate}/>
    </section>
  </div>;
}
