"use client";
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, Play, Search, Square } from 'lucide-react';
import { audioCategories, audioResponses, searchAudioResponses, type AudioCategory, type AudioHandling } from '@/lib/audio-library';
import { useDaywellStyle } from '../design-switcher';
import { useLibraryAudio } from '../use-library-audio';

const labels: Record<AudioHandling,string> = { recorded:'A little guidance', tool:'Needs an app action', live:'Needs a conversation or further support', urgent:'Urgent support' };
const examples = audioResponses.filter(entry => entry.prompt);
export default function ResponseBank() {
  useDaywellStyle();
  const audio = useLibraryAudio();
  const [query,setQuery] = useState(''), [category,setCategory] = useState<AudioCategory | ''>(''), [page,setPage] = useState(0);
  const results = useMemo(() => searchAudioResponses(query,category || undefined).filter(entry => entry.prompt), [query,category]);
  const pages = Math.max(1,Math.ceil(results.length/40));
  const visible = results.slice(page*40,(page+1)*40);
  return <main className="audio-library response-bank">
    <header className="audio-library-top"><Link href="/audio-library" onClick={audio.stop}><ArrowLeft size={17}/>Back to Just listen</Link><span>A library to explore</span></header>
    <div className="audio-library-intro"><h1>In your own words.</h1><p>{examples.length.toLocaleString('en-GB')} things someone might say to Daywell, with a prepared reply for each.</p></div>
    <p className="response-bank-note">These are examples you can listen to. Playing a reply does not set an alarm, save a task, or read your personal history. Requests that need an action or further support are labelled.</p>
    <div className="response-bank-filters">
      <label className="audio-search"><Search size={18}/><span className="sr-only">Search questions and replies</span><input type="search" placeholder="Try “long journey” or “dinner”…" value={query} onChange={event=>{audio.stop();setQuery(event.target.value);setPage(0);}}/></label>
      <label><span className="sr-only">Filter by area</span><select aria-label="Filter by area" value={category} onChange={event=>{audio.stop();setCategory(event.target.value as AudioCategory | '');setPage(0);}}><option value="">Every area</option>{audioCategories.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
      <a href="/audio-library/response-catalogue.json" download="daywell-1500-responses.json"><Download size={16}/>Download all 1,500 scripts</a>
    </div>
    <p className="response-bank-count" role="status">{results.length ? `${results.length.toLocaleString('en-GB')} examples · showing ${page*40+1}–${Math.min((page+1)*40,results.length)}` : 'No examples found. Try another phrase or area.'}</p>
    {audio.error && <p className="audio-error" role="alert">{audio.error}</p>}
    <div className="response-bank-list">{visible.map(entry=>{
      const active = audio.activeId===entry.id && audio.status!=='idle';
      return <article key={entry.id}>
        <div className="response-bank-meta"><span>{audioCategories.find(item=>item.id===entry.category)?.label} · {entry.title}</span><span data-handling={entry.handling}>{labels[entry.handling ?? 'recorded']}</span></div>
        <h2>“{entry.prompt}”</h2><p>{entry.text}</p>
        <button disabled={!audio.ready(entry)} aria-label={`${active ? 'Stop' : 'Listen to'} reply: ${entry.prompt}`} onClick={()=>active ? audio.stop() : void audio.play(entry)}>{active ? <Square size={15}/> : <Play size={15}/>} {active ? audio.status==='loading' ? 'Cancel' : 'Stop' : audio.ready(entry) ? 'Listen to reply' : 'Recording not ready'}</button>
      </article>;
    })}</div>
    <nav className="response-bank-pagination" aria-label="Question pages"><button disabled={page===0} onClick={()=>{audio.stop();setPage(page-1);document.querySelector('.response-bank-count')?.scrollIntoView({block:'start',behavior:'instant'});}}>Previous</button><span>Page {page+1} of {pages}</span><button disabled={page+1>=pages} onClick={()=>{audio.stop();setPage(page+1);document.querySelector('.response-bank-count')?.scrollIntoView({block:'start',behavior:'instant'});}}>Next</button></nav>
    <footer className="audio-library-footer"><p>A starting collection, not every possible conversation. Prepared audio is available here; live voice still uses the connected voice service.</p></footer>
  </main>;
}
