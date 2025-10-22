/** 
 * Parconomics — Smart Parking Price Calculator
 * Designed & developed by Ozan Sonmez (Toronto, Canada)
 * Copyright © 2025
 */
const { useMemo, useState } = React;

const TAX_RATE = 13;
const VALET_BASE = 55;

function pad(n) { return String(n).padStart(2, "0"); }
function ymd(d) { return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
function clone(d) { return new Date(d.getTime()); }
function addMinutes(d, m) { const c = clone(d); c.setMinutes(c.getMinutes()+m); return c; }
function addDays(d, k) { const c = clone(d); c.setDate(c.getDate()+k); return c; }
function isWeekend(d) { const w = d.getDay(); return w === 0 || w === 6; }
function inDayWindow(d) { const h = d.getHours(); const m = d.getMinutes(); const t = h + m/60; return t >= 7 && t < 18; }
function eveningBucketKey(d) { const h = d.getHours(); const base = h < 7 ? addDays(d, -1) : d; return `evening_${ymd(base)}`; }

function calcSelfTotal(startISO, endISO, holidaysSet) {
  let s = new Date(startISO);
  let e = new Date(endISO);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return 0;
  if (e <= s) { e = addMinutes(e, 24*60); }
  const buckets = {};
  let cur = clone(s);
  while (cur < e) {
    const keyDate = ymd(cur);
    const isHol = holidaysSet && holidaysSet.has(keyDate);
    if (inDayWindow(cur)) {
      const weekendOrHoliday = isWeekend(cur) || isHol;
      const cap = weekendOrHoliday ? 10 : 32;
      const key = `day_${keyDate}_${weekendOrHoliday ? "we_or_hol" : "wkday"}`;
      if (!buckets[key]) buckets[key] = { sum: 0, cap };
      buckets[key].sum += 5;
    } else {
      const key = eveningBucketKey(cur);
      if (!buckets[key]) buckets[key] = { sum: 0, cap: 10 };
      buckets[key].sum += 5;
    }
    cur = addMinutes(cur, 20);
  }
  let total = 0;
  for (const k of Object.keys(buckets)) {
    const { sum, cap } = buckets[k];
    total += Math.min(sum, cap);
  }
  return total;
}

function ceilHoursBetweenISO(startISO, endISO) {
  const s = new Date(startISO); const e0 = new Date(endISO);
  let e = e0; if (e <= s) e = addMinutes(e0, 24*60);
  const hours = (e.getTime() - s.getTime()) / (1000*60*60);
  return Math.max(1, Math.ceil(hours));
}

function toLocalDatetimeValue(d) {
  const yyyy = d.getFullYear(); const mm = pad(d.getMonth()+1); const dd = pad(d.getDate());
  const hh = pad(d.getHours()); const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

// New valet rule: first charge covers until NEXT day 18:00. Crossing any subsequent 18:00 adds a day.
function valetDaysByCutoff(startISO, endISO) {
  let s = new Date(startISO);
  let e = new Date(endISO);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return 1;
  if (e <= s) e = addMinutes(e, 24 * 60);
  let cutoff = new Date(s.getFullYear(), s.getMonth(), s.getDate() + 1, 18, 0, 0);
  let days = 1;
  while (e > cutoff) {
    days += 1;
    cutoff.setDate(cutoff.getDate() + 1);
  }
  return days;
}

function App() {
  const now = new Date();
  const defaultStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0);
  const defaultEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0, 0);

  const [startISO, setStartISO] = React.useState(toLocalDatetimeValue(defaultStart));
  const [endISO, setEndISO] = React.useState(toLocalDatetimeValue(defaultEnd));

  const hours = React.useMemo(() => ceilHoursBetweenISO(startISO, endISO), [startISO, endISO]);
  const selfParkingTotal = React.useMemo(() => calcSelfTotal(startISO, endISO), [startISO, endISO]);

  const valetParkingTotal = React.useMemo(() => {
    const days = valetDaysByCutoff(startISO, endISO);
    return days * VALET_BASE * (1 + TAX_RATE / 100);
  }, [startISO, endISO]);

  const items = React.useMemo(() => {
    const list = [
      { name: "Self Parking", total: selfParkingTotal },
      { name: "Valet Parking", total: valetParkingTotal },
    ];
    const min = Math.min(...list.map((x) => x.total));
    return list.map((x) => ({ ...x, cheap: x.total === min }));
  }, [selfParkingTotal, valetParkingTotal]);

  const fmt = (n) => `${(Number(n) || 0).toFixed(2)} CAD`;

  return (
    <div className="container">
      <div className="header">
        <h1>🚗 Parconomics — by Ozan Sonmez</h1>
      </div>
      <div className="subtitle">Smart comparison between self and valet parking costs.</div>

      <div className="inputs">
        <div className="field">
          <label>Check-in</label>
          <input className="input" type="datetime-local" value={startISO} onChange={(e) => setStartISO(e.target.value)} />
        </div>
        <div className="field">
          <label>Check-out</label>
          <input className="input" type="datetime-local" value={endISO} onChange={(e) => setEndISO(e.target.value)} />
        </div>
        <div className="pill">Duration ≈ <b>{hours}</b> hours</div>
      </div>

      <div className="grid">
        {items.map((it) => (
          <div key={it.name} className="card" style={{ borderColor: it.cheap ? "var(--accent)" : "var(--danger)" }}>
            <div className="card-head">
              <strong>{it.name}</strong>
              {it.cheap ? <span className="badge">Cheaper</span> : <span className="badge-danger">More Expensive</span>}
            </div>
            <div className="price">{fmt(it.total)}</div>
          </div>
        ))}
      </div>

      <div className="footer">© 2025 Ozan Sonmez · Parconomics™</div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
