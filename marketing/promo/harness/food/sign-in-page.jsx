// Harness-only page (page=signin): the real sign-in screens; main.jsx fakes the server's answers.
// The code is always 246810. sam@example.com already has an account; any other address is new.
const loader = Object.values(import.meta.glob("../../app/sign-in/sign-in.tsx"))[0];
const SignIn = loader ? (await loader()).default : () => <p>Sign-in isn't on this branch.</p>;
const params = new URLSearchParams(location.search);
export default function SignInPage() {
  return <SignIn returnTo="/?view=today" signedOut={params.has("signedout")} starting={params.has("start")} />;
}
