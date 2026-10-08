# Picture and voice workflow

Owner direction, 8 October 2026: minimise typing. Think of the immediacy of a camera app for food, and a supportive training partner for movement. Keep one Daywell host; mascots accompany the activity rather than becoming separate assistants to remember.

## Food

Lead Eat with Take a photo and Tell Daywell. Choose Meal or drink, Food basket, or Shopping list; explain the destination before capture. A second record button exposes the sharing notice before microphone permission is requested. Use a rear-camera hint on mobile and offer an existing-photo picker.

1. Capture a picture or up to 30 seconds of speech. Send to AI only when the person requests understanding.
2. Show what was understood. Ask one question if needed; allow spoken corrections and optional typing. Nutrition is approximate; sugar needs an amount supplied by the person or a legible label and known consumed quantity. Unknown means unknown.
3. Confirm before saving. Meal entries require the person to confirm consumption and the portion. A meal photo cannot deduct ingredients from stock.
4. Basket recognition hands reviewed ingredients into the existing inventory editor. Add separate items, remove duplicates during review, allow uncertain quantities, and never infer expiry dates. Saving uses the same revision checks, retry reference, recovery and undo as other basket operations.
5. Shopping captures create unchecked notes, never a purchase or consumed meal. The normal shopping flow records what was actually bought later.

Typing stays available for correction, accessibility and service outages. AI estimates cannot verify ingredients, allergens or food safety. Preserve the general-wellness boundaries.

## Movement

Lead with a small selection of routines, optional spoken step cues and one-tap commands. Done records a completed step; Next/Skip moves on without recording it. Pause, Continue, Repeat, Easier and End have bounded meanings. Unrecognised or negated instructions change nothing. Review completed sets before saving. Never infer calories burned from an image or automatically record a full routine when someone ends early.

No workout photos or camera permissions are part of this flow. Device speech is the current routine implementation and is labelled as such. ElevenLabs live chat remains separate; expressive live coaching tied to routine state is still an integration task, not a delivered feature.

## Current connection and verification

The capture endpoint uses server-side OpenAI credentials; never put keys in frontend code. On the development machine at this checkpoint, ElevenLabs configuration exists but OPENAI_API_KEY is absent. Choosing photos, review logic and failure handling can be tested, but real image interpretation and recorded-speech transcription require that separate connection. Do not represent samples or tests as live recognition.

Reference: [OpenAI image inputs](https://developers.openai.com/api/docs/guides/images-vision), [speech transcription](https://developers.openai.com/api/docs/guides/speech-to-text), [structured output](https://developers.openai.com/api/docs/guides/structured-outputs).
