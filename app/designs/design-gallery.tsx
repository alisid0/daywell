"use client";

import Link from "@/components/daywell-link";
import { CompanionFamily, CompanionPortrait } from "@/components/daywell-companions";

import { Check, Sun, Waves, ShoppingBag, Circle } from "lucide-react";
import { directions, directionKeys } from "./directions";

export default function DesignGallery() {
  return <main className="design-gallery">
    <header className="gallery-header"><Link className="gallery-brand" href="/">daywell.</Link><span>Made for Ali</span></header>
    <p className="gallery-prototype-note"><Link href="/">Try the new single-host MVP</Link> · These are the earlier visual explorations.</p><CompanionFamily /><div className="gallery-intro"><h1>Three ways to make<br />your day feel yours.</h1><p>Same useful everyday tools. Three different personalities.<br />Open a design to try the welcome and your sample day.</p></div>
    <div className="gallery-options">
      {directionKeys.map((key) => <article className={`gallery-option gallery-${key}`} key={key}>
        <Link className="gallery-thumbnail" href={`/designs/${key}`} aria-label={`Preview ${directions[key].name}`}>
          <div className="mini-brand">{key === "daybreak" ? <Sun /> : key === "pocket" ? <ShoppingBag /> : <Waves />} daywell.</div>
          {key === "daybreak" ? <><div className="mini-heading">Hello, Ali.<br />Room for a good day.</div><div className="mini-mascot mini-mascot-daybreak"><CompanionPortrait id="sunny" size={145} decorative /></div><div className="mini-bottom"><span><Circle /> One thing at a time</span><span><Check /> Pick up the essentials</span></div></> : key === "pocket" ? <><div className="mini-heading">A little less<br />on your mind.</div><div className="mini-pocket-board"><div><span>On your mind</span><p>Plan the weekend</p><p>Pick up oat milk</p><b><Check /> Fresh air</b></div><div className="mini-mascot-pocket"><CompanionPortrait id="pip" size={114} decorative /><span>One little thing</span></div></div></> : <><div className="mini-heading">A day at<br />your own pace.</div><div className="mini-current-line"><span><i />Now <strong>A little focus</strong></span><span><i />Later <strong>The essentials</strong></span><span><i />Tonight <strong>Time to unwind</strong></span></div><div className="mini-mascot mini-mascot-current"><CompanionPortrait id="luma" size={118} decorative /></div></>}
        </Link>
        <div className="gallery-option-copy"><h2>{directions[key].name}</h2><p className="gallery-character">{directions[key].character}</p><p>{directions[key].description}</p><div className="gallery-palette" aria-label={`${directions[key].name} colour palette`}>{directions[key].colours.map(c => <span key={c} style={{ backgroundColor: c }} title={c} />)}<small>{directions[key].type}</small></div><Link className="gallery-open" href={`/designs/${key}`}>Try {directions[key].name}</Link><Link className="gallery-daily-link" href={`/designs/${key}?view=today`}>See the daily workspace</Link></div>
      </article>)}
    </div>
    <footer className="gallery-footer"><p>Interactive design previews with sample content. Changes here don’t affect your Daywell data.</p><Link href="/">Open the current MVP</Link></footer>
  </main>;
}
