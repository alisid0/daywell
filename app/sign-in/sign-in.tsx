"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { CompanionPortrait } from "@/components/daywell-companions";
import { cantCheck, cantSend, codeDigits, codeProblem, looksLikeEmail, signInRequest } from "@/lib/sign-in-client";

// Sign in or join with an emailed code (approved preview, 13 October 2026; docs/sign-in.md).
// `starting` is the wording for people who tapped "Start Daywell"; both paths sign in or create the account.
type Step = "email" | "code" | "welcome";

export default function SignIn({ returnTo = "/", signedOut = false, starting = false }: { returnTo?: string; signedOut?: boolean; starting?: boolean }) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [problem, setProblem] = useState("");
  const [notice, setNotice] = useState(signedOut ? "You’re signed out. Everything you saved stays in your account." : "");
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(0);
  const emailInput = useRef<HTMLInputElement>(null), codeInput = useRef<HTMLInputElement>(null), welcome = useRef<HTMLHeadingElement>(null);
  const shown = useRef<Step>("email");

  useEffect(() => {
    if (wait <= 0) return;
    const timer = setTimeout(() => setWait(seconds => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);
  // Focus follows each new step, but not on first load, where a screen reader starts at the heading.
  useEffect(() => {
    if (shown.current === step) return;
    shown.current = step;
    (step === "email" ? emailInput : step === "code" ? codeInput : welcome).current?.focus();
  }, [step]);

  async function sendCode(event?: FormEvent) {
    event?.preventDefault();
    const address = email.trim();
    if (!looksLikeEmail(address)) { setProblem("Enter your email address, like name@example.com."); return; }
    setBusy(true); setProblem(""); setNotice("");
    const reply = await signInRequest("/api/sign-in/code", { email: address }, cantSend);
    setBusy(false);
    if (!reply.ok) { setProblem(reply.error); return; }
    if (step === "code") setNotice(`We sent a new code to ${address}.`);
    setCode(""); setWait(30); setStep("code");
  }

  async function checkCode(value: string) {
    if (busy) return;
    setBusy(true); setProblem(""); setNotice("");
    const reply = await signInRequest("/api/sign-in/verify", { email: email.trim(), code: value }, cantCheck);
    if (reply.ok && !reply.created) { window.location.assign(returnTo); return; }
    setBusy(false);
    if (reply.ok) { setStep("welcome"); return; }
    setProblem(codeProblem(reply));
    codeInput.current?.select();
  }

  function typeCode(value: string) {
    const digits = codeDigits(value);
    setCode(digits);
    if (digits.length === 6) void checkCode(digits);
  }

  function changeEmail() {
    setProblem(""); setNotice(""); setStep("email");
  }

  const problemBox = problem ? <p id="sign-in-problem" className="sign-in-problem" role="alert">{problem}</p> : null;
  const noticeBox = notice ? <p className="sign-in-notice" role="status">{notice}</p> : null;
  return <main className="sign-in" aria-labelledby="sign-in-title">
    <div className="sign-in-card">
      {step === "email" && <form className="sign-in-step" onSubmit={sendCode} noValidate>
        <div className="sign-in-friends" aria-hidden="true"><CompanionPortrait id="luma" size={64} decorative eager /><CompanionPortrait id="pip" size={64} decorative eager /></div>
        <h1 id="sign-in-title">{starting ? "Start with your email" : "Sign in with your email"}</h1>
        <p className="sign-in-lede">We’ll send you a 6-digit code. There’s no password to remember.</p>
        {noticeBox}
        <label htmlFor="sign-in-email">Email</label>
        <input id="sign-in-email" ref={emailInput} type="email" inputMode="email" autoComplete="email" autoCapitalize="off" spellCheck={false} placeholder="name@example.com"
          value={email} onChange={event => setEmail(event.target.value)} aria-invalid={problem ? true : undefined} aria-describedby={problem ? "sign-in-problem" : undefined} />
        {problemBox}
        <button className="sign-in-primary" type="submit" disabled={busy}>{busy ? "Sending…" : "Send my code"}</button>
        <p className="sign-in-fine">{starting ? "Already have an account? This signs you in." : "New here? The same code makes your account."}</p>
      </form>}

      {step === "code" && <form className="sign-in-step" onSubmit={event => { event.preventDefault(); void checkCode(code); }} noValidate>
        <button className="sign-in-back" type="button" onClick={changeEmail}>‹ Use a different email</button>
        <h1 id="sign-in-title">Check your email</h1>
        <p className="sign-in-lede">We sent a code to <strong>{email.trim()}</strong>. It can take a minute to arrive.</p>
        {noticeBox}
        <label htmlFor="sign-in-code">6-digit code</label>
        <input id="sign-in-code" ref={codeInput} className="sign-in-code" inputMode="numeric" autoComplete="one-time-code" placeholder="······"
          value={code} onChange={event => typeCode(event.target.value)} aria-invalid={problem ? true : undefined} aria-describedby={problem ? "sign-in-problem" : undefined} />
        {problemBox}
        <button className="sign-in-primary" type="submit" disabled={busy || code.length !== 6}>{busy ? "Checking…" : "Sign in"}</button>
        <button className="sign-in-text" type="button" disabled={busy || wait > 0} onClick={() => void sendCode()}>
          {wait > 0 ? `Send a new code in 0:${String(wait).padStart(2, "0")}` : "Send a new code"}
        </button>
        <p className="sign-in-fine">Not there? Check your spam or junk folder.</p>
      </form>}

      {step === "welcome" && <div className="sign-in-step">
        <div className="sign-in-friends" aria-hidden="true">{(["luma", "pip", "bounce", "nori"] as const).map(id => <CompanionPortrait key={id} id={id} size={60} decorative eager />)}</div>
        <h1 id="sign-in-title" ref={welcome} tabIndex={-1}>Welcome to Daywell</h1>
        <p className="sign-in-lede">Your account is ready.</p>
        <a className="sign-in-primary" href={returnTo}>Continue</a>
      </div>}
    </div>
  </main>;
}
