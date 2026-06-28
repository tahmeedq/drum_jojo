import { useEffect, useRef, useState } from "react";
import { S, on } from "../engine/state.js";
import { store } from "../engine/core/store.js";
import { isSamplesReady, kitInfo } from "../engine/audio/voices.js";
import { KITS } from "../engine/data/kits.js";
import { selectSection, setKit as applyKit } from "../engine/controller.js";
import { useRenderOn } from "../hooks/useBus.js";

const SECTIONS = [
  { id: "course", label: "Course" },
  { id: "groove", label: "Grooves" },
  { id: "rudiment", label: "Rudiments" },
  { id: "fill", label: "Fills" },
  { id: "song", label: "Song Mode" },
  { id: "create", label: "Create", accent: true },
];

const fmtTime = (s) => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m`;
  return `${Math.floor(s)}s`;
};

export default function TopBar() {
  useRenderOn(["view", "transport"]);   // refresh nav + practice-time chip
  const [kit, setKit] = useState({ ready: false, label: "Loading kit…" });
  useEffect(() => {
    const off = on("kit", setKit);
    // Catch the case where samples finished decoding before we subscribed.
    if (isSamplesReady()) { const i = kitInfo(); setKit({ ready: i.sampled > 0, label: i.label }); }
    return off;
  }, []);

  const st = store.stats;

  return (
    <header className="topbar">
      <div className="brand">
        <div className="logo">🥁</div>
        <div>
          <h1>Drum <span>Dojo</span></h1>
          <div className="tag">Play like a pro — on your own kit.</div>
        </div>
      </div>

      <nav className="nav">
        {SECTIONS.map(s => (
          <button
            key={s.id}
            className={(S.sec === s.id ? "active " : "") + (s.accent ? "accentnav" : "")}
            onClick={() => selectSection(s.id)}
          >{s.label}</button>
        ))}
      </nav>

      <div className="topstats">
        <div className="stat-chip" title="Daily practice streak">
          <span className="ico">🔥</span>
          <b>{st.streak || 0}</b><small>day{st.streak === 1 ? "" : "s"}</small>
        </div>
        <div className="stat-chip" title="Lifetime practice time">
          <span className="ico">⏱</span>
          <b>{fmtTime(st.totalSeconds || 0)}</b>
        </div>
        <KitPicker kit={kit} />
      </div>
    </header>
  );
}

function KitPicker({ kit }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const curId = kit.kit || store.kit || "acoustic";

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const choose = (id) => { setOpen(false); if (id !== curId) applyKit(id); };

  return (
    <div className="kitpicker" ref={ref}>
      <button className="kitpick" title="Change kit" onClick={() => setOpen(o => !o)}>
        <span className={"dot" + (kit.ready ? " ready" : "")} />
        <span className="kitlabel">{kit.label}</span>
        <span className="caret">▾</span>
      </button>
      {open && (
        <div className="kitmenu">
          <div className="kitmenu-title">Drum kit</div>
          {KITS.map(k => (
            <button key={k.id} className={"kitopt" + (k.id === curId ? " active" : "")} onClick={() => choose(k.id)}>
              <span className="kitopt-name">{k.label}</span>
              <span className="kitopt-char">{k.char}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
