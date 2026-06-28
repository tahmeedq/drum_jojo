import { useState } from "react";
import { S, emit } from "../engine/state.js";
import { setSongPart } from "../engine/core/scheduler.js";
import { useBus, useRenderOn } from "../hooks/useBus.js";

export default function SongTimeline() {
  useRenderOn(["view"]);
  const [now, setNow] = useState(0);
  useBus("partChanged", (d) => setNow(d.idx));
  useBus("transport", (d) => { if (!d.playing) setNow(0); });
  if (!S.song) return null;

  // Jump to a section to preview its notation (or steer playback there live).
  const go = (i) => {
    S.songIdx = i; S.barsPlayed = 0;
    setSongPart(i);
    setNow(i);
    emit("partChanged", { idx: i, live: S.playing });
  };

  return (
    <div className="songstruct">
      {S.song.parts.map((p, i) => (
        <button key={i} className={"chip" + (i === now ? " now" : "")} onClick={() => go(i)}
          title={`Preview ${p.label}`}>
          <b>{p.label}</b>
          <small>{p.bars} bar{p.bars > 1 ? "s" : ""}</small>
        </button>
      ))}
    </div>
  );
}
