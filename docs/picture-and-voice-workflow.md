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

### From basket to meals

Next meals now offers a one-person plan for 1, 2, 3 or 7 individual meals. The capture flow can send the saved basket and reserved quantities to the AI service, with a sharing notice before the person requests suggestions. Spoken or written corrections and photos can clarify the request. Review every suggestion before adding it alongside existing plans.

Coverage is calculated from recorded quantities locally, allocating each ingredient once after existing reservations. It does not mean days of complete nutrition, nutritional adequacy or a freshness guarantee. Unknown amounts and incompatible units require checking. Saving a plan updates missing shopping needs without using stock or recording consumption.

The three existing recipe ideas also open the same review without AI. A quick egg-and-noodle option appears when matching ingredients are in the basket: the person chooses each meal's quantities, and calories stay unknown unless supplied. This is a fixed starting idea, not live recognition or a general offline recipe generator.

After cooking, confirm the quantities actually used. Personal intake is optional and distinct from preparation and leftovers. A plan's calorie estimate can prefill personal intake only when the recorded ingredients match; portion changes scale the reviewed totals. Ingredient edits clear the old estimate. Half-portions of leftovers are supported.

For meal captures, choose Home-prepared, Takeaway or Restaurant, then review the consumed fraction. A quick half/double correction scales calories, macros and known sugar together. There is no restaurant nutrition lookup integration: photo estimates cannot be presented as verified menu data, and restaurant meals never deduct home stock automatically.

## Movement

Lead with a small selection of routines, optional spoken step cues and one-tap commands. Done records a completed step; Next/Skip moves on without recording it. Pause, Continue, Repeat, Easier and End have bounded meanings. Unrecognised or negated instructions change nothing. Review completed sets before saving. Never infer calories burned from an image or automatically record a full routine when someone ends early.

No workout photos or camera permissions are part of this flow. Device speech is the current routine implementation and is labelled as such. ElevenLabs live chat remains separate; expressive live coaching tied to routine state is still an integration task, not a delivered feature.

The one-kettlebell routine includes setup cues, separate left/right carries and optional rest phases. A rest timer does not complete a movement: the person chooses when to continue. Ending during rest preserves only already-completed exercises. Enter the actual bell weight once before reviewing; unweighted alternatives do not inherit it. See the [Food and Move checkpoint](handover/2026-10-08-food-move-kettlebell.md) for scope, checks and remaining launch gaps.

## Current connection and verification

The [shared response router](response-routing.md) checks everyday commands and exact recordings locally before offering optional JEV matching or a new ElevenLabs conversation. Food statements hand their original words into the review. Continuous live conversation still generates its own turns; movement step cues remain local.

The capture endpoint uses server-side OpenAI credentials; never put keys in frontend code. On the development machine at this checkpoint, ElevenLabs configuration exists but OPENAI_API_KEY is absent. Choosing photos, review logic and failure handling can be tested, but real image interpretation and recorded-speech transcription require that separate connection. Do not represent samples or tests as live recognition.

Reference: [OpenAI image inputs](https://developers.openai.com/api/docs/guides/images-vision), [speech transcription](https://developers.openai.com/api/docs/guides/speech-to-text), [structured output](https://developers.openai.com/api/docs/guides/structured-outputs).
