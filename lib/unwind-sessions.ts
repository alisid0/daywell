import type { GuidedSession } from './guided-sessions.ts';

const warm = '[warmly] [softly] [slowly]';
const breath = (at: number) => [
  { at, delivery: '[softly] [inhales]', text: 'Gently in...', gesture: 'in' as const },
  { at: at + 5, delivery: '[softly] [exhales]', text: 'And out...', gesture: 'out' as const },
  { at: at + 10, delivery: '[softly] [inhales]', text: 'In, gently...', gesture: 'in' as const },
  { at: at + 15, delivery: '[softly] [exhales]', text: 'Let it go...', gesture: 'out' as const },
];

export const unwindSessions: GuidedSession[] = [
  {
    id: 'scroll-unwind', title: 'Step out of the scroll', description: 'Close the feed. Let the world become a little smaller.', seconds: 180, category: 'relax', voices: true,
    segments: [
      { at: 0, delivery: warm, text: 'There you are. You can leave the feed unfinished. Put the phone somewhere you do not have to hold it, and find a comfortable seat. For a little while, there is nothing new to keep up with.' },
      { at: 28, delivery: warm, text: 'Let your hands rest. Notice the support beneath you. Your eyes can stay open. We will try a few gentle breaths, only if that feels comfortable. You can simply listen instead.' },
      { at: 55, delivery: warm, text: 'There is no breath to hold, and nothing to force. Let the little circle be an invitation, not a target. Follow your own comfortable pace, even if it is different from mine.' },
      ...breath(82),
      { at: 102, delivery: warm, text: 'Now let your breathing look after itself. If the exercise feels uncomfortable, stop and breathe normally. You can notice the chair, or a sound in the room. We will leave some quiet here.' },
      { at: 140, delivery: warm, text: 'The next post is still allowed to wait. You have not fallen behind by stepping away. Notice one thing around you that belongs to your own day.' },
      { at: 163, delivery: warm, text: 'You can stay a little longer, or leave the screen now. No catching up. Just one gentle next moment.' },
    ],
  },
  {
    id: 'home-after-busy-day', title: 'Home, at last', description: 'Put down the busy day. You do not need to carry it through the door.', seconds: 240, category: 'relax', voices: true,
    segments: [
      { at: 0, delivery: warm, text: 'You have made it home. Before the next job, before the messages, let there be a little space. Put your bag down, if you have one. Find somewhere your body can feel supported.' },
      { at: 30, delivery: warm, text: 'You do not need to unpack the whole day in your mind. For now, just arrive. Adjust your clothes, your seat, or the cushion. Let one small thing become more comfortable.' },
      { at: 60, delivery: warm, text: 'If it feels comfortable, let your shoulders find an easier position. Uncurl your hands. There is nothing to prove with this pause, and no particular feeling you have to reach.' },
      { at: 88, delivery: warm, text: 'We can share a few easy breaths. No holding, no forcing. Follow your own pace, or leave your breathing alone and notice the room instead. Either is welcome.' },
      ...breath(115),
      { at: 135, delivery: warm, text: 'Let the breath return to its ordinary rhythm. If anything feels uncomfortable, stop the exercise. Notice the support underneath you. The day can be unfinished while you sit here.' },
      { at: 171, delivery: warm, text: 'Perhaps there is something you have been carrying in your head. You do not have to solve it now. Let the thought be there, and let the room be here too.' },
      { at: 205, delivery: warm, text: 'When you are ready, ask what would feel kind next. Something to eat. A change of clothes. A little more quiet. Only one thing. You are home; let yourself arrive at your own pace.' },
    ],
  },
  {
    id: 'after-long-journey', title: 'Let the journey end', description: 'A soft landing after traffic, crowded trains or a long way home.', seconds: 240, category: 'relax', voices: true,
    segments: [
      { at: 0, delivery: warm, text: 'Only begin when your journey is over and you are somewhere safe to rest. If you are still driving, save this for later. Now, if you have arrived, put down what you have been carrying.' },
      { at: 32, delivery: warm, text: 'You have spent a long time getting here. There may have been noise, waiting, or rushing. You do not need to keep that pace now. Choose a position that takes a little less effort.' },
      { at: 63, delivery: warm, text: 'Notice your hands. Let them rest somewhere comfortable. Notice your feet, or whatever is supporting you. You can move and adjust; this is not a test of keeping still.' },
      { at: 92, delivery: warm, text: 'If you would like, follow a few gentle breaths with me. Keep your own comfortable rhythm. No breath holding, and no need to breathe deeply. You can simply listen to the room instead.' },
      ...breath(122),
      { at: 142, delivery: warm, text: 'Let the breathing carry on by itself. If you feel dizzy or uncomfortable, stop and breathe normally. We will leave a little quiet while you settle into being here.' },
      { at: 176, delivery: warm, text: 'The journey does not need another replay right now. Feel the support beneath you. Perhaps notice a familiar sound, or the light in this room. Let this place have your attention for a moment.' },
      { at: 213, delivery: warm, text: 'There is no rush to make this pause useful. When you are ready, choose a little comfort for the next part of your day. Let the journey end here.' },
    ],
  },
];
