// Harness-only page (page=notify): example Daywell reminders on a phone's lock screen, for the 23 October preview.
const card = (time, title, body) => (
  <div style={{ display: "flex", gap: 12, padding: "12px 14px", borderRadius: 22, background: "rgba(255,255,255,.78)", backdropFilter: "blur(20px)", color: "#2b1a26", boxShadow: "0 6px 20px rgba(0,0,0,.12)" }}>
    <span style={{ width: 38, height: 38, borderRadius: 10, background: "#803c65", display: "grid", placeItems: "center", flex: "none" }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff7fb" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
    </span>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, opacity: .7, fontWeight: 600 }}><span>DAYWELL</span><span>{time}</span></div>
      <div style={{ fontWeight: 700, fontSize: 16, marginTop: 2 }}>{title}</div>
      <div style={{ fontSize: 15, lineHeight: 1.35 }}>{body}</div>
    </div>
  </div>
);
export default function NotifyPage() {
  return <div style={{ minHeight: "100vh", padding: "70px 14px 40px", boxSizing: "border-box", background: "linear-gradient(170deg,#4b2a46 0%,#7b4466 45%,#c98a8f 100%)", fontFamily: "'Atkinson Hyperlegible Next', system-ui, sans-serif", color: "#fff" }}>
    <div style={{ textAlign: "center", marginBottom: 34 }}>
      <div style={{ fontSize: 18, fontWeight: 600, opacity: .9 }}>Friday 23 October</div>
      <div style={{ fontSize: 86, fontWeight: 700, lineHeight: 1, letterSpacing: -2 }}>18:20</div>
    </div>
    <div style={{ display: "grid", gap: 10 }}>
      {card("now", "Walk to the park in 10 minutes", "Bounce is ready when you are. 25 minutes, no kit needed.")}
      {card("17:30", "Tonight: tomato rice", "You have everything for it. About 25 minutes.")}
      {card("Sun 19:00", "Your week is ready", "A gentle look back at 17–23 October, whenever you like.")}
      {card("Thu 22:30", "Time to wind down", "Luma's in the quiet corner whenever you're ready.")}
    </div>
    <p style={{ textAlign: "center", marginTop: 26, fontSize: 14, opacity: .85 }}>Examples from different days</p>
  </div>;
}
