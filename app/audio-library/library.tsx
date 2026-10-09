"use client";
import { useMemo, useState } from 'react';
import Link from '@/components/daywell-link';
import { ArrowLeft, ArrowRight, Headphones, Play, Search, Square } from 'lucide-react';
import { CompanionPortrait } from '@/components/daywell-companions';
import { audioCategories, audioGroups, audioResponses, searchAudioResponses, type AudioCategory, type AudioResponse } from '@/lib/audio-library';
import { useDaywellStyle } from '../design-switcher';
import { useLibraryAudio } from '../use-library-audio';
import { guidedSessions } from '@/lib/guided-sessions';

// Action requests and urgent-support examples belong in the labelled catalogue,
// never in a carousel of comforting thoughts.
const listeningGroups = audioGroups.map(group => ({...group, responses: group.responses.filter(item => !item.prompt || item.handling === 'recorded')})).filter(group => group.responses.length);

export default function AudioLibrary() {
  useDaywellStyle();
  const audio = useLibraryAudio();
  const [category, setCategory] = useState<AudioCategory>('relax');
  const [selected, setSelected] = useState<AudioResponse>(audioGroups[0].responses[0]);
  const [query, setQuery] = useState('');
  const groups = listeningGroups.filter(item => item.category === category);
  const group = listeningGroups.find(item => item.id === selected.groupId)!;
  const results = useMemo(() => query.trim() ? searchAudioResponses(query).filter(item => !item.prompt || item.handling === 'recorded').slice(0,30) : [], [query]);
  const variation = group.responses.findIndex(item => item.id === selected.id);
  function choose(entry: AudioResponse) { audio.stop(); setSelected(entry); setCategory(entry.category); }
  function changeCategory(value: AudioCategory) { choose(listeningGroups.find(item => item.category === value)!.responses[0]); setQuery(''); }
  const playing = audio.activeId === selected.id && audio.status !== 'idle';
  const ready = audio.ready(selected);
  const recorded = audioResponses.filter(audio.ready).length;
  return <main className="audio-library">
    <header className="audio-library-top"><Link href="/" onClick={audio.stop}><ArrowLeft size={17} />Back to Daywell</Link><span><Headphones size={17} />Just listen</span></header>
    <div className="audio-library-intro"><h1>A little comfort,<br />already here.</h1><p>Choose a moment. Press play. Nothing you need to say.</p></div>
    <section className="guided-invitation" aria-labelledby="guided-invitation-title"><div><h2 id="guided-invitation-title">Stay for a little longer</h2><p>Gentle breathing and meditation, with room for quiet.</p></div><nav className="guided-links" aria-label="Breathing and meditation">{guidedSessions.map(session=><Link key={session.id} href={`/meditate?session=${session.id}`} onClick={audio.stop}>{session.title}<small>{session.seconds/60} min</small></Link>)}</nav></section>
    <nav className="audio-categories" aria-label="Choose the kind of moment">{audioCategories.map(item => <button key={item.id} aria-pressed={category === item.id} onClick={() => changeCategory(item.id)}>{item.label}</button>)}</nav>
    <section className="audio-listening-space" aria-labelledby="audio-moment-title">
      <div className="audio-mascot-cove"><CompanionPortrait id={selected.companion} size={240} decorative eager /><span aria-hidden="true" /></div>
      <div className="audio-moment"><h2 id="audio-moment-title">{selected.title}</h2>{selected.prompt && <p className="audio-example-prompt">“{selected.prompt}”</p>}<p className="audio-transcript" aria-live="polite">{selected.text}</p>
        <div className="audio-play-controls"><button className="audio-play" disabled={!ready} onClick={() => playing ? audio.stop() : void audio.play(selected)}>{playing ? <Square size={19} /> : <Play size={19} />}{playing ? audio.status === 'loading' ? 'Cancel playback' : 'Stop listening' : ready ? 'Listen' : 'Recording not ready'}</button><button className="audio-another" onClick={() => choose(group.responses[(variation+1)%group.responses.length])}>Another thought<ArrowRight size={17} /></button></div>
        <p className="audio-play-note">{ready ? 'A recorded moment. Your microphone stays off.' : 'The words are ready. Recorded audio will appear here when available.'}</p>
        {audio.error && <p className="audio-error" role="alert">{audio.error}</p>}
      </div>
    </section>
    <section className="audio-browse" aria-labelledby="audio-browse-title"><div className="audio-browse-heading"><div><h2 id="audio-browse-title">What would help right now?</h2><p>Little moments to return to, whenever you like.</p></div><label className="audio-search"><Search size={18} /><span className="sr-only">Find a moment</span><input type="search" placeholder="Find a moment…" value={query} onChange={event => setQuery(event.target.value)} /></label></div>
      {query.trim() ? <div className="audio-search-results"><p role="status">{results.length ? `${results.length}${results.length===30 ? ' matching moments shown' : ' matching moments'}` : 'No moments found. Try “screen”, “meal”, or “start”.'}</p>{results.map(entry => <button key={entry.id} onClick={() => { choose(entry); setQuery(''); document.getElementById('audio-moment-title')?.scrollIntoView({block:'center',behavior:'instant'}); }}><strong>{entry.title}</strong><span>{entry.text}</span></button>)}</div> : <div className="audio-shelves">{groups.map(item => <button key={item.id} aria-pressed={selected.groupId===item.id} onClick={() => choose(item.responses[0])}><span>{item.title}</span><small>{item.responses.length} little thoughts</small><ArrowRight size={18} aria-hidden="true" /></button>)}</div>}
    </section>
    <footer className="audio-library-footer"><p>{audioResponses.length.toLocaleString('en-GB')} short recordings across {audioGroups.length} situations. {recorded.toLocaleString('en-GB')} recordings ready.</p><p><Link href="/response-bank" onClick={audio.stop}>Explore everyday questions and replies</Link></p><p>For something you would like to talk through, <Link href="/" onClick={audio.stop}>return to your Daywell host</Link>.</p></footer>
  </main>;
}
