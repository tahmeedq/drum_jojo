/* ============================================================
   "Mukti" (Feringhees) — drum part v6, 75 BPM, 4/4, 91 bars.
   Written 2026-10-22 against the GarageBand scratch stems and the
   live vocal aligned to the 75 BPM grid, so fills sit in the
   singer's rests. Bar 1-2 count-in; sections are 8-bar blocks from 3:
     3-10 intro (crash-8ths groove modelled on the "Sugar, We're Goin
     Down" intro; the only place with three 16th kicks in a row)
     11-18 verse 1 (cross-stick "beat + a" motif, kick on 1 and 3)
     19-26 chorus (half-time, snare on 3; two-beat stop on 26)
     27-34 groove C (backbeat lift, 16th hats)   35-42 violin solo build
     43-50 verse 2   51-58 chorus 2   59-66 groove C   67-74 bridge
     (motif on the floor tom)   75-82 final chorus   83-90 outro on ride
   Fills are hand-hand-foot-foot cells and 8th-note tom walks: never
   more than two kicks in a row outside the intro. Same part as
   Mukti_Drums_v6.mid in the GarageBand folder.
   ============================================================ */

const P = (parts) =>
  parts.map((pt) => ({
    ...pt,
    pattern: { meter: "4/4", sub: 4, beats: 4, bars: 1, ...pt.pattern },
  }));

export const MUKTI = {
  name: "Mukti",
  bpm: 75,
  desc: "Feringhees — drum part v6. Crash-8ths intro, cross-stick verse, half-time anthem choruses with two-beat stops, a building violin-solo section, floor-tom bridge and ride outro. Fills are written into the singer's rests.",
  parts: P([
    { label: "Count-in 1", bars: 1, pattern: { name: "Count-in 1", tracks: { hat: "................" } } },
    { label: "Count-in 2", bars: 1, pattern: { name: "Count-in 2", tracks: { hat: "................" } } },
    { label: "Intro (bass) 3", bars: 1, pattern: { name: "Intro (bass) 3", tracks: { hat: "..o...o...o...o.", floor: "x.......x.......", kick: "Xx.x...xXx.x...x" } } },
    { label: "Intro (bass) 4", bars: 1, pattern: { name: "Intro (bass) 4", tracks: { tom1: "..............XX", snare: "....oo......o...", floor: "x.......x.....XX", kick: "Xx.x...xXx.x.x.x" } } },
    { label: "Intro 5", bars: 1, pattern: { name: "Intro 5", tracks: { crash: "X.x.x.x.X.x.x.x.", snare: "....Xx......X.x.", floor: "............x.x.", kick: "Xx.x...xXx.x.x.x" } } },
    { label: "Intro 6", bars: 1, pattern: { name: "Intro 6", tracks: { crash: "X.x.x.x.X.x.x.x.", snare: "....Xx......Xx..", kick: "Xx.x...xXx.x...x" } } },
    { label: "Intro 7", bars: 1, pattern: { name: "Intro 7", tracks: { crash: "X.x.x.x.X.x...X.", openhat: "............X...", snare: "....Xx......X...", kick: "Xx.x...xXx.x.xxx" } } },
    { label: "Intro 8", bars: 1, pattern: { name: "Intro 8", tracks: { crash: "X.x.x.x.X.x.x.x.", snare: "....Xx......Xx..", kick: "Xx.x...xXx.x...x" } } },
    { label: "Intro 9", bars: 1, pattern: { name: "Intro 9", tracks: { crash: "X.x.x.x.X.x.x.x.", snare: "....Xx......X.x.", floor: "............x.x.", kick: "Xx.x...xXx.x.x.x" } } },
    { label: "Intro 10", bars: 1, pattern: { name: "Intro 10", tracks: { crash: "X.....x.........", hat: "..x.x...x.x.....", tom1: "..............XX", snare: "...x..x..x..X...", floor: "..............XX", kick: "x.x..x..x..x.x.." }, orn: "............f..." } },
    { label: "Verse 1 · 11", bars: 1, pattern: { name: "Verse 1 · 11", tracks: { crash: "x...............", hat: "..o...o...o...o.", rim: "x..oX..ox..oX..o", kick: "X......xX......." } } },
    { label: "Verse 1 · 12", bars: 1, pattern: { name: "Verse 1 · 12", tracks: { hat: "..o...o.........", snare: "............XX..", rim: "x..oX..ox.......", kick: "X......xX.....xx" }, orn: "............f..." } },
    { label: "Verse 1 · 13", bars: 1, pattern: { name: "Verse 1 · 13", tracks: { hat: "..o...o...o...o.", rim: "x..oX..ox..oX..o", kick: "X......xX......." } } },
    { label: "Verse 1 · 14", bars: 1, pattern: { name: "Verse 1 · 14", tracks: { hat: "..o...o.........", snare: "............XX..", rim: "x..oX..ox.......", kick: "X......xX.....xx" }, orn: "............f..." } },
    { label: "Verse 1 · 15", bars: 1, pattern: { name: "Verse 1 · 15", tracks: { hat: "..o...o...o...o.", rim: "x..oX..ox..oX..o", kick: "X......xX......." } } },
    { label: "Verse 1 · 16", bars: 1, pattern: { name: "Verse 1 · 16", tracks: { hat: "..o...o...o.....", tom2: "............x...", rim: "x..oX..ox..o....", floor: "..............X.", kick: "X......xX...x..." } } },
    { label: "Verse 1 · 17", bars: 1, pattern: { name: "Verse 1 · 17", tracks: { hat: "..o...o...o...o.", rim: "x..oX..ox..oX..o", kick: "X......xX......." } } },
    { label: "Verse 1 · 18", bars: 1, pattern: { name: "Verse 1 · 18", tracks: { hat: "..o...o...o.....", snare: "............XX..", rim: "x..oX..ox..o....", kick: "X......xX.....xx" } } },
    { label: "Chorus 1 · 19", bars: 1, pattern: { name: "Chorus 1 · 19", tracks: { crash: "X...............", openhat: "......x.........", hat: "X.x.X.x.X.x.X.x.", snare: "........X.......", kick: "X.....x.......x." } } },
    { label: "Chorus 1 · 20", bars: 1, pattern: { name: "Chorus 1 · 20", tracks: { openhat: "......x.........", hat: "X.x.X.x.X.x.X.x.", snare: "........X.......", kick: "X.....x.......x." } } },
    { label: "Chorus 1 · 21", bars: 1, pattern: { name: "Chorus 1 · 21", tracks: { openhat: "......x.......x.", hat: "X.x.X.x.X.x.X.x.", snare: "........X.......", kick: "X.....x.......x." } } },
    { label: "Chorus 1 · 22", bars: 1, pattern: { name: "Chorus 1 · 22", tracks: { hat: "X.x.X.........x.", snare: "........XX......", kick: "X.........xx..x." }, orn: "........f......." } },
    { label: "Chorus 1 · 23", bars: 1, pattern: { name: "Chorus 1 · 23", tracks: { crash: "X...............", openhat: "......x.........", hat: "X.x.X.x.X.x.X.x.", snare: "........X.......", kick: "X.....x.......x." } } },
    { label: "Chorus 1 · 24", bars: 1, pattern: { name: "Chorus 1 · 24", tracks: { openhat: "......x.........", hat: "X.x.X.x.X.x.X.x.", snare: "........X.......", kick: "X.....x.......x." } } },
    { label: "Chorus 1 · 25", bars: 1, pattern: { name: "Chorus 1 · 25", tracks: { openhat: "......x.......x.", hat: "X.x.X.x.X.x.X.x.", snare: "........X.......", kick: "X.....x.......x." } } },
    { label: "Stop 26", bars: 1, pattern: { name: "Stop 26", tracks: { crash: "X...............", snare: "....XX..........", kick: "X.....xx........" }, orn: "....f..........." } },
    { label: "Groove C · 27", bars: 1, pattern: { name: "Groove C · 27", tracks: { crash: "X...............", hat: "XoxoXoxoXoxoXoxo", snare: "....X.......X..o", kick: "X......x..x....." } } },
    { label: "Groove C · 28", bars: 1, pattern: { name: "Groove C · 28", tracks: { hat: "XoxoXoxo....Xoxo", snare: "....X...XX..X..o", kick: "X......x..xx...." }, orn: "........f......." } },
    { label: "Groove C · 29", bars: 1, pattern: { name: "Groove C · 29", tracks: { hat: "XoxoXoxoXoxoXoxo", snare: "....X.......X..o", kick: "X......x..x....." } } },
    { label: "Groove C · 30", bars: 1, pattern: { name: "Groove C · 30", tracks: { hat: "XoxoXo.....oXoxo", tom2: ".......x........", snare: "....X.x.....X..o", kick: "X.........x....." } } },
    { label: "Groove C · 31", bars: 1, pattern: { name: "Groove C · 31", tracks: { hat: "XoxoXoxoXoxoXoxo", snare: "....X.......X..o", kick: "X......x..x....." } } },
    { label: "Groove C · 32", bars: 1, pattern: { name: "Groove C · 32", tracks: { hat: "XoxoXoxoXoxoXoxo", snare: "....X.......X..o", kick: "X......x..x....." } } },
    { label: "Groove C · 33", bars: 1, pattern: { name: "Groove C · 33", tracks: { hat: "XoxoXoxoXoxoXoxo", snare: "....X.......X..o", kick: "X......x..x....." } } },
    { label: "Groove C · 34", bars: 1, pattern: { name: "Groove C · 34", tracks: { hat: "XoxoXoxo........", tom1: "........x.......", tom2: "..........x.....", snare: "....X...........", floor: "............x.X.", kick: "X......xx...x..." } } },
    { label: "Violin solo · 35", bars: 1, pattern: { name: "Violin solo · 35", tracks: { ride: "X...X...X...X...", rim: "o..oo..oo..oo..o", kick: "X......xX......." } } },
    { label: "Violin solo · 36", bars: 1, pattern: { name: "Violin solo · 36", tracks: { ride: "X...X...X...X...", rim: "o..oo..oo..oo..o", kick: "X......xX......." } } },
    { label: "Violin solo · 37", bars: 1, pattern: { name: "Violin solo · 37", tracks: { crash: "x...............", ride: "X.x.X.x.X.x.X.x.", snare: "....X.......X...", kick: "X......xx......." } } },
    { label: "Violin solo · 38", bars: 1, pattern: { name: "Violin solo · 38", tracks: { ride: "X.x.X.x.X.x.X.x.", snare: "....X.......X...", kick: "X......xx......." } } },
    { label: "Violin solo · 39", bars: 1, pattern: { name: "Violin solo · 39", tracks: { crash: "x...............", ride: "X.x.X.x.X.x.X.x.", snare: "....X......oX...", kick: "X.x....xx.....x." } } },
    { label: "Violin solo · 40", bars: 1, pattern: { name: "Violin solo · 40", tracks: { ride: "X.x.X.x.X.x.X.x.", snare: "....X......oX...", kick: "X.x....xx.....x." } } },
    { label: "Violin solo · 41", bars: 1, pattern: { name: "Violin solo · 41", tracks: { crash: "X...............", openhat: "..............x.", hat: "XoxoXoxoXoxoXoxo", snare: "....X......oX...", kick: "X.x....xx.....x." } } },
    { label: "Violin solo · 42", bars: 1, pattern: { name: "Violin solo · 42", tracks: { hat: "Xoxo............", tom1: "......x.........", tom2: "........x.......", snare: "....x...........", floor: "..........x.x.X.", kick: "X.x.x...x...x..." } } },
    { label: "Verse 2 · 43", bars: 1, pattern: { name: "Verse 2 · 43", tracks: { crash: "X...............", hat: "X.x.X.x.X.x.X.x.", snare: "....X......oX...", kick: "X......xx......." } } },
    { label: "Verse 2 · 44", bars: 1, pattern: { name: "Verse 2 · 44", tracks: { hat: "X.x.X.x.X.....x.", tom2: "...........x....", snare: "....X.....x.....", kick: "X......xx....xx." } } },
    { label: "Verse 2 · 45", bars: 1, pattern: { name: "Verse 2 · 45", tracks: { hat: "X.x.X.x.X.x.X.x.", snare: "....X......oX...", kick: "X......xx......." } } },
    { label: "Verse 2 · 46", bars: 1, pattern: { name: "Verse 2 · 46", tracks: { hat: "X.x.X.x.X.x.....", snare: "....X.......XX..", kick: "X......xx.....xx" }, orn: "............f..." } },
    { label: "Verse 2 · 47", bars: 1, pattern: { name: "Verse 2 · 47", tracks: { hat: "XoxoXoxoXoxoXoxo", snare: "....X......oX...", floor: "X.......X.......", kick: "X......xx.....x." } } },
    { label: "Verse 2 · 48", bars: 1, pattern: { name: "Verse 2 · 48", tracks: { hat: "XoxoXoxoXox...xo", tom2: "............x...", snare: "....X......x....", floor: "X.......X.......", kick: "X......xx....xx." } } },
    { label: "Verse 2 · 49", bars: 1, pattern: { name: "Verse 2 · 49", tracks: { hat: "XoxoXoxoXoxoXoxo", snare: "....X......oX...", floor: "X.......X.......", kick: "X......xx.....x." } } },
    { label: "Verse 2 · 50", bars: 1, pattern: { name: "Verse 2 · 50", tracks: { hat: "XoxoXoxoXoxo....", snare: "....X......oXX..", floor: "X.......X.......", kick: "X......xx.....xx" } } },
    { label: "Chorus 2 · 51", bars: 1, pattern: { name: "Chorus 2 · 51", tracks: { crash: "X...............", openhat: "......x.........", hat: "X.x.X.x.X.x.X.x.", snare: "........X.......", kick: "X.....x.......x." } } },
    { label: "Chorus 2 · 52", bars: 1, pattern: { name: "Chorus 2 · 52", tracks: { openhat: "......x.........", hat: "X.x.X.x.X.x.X.x.", snare: "........X.......", kick: "X.....x.......x." } } },
    { label: "Chorus 2 · 53", bars: 1, pattern: { name: "Chorus 2 · 53", tracks: { openhat: "......x.......x.", hat: "X.x.X.x.X.x.X.x.", snare: "........X.......", kick: "X.....x.......x." } } },
    { label: "Chorus 2 · 54", bars: 1, pattern: { name: "Chorus 2 · 54", tracks: { openhat: "......x.........", hat: "X.x.X.x.......x.", snare: "........XX......", kick: "X.....x...xx..x." }, orn: "........f......." } },
    { label: "Chorus 2 · 55", bars: 1, pattern: { name: "Chorus 2 · 55", tracks: { crash: "X...............", openhat: "......x.........", hat: "X.x.X.x.X.x.X.x.", snare: "........X.......", kick: "X.....x.......x." } } },
    { label: "Chorus 2 · 56", bars: 1, pattern: { name: "Chorus 2 · 56", tracks: { openhat: "......x.........", hat: "X.x.X.x.X.x.X.x.", snare: "........X.......", kick: "X.....x.......x." } } },
    { label: "Chorus 2 · 57", bars: 1, pattern: { name: "Chorus 2 · 57", tracks: { openhat: "......x.......x.", hat: "X.x.X.x.X.x.X.x.", snare: "........X.......", kick: "X.....x.......x." } } },
    { label: "Stop 58", bars: 1, pattern: { name: "Stop 58", tracks: { crash: "X...x...........", snare: "....XX..........", kick: "X.....xx........" }, orn: "....f..........." } },
    { label: "Groove C · 59", bars: 1, pattern: { name: "Groove C · 59", tracks: { crash: "X...............", hat: "XoxoXoxoXoxoXoxo", snare: "....X.......X..o", kick: "X......x..x....." } } },
    { label: "Groove C · 60", bars: 1, pattern: { name: "Groove C · 60", tracks: { hat: "XoxoXoxoXoxoXoxo", snare: "....X.......X..o", kick: "X......x..x....." } } },
    { label: "Groove C · 61", bars: 1, pattern: { name: "Groove C · 61", tracks: { hat: "XoxoXoxoXoxoXoxo", snare: "....X.......X..o", kick: "X......x..x....." } } },
    { label: "Groove C · 62", bars: 1, pattern: { name: "Groove C · 62", tracks: { hat: "XoxoXox....oXoxo", tom2: "........x.......", snare: "....X..x....X..o", kick: "X.........x....." } } },
    { label: "Groove C · 63", bars: 1, pattern: { name: "Groove C · 63", tracks: { hat: "XoxoXoxoXoxoXoxo", snare: "....X.......X..o", kick: "X......x..x....." } } },
    { label: "Groove C · 64", bars: 1, pattern: { name: "Groove C · 64", tracks: { hat: "XoxoXoxoXoxoXoxo", snare: "....X.......X..o", kick: "X......x..x....." } } },
    { label: "Groove C · 65", bars: 1, pattern: { name: "Groove C · 65", tracks: { hat: "XoxoXoxoXoxoXoxo", snare: "....X.......X..o", kick: "X......x..x....." } } },
    { label: "Groove C · 66", bars: 1, pattern: { name: "Groove C · 66", tracks: { hat: "XoxoXoxo........", tom1: "........x.......", tom2: "..........x.....", snare: "....X...........", floor: "............x.X.", kick: "X......xx...x..." } } },
    { label: "Bridge · 67", bars: 1, pattern: { name: "Bridge · 67", tracks: { floor: "X..ox..oX..ox..o", kick: "X......xX......." } } },
    { label: "Bridge · 68", bars: 1, pattern: { name: "Bridge · 68", tracks: { floor: "X..ox..oX..ox..o", kick: "X......xX......." } } },
    { label: "Bridge · 69", bars: 1, pattern: { name: "Bridge · 69", tracks: { tom2: "......x.........", snare: "............X...", floor: "X..ox..oX..ox..o", kick: "X......xX......." } } },
    { label: "Bridge · 70", bars: 1, pattern: { name: "Bridge · 70", tracks: { tom2: "......x.........", snare: "............X...", floor: "X..ox..oX..ox..o", kick: "X......xX......." } } },
    { label: "Bridge · 71", bars: 1, pattern: { name: "Bridge · 71", tracks: { crash: "X...............", ride: "X...X...X...X...", tom2: "......x.........", snare: "....X.......X...", floor: "X..ox..oX..ox..o", kick: "X......xX......." } } },
    { label: "Bridge · 72", bars: 1, pattern: { name: "Bridge · 72", tracks: { ride: "X...X...X...X...", tom2: "......x.........", snare: "....X.......X...", floor: "X..ox..oX..ox..o", kick: "X......xX......." } } },
    { label: "Bridge · 73", bars: 1, pattern: { name: "Bridge · 73", tracks: { ride: "X...X...X...X...", tom2: "......x.........", snare: "....X.......X...", floor: "X..ox..oX..ox..o", kick: "X......xX......." } } },
    { label: "Bridge · 74", bars: 1, pattern: { name: "Bridge · 74", tracks: { crash: "............X...", openhat: "..............x.", tom2: "....xx..........", snare: "xx..............", floor: "........XX..X...", kick: "..xx..xx..xx...." }, orn: "f..............." } },
    { label: "Final chorus · 75", bars: 1, pattern: { name: "Final chorus · 75", tracks: { crash: "X...............", openhat: "......x.........", hat: "X.x.X.x.X.x.X.x.", snare: "...o.o..X....o.o", kick: "X.....x.......x." } } },
    { label: "Final chorus · 76", bars: 1, pattern: { name: "Final chorus · 76", tracks: { openhat: "......x.......x.", hat: "X.x.X.x.X.x.X.x.", snare: "...o.o..X....o.o", kick: "X.....x.......x." } } },
    { label: "Final chorus · 77", bars: 1, pattern: { name: "Final chorus · 77", tracks: { crash: "X...............", openhat: "......x.........", hat: "X.x.X.x.X.x.X.x.", snare: "...o.o..X....o.o", kick: "X.....x.......x." } } },
    { label: "Final chorus · 78", bars: 1, pattern: { name: "Final chorus · 78", tracks: { hat: "X.x.........X.x.", tom2: "........XX......", snare: "...oxx.......o.o", kick: "X.....xx..xx..x." }, orn: "....f..........." } },
    { label: "Final chorus · 79", bars: 1, pattern: { name: "Final chorus · 79", tracks: { crash: "X...............", openhat: "......x.........", hat: "X.x.X.x.X.x.X.x.", snare: "...o.o..X....o.o", kick: "X.....x.......x." } } },
    { label: "Final chorus · 80", bars: 1, pattern: { name: "Final chorus · 80", tracks: { openhat: "......x.......x.", hat: "X.x.X.x.X.x.X.x.", snare: "...o.o..X....o.o", kick: "X.....x.......x." } } },
    { label: "Final chorus · 81", bars: 1, pattern: { name: "Final chorus · 81", tracks: { crash: "X...............", openhat: "......x.........", hat: "X.x.X.x.X.x.X.x.", snare: "...o.o..X....o.o", kick: "X.....x.......x." } } },
    { label: "Stop 82", bars: 1, pattern: { name: "Stop 82", tracks: { crash: "X...x...........", snare: "....XX..........", floor: "....XX..........", kick: "X.....xx........" }, orn: "....f..........." } },
    { label: "Outro · 83", bars: 1, pattern: { name: "Outro · 83", tracks: { crash: "X...............", ride: "X.x.X.x.X.x.X.x.", snare: "....X.......X..o", kick: "X......x..x....." } } },
    { label: "Outro · 84", bars: 1, pattern: { name: "Outro · 84", tracks: { ride: "X.x.X.x.X.x.X.x.", snare: "....X.......X..o", kick: "X......x..x....." } } },
    { label: "Outro · 85", bars: 1, pattern: { name: "Outro · 85", tracks: { crash: "X...............", ride: "X.x.X.x.X.x.X.x.", snare: "....X.......X..o", kick: "X......x..x....." } } },
    { label: "Outro · 86", bars: 1, pattern: { name: "Outro · 86", tracks: { ride: "X.x.X.x.X.x.X.x.", snare: "....X.......X..o", kick: "X......x..x....." } } },
    { label: "Outro · 87", bars: 1, pattern: { name: "Outro · 87", tracks: { crash: "X...............", ride: "X.x.X.x.X.x.X.x.", snare: "....X.......X..o", kick: "X......x..x....." } } },
    { label: "Outro · 88", bars: 1, pattern: { name: "Outro · 88", tracks: { ride: "X.x.X.x.X.x.X.x.", snare: "....X.......X..o", kick: "X......x..x....." } } },
    { label: "Outro · 89", bars: 1, pattern: { name: "Outro · 89", tracks: { crash: "X...............", ride: "X.x.X.x.X.x.X.x.", snare: "....X.......X..o", kick: "X......x..x....." } } },
    { label: "Outro · 90", bars: 1, pattern: { name: "Outro · 90", tracks: { ride: "X.x.X.x.........", tom1: "..........x.....", tom2: "............x...", snare: "....X...x.......", floor: "..............X.", kick: "X......xx...x..." } } },
    { label: "End hit 91", bars: 1, pattern: { name: "End hit 91", tracks: { crash: "X...............", floor: "X...............", kick: "X..............." } } },
  ]),
};
