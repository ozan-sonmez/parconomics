
const TAX_RATE=13, VALET_BASE=55;
const pad=n=>String(n).padStart(2,'0');
const localISO=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
const addMin=(d,m)=>{const c=new Date(d); c.setMinutes(c.getMinutes()+m); return c;}
const addDay=(d,k)=>{const c=new Date(d); c.setDate(c.getDate()+k); return c;}
const ymd=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const isWE=d=>[0,6].includes(d.getDay());
function ovm(a,b,c,d){const s=Math.max(a.getTime(),c.getTime()), e=Math.min(b.getTime(),d.getTime()); return Math.max(0, Math.ceil((e-s)/60000));}

// Self Parking with morning grace up to 07:30 on checkout day
function selfTotal(sISO,eISO){
  let s=new Date(sISO), e=new Date(eISO); if(e<=s) e=addMin(e,24*60);
  let total=0, cur=new Date(s.getFullYear(),s.getMonth(),s.getDate());
  while(cur<e){
    const dStart=new Date(cur.getFullYear(),cur.getMonth(),cur.getDate(),7,0,0);
    const dEnd  =new Date(cur.getFullYear(),cur.getMonth(),cur.getDate(),18,0,0);
    const nStart=new Date(cur.getFullYear(),cur.getMonth(),cur.getDate(),18,0,0);
    const nEnd  =new Date(cur.getFullYear(),cur.getMonth(),cur.getDate()+1,7,0,0);

    let dm=ovm(s,e,dStart,dEnd);
    const graceLimit=new Date(dStart.getFullYear(), dStart.getMonth(), dStart.getDate(), 7, 30, 0);
    if(e<=graceLimit && e>dStart){ dm=0; } // fold small morning into night

    if(dm>0){
      const cap=isWE(dStart)?10:32;
      total+=Math.min(Math.ceil(dm/20)*5, cap);
    }
    const nm=ovm(s,e,nStart,nEnd);
    if(nm>0){ total+=Math.min(Math.ceil(nm/20)*5, 10); }

    cur=addDay(cur,1);
  }
  return total;
}

function valetDays(sISO,eISO){
  let s=new Date(sISO), e=new Date(eISO); if(e<=s) e=addMin(e,24*60);
  let cut=new Date(s.getFullYear(),s.getMonth(),s.getDate()+1,18,0,0), d=1; 
  while(e>cut){ d++; cut.setDate(cut.getDate()+1); } return d;
}

const wkAbbr=d=>new Intl.DateTimeFormat('en-US',{weekday:'short'}).format(d);
function nights(sISO,eISO){
  let s=new Date(sISO), e=new Date(eISO); if(e<=s) e=addMin(e,24*60);
  let n=0, mid=new Date(s.getFullYear(),s.getMonth(),s.getDate()+1,0,0,0);
  while(e>mid){ n++; mid.setDate(mid.getDate()+1);} return n;
}

function App(){
  const now=new Date();
  const [start,setStart]=React.useState(localISO(now));
  const [end,setEnd]=React.useState(localISO(now));
  const [calc,setCalc]=React.useState(false);

  const s=new Date(start), e=new Date(end);
  const hrs=Math.max(0, Math.ceil((e-s)/3600000));
  const nts=nights(start,end);

  const self=selfTotal(start,end);
  const valet=valetDays(start,end)*VALET_BASE*(1+TAX_RATE/100);
  const cheaperSelf=self<=valet, diff=Math.abs(self-valet);
  const cards=[{name:'Self Parking',total:self,cheap:cheaperSelf},{name:'Valet Parking',total:valet,cheap:!cheaperSelf}];
  const fmt=n=>`${(n||0).toFixed(2)} CAD`;

  return (
    <div className="container">
      <div className="header"><h1>🚗 Parconomics — by Ozan Sonmez</h1></div>
      <div className="subtitle">Smart comparison between self and valet parking costs.</div>

      <div className="inputs">
        <div className="field">
          <label>Check-in</label>
          <div className="control">
            <input className="input" type="datetime-local" value={start} onChange={e=>{setStart(e.target.value); setCalc(false);}}/>
            <span className="weekday">{wkAbbr(s)}</span>
          </div>
        </div>
        <div className="field">
          <label>Check-out</label>
          <div className="control">
            <input className="input" type="datetime-local" value={end} onChange={e=>{setEnd(e.target.value); setCalc(false);}}/>
            <span className="weekday">{wkAbbr(e)}</span>
          </div>
        </div>
        <div className="meta">
          <div className="pill">{`Duration ≈ ${hrs} h · Nights: ${nts}`}</div>
        </div>
        <div className="calcbar">
          <button className="btn" onClick={()=>setCalc(true)}>Calculate</button>
        </div>
      </div>

      <div className="grid">
        {calc ? cards.map(c=>(
          <div key={c.name} className={`card ${c.cheap?'cheap':'exp'}`}>
            <div className="card-head">
              <strong>{c.name}</strong>
              <span className="badge">{c.cheap?'Cheaper':'More Expensive'}</span>
            </div>
            <div className="price">{fmt(c.total)}</div>
            <div className="diff">{c.cheap?`Cheaper by ${fmt(diff)}`:`More expensive by ${fmt(diff)}`}</div>
          </div>
        )) : <div className="placeholder">Choose dates & tap Calculate to see prices.</div>}
      </div>

      <div className="footer">© 2025 Ozan Sonmez · Parconomics™</div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
