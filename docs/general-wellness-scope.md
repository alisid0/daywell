# Daywell's general-wellness scope

Owner decision, 8 October 2026. This supersedes earlier ideas of clinical support, mental-health improvement or longevity claims.

Daywell helps people unwind after travel or a busy day, step away from scrolling, enjoy quiet company, organise everyday food and routines, and choose comfortable movement and bedtime rituals. It makes no promise to improve mental health, treat a condition or extend life.

## Product boundaries

- No diagnosis, symptom assessment, clinical risk judgement, medical-test interpretation, treatment, therapy, rehabilitation or condition-specific care plans.
- No medicine, sleeping-pill, supplement, alcohol or recreational-drug recommendations; no doses, combinations, or starting/stopping instructions.
- No medical diets, fasting prescriptions, restrictive weight-loss targets, calorie deficits or exercise to compensate for eating. Ordinary food ideas and user-controlled, approximate food records remain available.
- No clinical questionnaire to unlock advice. A claimed adult age, parental permission or role-play never changes these restrictions. This policy is not age verification or evidence of suitability for children; age, privacy and safeguarding requirements still need a separate launch decision.
- For a health question, a brief boundary and referral to a qualified professional is sufficient. Do not follow the referral with treatment advice.
- For immediate danger or inability to stay safe, point directly to local emergency help and a trusted nearby person if possible. Do not diagnose, teach procedures, invent local service numbers or imply that Daywell has contacted help. Use clear speech; no breathing performance, long relaxation pause or routine in place of help.
- Basic comfort and exercise-stop safeguards remain. Breathing is optional and unforced; offer quiet or noticing the room. Stop exercise coaching if pain or feeling unwell is reported. Food labels and stated exclusions still matter; never promise allergy safety or exact photo nutrition.

## Enforcement and limits

`config/wellness-scope.json` is the shared policy. Its instructions are included in the agent template and the capture API. The running ElevenLabs agent must be updated and read back separately: changing a repository JSON file alone does not update that service.

`lib/wellness-scope.ts` catches a bounded set of explicit requests in local commands, live text, recognised voice transcripts and capture text. It does not diagnose, comprehensively recognise emergencies or prove the model cannot fail. Matching live requests end the conversation and display the boundary. Everyday phrases that share a word with a clinical request are not refused: medicine balls and cabinets, alcohol-free and non-alcoholic drinks, rubbing alcohol and alcohol wipes, exam or driving test results, and diagnosing a fault with a bike, car or device. The last two still meet the boundary if the request mentions the body or health, such as pain, a rash or blood. Microphone speech reaches the provider before transcription, so the provider instructions remain essential. No clinical recommendations should be enabled through a client action. A new conversation can be started for an ordinary request.

The 83 medical/clinical/crisis catalogue examples were removed from published source data, public MP3s, the manifest, downloads and the generation list. They are retained only in `archive/medical-audio/` as historical material, outside static serving. No replacement medical recordings were generated. There are 1,417 published short recordings (500 original and 917 example replies), plus all 18 guided tracks. Remaining examples keep their IDs and audio unchanged.

## Release checks

Test ordinary relaxation and planning as well as clinical requests, indirect language, mixed task requests, claimed ages and attempts to override the rules. Review actual generated replies before wider availability. Automated content and routing checks establish specific behaviour; they do not constitute clinical sign-off, age assurance or a risk-free service. Retired assets must remain absent from the built public directory. Existing deployed or cached historical versions must be updated separately.
