declare namespace Cloudflare {
  interface Env {
    ELEVENLABS_API_KEY?: string;
    ELEVENLABS_AGENT_ID?: string;
    DB?: D1Database;
    BUCKET?: R2Bucket;
    OPENAI_API_KEY?: string;
    OPENAI_MODEL?: string;
    OPENAI_TRANSCRIBE_MODEL?: string;
  }
}
