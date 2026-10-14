declare namespace Cloudflare {
  interface Env {
    ASSETS?: Fetcher;
    DAYWELL_APP_ORIGIN?: string;
    CF_ACCESS_ISSUER?: string;
    CF_ACCESS_AUD?: string;
    // Public app with email sign-in (docs/sign-in.md). The secret and review code are Worker secrets.
    DAYWELL_AUTH_SECRET?: string;
    DAYWELL_EMAIL_FROM?: string;
    DAYWELL_REVIEW_EMAIL?: string;
    DAYWELL_REVIEW_CODE?: string;
    // Tester addresses who can switch plans without paying until store purchases exist (docs/plans.md).
    DAYWELL_PLAN_TESTERS?: string;
    EMAIL?: SendEmail;
    ELEVENLABS_API_KEY?: string;
    ELEVENLABS_AGENT_ID?: string;
    DB?: D1Database;
    BUCKET?: R2Bucket;
    OPENAI_API_KEY?: string;
    OPENAI_MODEL?: string;
    OPENAI_TRANSCRIBE_MODEL?: string;
    TYPESAFE_API_KEY?: string;
    TYPESAFE_PICKER_ENABLED?: string;
  }
}
