declare namespace Cloudflare {
  interface Env {
    DAYWELL_APP_ORIGIN?: string;
    CF_ACCESS_ISSUER?: string;
    CF_ACCESS_AUD?: string;
    ELEVENLABS_API_KEY?: string;
    ELEVENLABS_AGENT_ID?: string;
    DB?: D1Database;
    BUCKET?: R2Bucket;
    OPENAI_API_KEY?: string;
    OPENAI_MODEL?: string;
    OPENAI_TRANSCRIBE_MODEL?: string;
  }
}
