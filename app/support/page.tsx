import Link from "next/link";
import { PageStyle } from "../page-style";
import { ContactEmail } from "../owner-details";

export const metadata = { title: "Help and support · Daywell" };
export default function Support() {
  return <main className="daywell-page"><PageStyle /><article className="well-space daywell-page-inner daywell-legal">
    <Link className="well-text-button" href="/">← Back to Daywell</Link>
    <div className="well-heading"><span>Help and support</span><h1>How can we help?</h1></div>
    <section className="urgent-help" aria-labelledby="urgent-title">
      <h2 id="urgent-title">Need urgent help?</h2>
      <p>Daywell can’t help in an emergency.</p>
      <ul>
        <li>If you or someone else is in danger, call <a href="tel:999">999</a> in the UK, or your local emergency number.</li>
        <li>For urgent mental health help in England, call <a href="tel:111">NHS 111</a> and choose the mental health option.</li>
        <li>To talk to someone at any time, call Samaritans free on <a href="tel:116123">116 123</a> (UK and Ireland).</li>
      </ul>
    </section>
    <section><h2>Contact us</h2><p>Email <ContactEmail />. We’ll reply as soon as we can.</p></section>
    <section><h2>Common questions</h2>
      <h3>How do I download or delete my data?</h3>
      <p>Open settings, then <Link href="/account">Your data and privacy</Link>.</p>
      <h3>Talk to Daywell isn’t working</h3>
      <p>Check that your browser is allowed to use the microphone. You can also type: everyday commands work without a live conversation.</p>
      <h3>How many live conversations can I have?</h3>
      <p>Live conversations have a daily limit, so Daywell can stay affordable. Typing everyday commands works at any time.</p>
      <h3>Some text is hard to read</h3>
      <p>Open settings, then Reading comfort, to change the font, text size and spacing.</p>
    </section>
    <section><h2>Privacy</h2><p><Link href="/privacy">How Daywell uses your data</Link></p></section>
  </article></main>;
}
