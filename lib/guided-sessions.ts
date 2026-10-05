export type GuidedSegment = { at: number; text: string; delivery: string };
export type GuidedSession = { id: string; title: string; description: string; seconds: number; category: 'relax' | 'sleep'; segments: GuidedSegment[] };
const soft = '[Soft, warm voice] [slow, unhurried delivery]';
const sleepy = '[Soft, low voice] [gentle, unhurried delivery]';

export const guidedSessions: GuidedSession[] = [
  {
    id: 'easy-breath', title: 'An easy breath', description: 'A gentle breathing practice, at your own pace.', seconds: 120, category: 'relax',
    segments: [
      { at: 0, delivery: soft, text: 'Find a comfortable seat, with a little support for your back. Let your hands rest. You can keep your eyes open. For these two minutes, there is nothing else you need to finish.' },
      { at: 25, delivery: soft, text: 'Notice a breath coming in, and then leaving. If comfortable, breathe gently through your nose and let it flow out through your mouth. Keep each breath easy. There is no need to fill your lungs.' },
      { at: 52, delivery: soft, text: 'Follow another breath in your own time. Let it come in, and flow out, without holding it. You do not need to match the pace of my voice. We will leave a little quiet here.' },
      { at: 80, delivery: soft, text: 'Let a few more comfortable breaths come and go. If you feel dizzy or uncomfortable, stop the exercise and breathe normally. You can also leave your breathing alone and notice the chair beneath you.' },
      { at: 104, delivery: soft, text: 'Let your breathing carry on by itself. Notice the room again. You can stay quietly, or return to your day when you are ready.' },
    ],
  },
  {
    id: 'leave-the-feed', title: 'Leave the feed behind', description: 'A little distance from scrolling. Space to simply be.', seconds: 180, category: 'relax',
    segments: [
      { at: 0, delivery: soft, text: 'You can leave the feed unfinished. Settle somewhere comfortable. This recording has quiet spaces, so you can turn away from the screen. Let the next post wait outside this little corner.' },
      { at: 28, delivery: soft, text: 'Look around slowly. Find one ordinary thing to rest your eyes on. A colour, the edge of a window, or a patch of light. There is no special thing you need to find.' },
      { at: 59, delivery: soft, text: 'Notice where your body is supported. You can adjust your position, move your feet, or settle a cushion. Let comfort be enough for this moment.' },
      { at: 89, delivery: soft, text: 'Listen for a sound in the room. Near or far, quiet or clear. Let it come to you. You do not have to push any other sounds away.' },
      { at: 117, delivery: soft, text: 'If your attention returns to the feed, you have not done anything wrong. Notice that thought, then return to one colour or sound around you. We can leave some more quiet now.' },
      { at: 157, delivery: soft, text: 'There is no lost time to make up for here. Choose what would feel useful next. A little more rest, a drink, or one ordinary thing away from the screen. Take your time.' },
    ],
  },
  {
    id: 'softer-goodnight', title: 'A softer goodnight', description: 'Five quiet minutes to put the day down.', seconds: 300, category: 'sleep',
    segments: [
      { at: 0, delivery: sleepy, text: 'Let this be a softer end to the day. Find a position that feels comfortable, and adjust anything you need. Your eyes can close, or stay gently open. You do not have to make sleep happen.' },
      { at: 35, delivery: sleepy, text: 'Notice the support beneath you. The bed, the pillow, or the chair. Let them take a little of the effort. You can move whenever you need to.' },
      { at: 72, delivery: sleepy, text: 'Bring a little attention to your face. If comfortable, let your jaw find an easy resting place. Let your shoulders settle. Nothing to stretch, and nothing to force.' },
      { at: 111, delivery: sleepy, text: 'Notice your hands, wherever they are resting. They do not need to hold anything right now. Let the arms be comfortable too. We will stay quiet for a little while.' },
      { at: 153, delivery: sleepy, text: 'Your breathing can happen in the background. You do not need to count or change it. If following the breath is not helpful, return to the feeling of the bedding around you.' },
      { at: 196, delivery: sleepy, text: 'If something from today returns to mind, you can notice it without finishing the story. There is no need to argue with the thought. Let your attention find the support beneath you again.' },
      { at: 244, delivery: sleepy, text: 'There is nothing to report, and no score for how restful this feels. You can simply lie here. After these last words, the recording will end quietly. Let the rest of the night unfold in its own time.' },
    ],
  },
];

export function sessionTranscript(session: GuidedSession) { return session.segments.map(segment => segment.text).join('\n\n'); }
export type GuidedRecording = { src: string; transcript: string; seconds: number; bytes: number; model: string; segments: { at: number; end: number }[] };
export type GuidedManifest = { version: 1; recordings: Record<string, GuidedRecording> };
export function guidedRecordingFor(session: GuidedSession, manifest: GuidedManifest | null): GuidedRecording | undefined {
  const recording = manifest?.recordings?.[session.id];
  if (!recording || recording.transcript !== sessionTranscript(session) || !/^\/guided-audio\/[a-z0-9-]+\.mp3$/.test(recording.src) || recording.bytes < 1000 || Math.abs(recording.seconds - session.seconds) > .2 || !Array.isArray(recording.segments) || recording.segments.length !== session.segments.length) return undefined;
  return recording.segments.every((part,index) => part.at === session.segments[index].at && Number.isFinite(part.end) && part.end > part.at && part.end <= (session.segments[index+1]?.at ?? session.seconds)) ? recording : undefined;
}
export function guidedMoment(session: GuidedSession, seconds: number) {
  const time = Number.isFinite(seconds) ? Math.max(0, Math.min(seconds,session.seconds)) : 0;
  let index = 0;
  while (index + 1 < session.segments.length && session.segments[index+1].at <= time) index++;
  return { index, segment:session.segments[index], complete:time >= session.seconds };
}
