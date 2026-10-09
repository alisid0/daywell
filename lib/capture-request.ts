import { UserFacingError } from './request-guards.ts';
import { planRequestSchema } from './food-journey.ts';

export function captureInput(form: FormData) {
  const date = String(form.get('date') || '');
  const mode = String(form.get('mode') || 'auto');
  const text = String(form.get('text') || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !['auto','meal','basket','grocery','plan'].includes(mode)) throw new UserFacingError('Please refresh and try again.');
  if (text.length > 6000) throw new UserFacingError('Please use a shorter description.');
  const image = form.get('image'), audio = form.get('audio');
  if (image !== null && (!(image instanceof File) || !image.size || image.size > 5*1024*1024 || !/^image\/(jpeg|png|webp)$/.test(image.type))) throw new UserFacingError('Choose a JPEG, PNG or WebP image under 5 MB.');
  if (audio !== null && (!(audio instanceof File) || !audio.size || audio.size > 8*1024*1024 || !/^audio\/(webm|mp4|mpeg|wav|x-wav|ogg)(?:;.*)?$/.test(audio.type))) throw new UserFacingError('Use a short WebM, MP4, MP3 or WAV recording.');
  if (!text && !image && !audio) throw new UserFacingError('Add a photo or say something first.');
  const planning = mode === 'plan';
  const planOptions = planning ? planRequestSchema.parse({ start: String(form.get('planStart') || date), count: Number(form.get('planCount') || 2), meal: String(form.get('planMeal') || 'Dinner') }) : null;
  return { date, mode, text, image: image as File | null, audio: audio as File | null, planning, planOptions };
}
