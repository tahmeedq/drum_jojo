import { S } from "../engine/state.js";
import { LIB, SONGS, COURSE, SECTION_TITLES } from "../engine/data/index.js";
import { store, lessonKey, saveStore } from "../engine/core/store.js";
import { selectLesson, selectSong, selectPattern, newCustom, loadCustom, newCustomSong, loadCustomSong } from "../engine/controller.js";
import { useRenderOn } from "../hooks/useBus.js";

const Stars = ({ n }) => <span className="stars">{"★".repeat(n || 1)}</span>;

export default function Sidebar() {
  useRenderOn(["view"]);
  const sec = S.sec;
  const title = sec === "create" ? "Create" : (SECTION_TITLES[sec] || "Library");

  return (
    <aside className="sidebar">
      <div className="lib-title">{title}</div>
      <div className="lib">
        {sec === "course" && <Course />}
        {sec === "song" && <Songs />}
        {sec === "create" && <Create />}
        {(sec === "groove" || sec === "rudiment" || sec === "fill") && <Patterns sec={sec} />}
      </div>
    </aside>
  );
}

function Course() {
  return COURSE.map((lvl, li) => (
    <div key={li}>
      <div className="lvlhdr"><b>{lvl.level}</b><div className="bar" /></div>
      {lvl.lessons.map((les, ii) => {
        const active = S.activeLesson && S.activeLesson.l === li && S.activeLesson.i === ii;
        const done = store.done[lessonKey(li, ii)];
        return (
          <button key={ii} className={"item" + (active ? " active" : "")} onClick={() => selectLesson(li, ii)}>
            <span><span className="num">{ii + 1}.</span> {les.title}
              <span className="meta">target {les.target} bpm</span></span>
            {done ? <span className="check">✓</span> : null}
          </button>
        );
      })}
    </div>
  ));
}

function Songs() {
  return SONGS.map((s, i) => (
    <button key={i} className={"item" + (S.itemKey === `song:${s.name}` ? " active" : "")} onClick={() => selectSong(s)}>
      <span>{s.name}<span className="meta">{s.parts.length} sections · {s.bpm} bpm</span></span>
    </button>
  ));
}

function Patterns({ sec }) {
  let lastFam = null;
  const out = [];
  LIB[sec].forEach((p, i) => {
    const fam = p.style || p.fam;
    if (fam && fam !== lastFam) { out.push(<div key={"f" + i} className="famhdr">{fam}</div>); lastFam = fam; }
    const active = S.itemKey === `${sec}:${p.name}`;
    out.push(
      <button key={i} className={"item" + (active ? " active" : "")} onClick={() => selectPattern(p)}>
        <span>{p.name}<span className="meta">{p.meter} · {p.bpm} bpm</span></span>
        <Stars n={p.diff} />
      </button>
    );
  });
  return out;
}

function Create() {
  useRenderOn(["view"]);
  const delPat = (e, i) => {
    e.stopPropagation();
    store.custom.splice(i, 1); saveStore();
    if (store.custom.length) loadCustom(store.custom[0]); else newCustom();
  };
  const delSong = (e, i) => {
    e.stopPropagation();
    store.customSongs.splice(i, 1); saveStore();
    if (store.customSongs.length) loadCustomSong(store.customSongs[0]); else newCustomSong();
  };
  return (
    <>
      <div className="famhdr">My Songs</div>
      <button className="item newbtn" onClick={newCustomSong}><span>＋ New song</span></button>
      {store.customSongs.length === 0 && <div className="empty">No songs yet. Chain sections into an arrangement.</div>}
      {store.customSongs.map((s, i) => {
        const active = S.itemKey === `csong:${s._id}`;
        return (
          <button key={s._id} className={"item" + (active ? " active" : "")} onClick={() => loadCustomSong(s)}>
            <span>{s.name}<span className="meta">{s.parts.length} section{s.parts.length > 1 ? "s" : ""} · {s.bpm} bpm</span></span>
            <span className="del" title="Delete" onClick={(e) => delSong(e, i)}>✕</span>
          </button>
        );
      })}

      <div className="famhdr">My Patterns</div>
      <button className="item newbtn" onClick={newCustom}><span>＋ New pattern</span></button>
      {store.custom.length === 0 && <div className="empty">No saved patterns yet. Build one in the grid and hit Save.</div>}
      {store.custom.map((p, i) => {
        const active = S.itemKey === `custom:${p._id}`;
        return (
          <button key={p._id || i} className={"item" + (active ? " active" : "")} onClick={() => loadCustom(p)}>
            <span>{p.name}<span className="meta">{p.meter} · {p.bpm} bpm</span></span>
            <span className="del" title="Delete" onClick={(e) => delPat(e, i)}>✕</span>
          </button>
        );
      })}
    </>
  );
}
