
const TAX_RATE = 13;
const VALET_BASE = 55;

function pad(n) { return String(n).padStart(2, "0"); }
function addMinutes(d, m) { const c = new Date(d); c.setMinutes(c.getMinutes()+m); return c; }
function addDays(d, k) { const c = new Date(d); c.setDate(c.getDate()+k); return c; }
function ymd(d) { return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
function isWeekend(d){ const w=d.getDay(); return w===0||w===6; }
function inDayWindow(d){const h=d.getHours()+d.getMinutes()/60; return h>=7 && h<18;}

function calcSelfTotal(startISO,endISO){
 let s=new Date(startISO), e=new Date(endISO);
 if(e<=s)e=addMinutes(e,24*60);
 const buckets={}; let cur=new Date(s);
 while(cur<e){
   const key=ymd(cur);
   const weekend=isWeekend(cur);
   if(inDayWindow(cur)){
     const cap=weekend?10:32;
     const k=`day_${key}_${weekend?'we':'wd'}`;
     if(!buckets[k])buckets[k]={sum:0,cap};
     buckets[k].sum+=5;
   }else{
     const k=`night_${key}`;
     if(!buckets[k])buckets[k]={sum:0,cap:10};
     buckets[k].sum+=5;
   }
   cur=addMinutes(cur,20);
 }
 let total=0; for(const b in buckets){total+=Math.min(buckets[b].sum,buckets[b].cap);} return total;
}

function valetDaysByCutoff(startISO,endISO){
 let s=new Date(startISO), e=new Date(endISO);
 if(e<=s)e=addMinutes(e,24*60);
 let cutoff=new Date(s.getFullYear(),s.getMonth(),s.getDate()+1,18,0,0);
 let days=1; while(e>cutoff){days++; cutoff.setDate(cutoff.getDate()+1);} return days;
}

function weekdayAbbr(d){
 return new Intl.DateTimeFormat('en-US',{weekday:'short'}).format(d);
}

function nightsBetween(startISO,endISO){
 let s=new Date(startISO), e=new Date(endISO);
 if(e<=s)e=addMinutes(e,24*60);
 let nights=0; let midnight=new Date(s.getFullYear(),s.getMonth(),s.getDate()+1,0,0,0);
 while(e>midnight){nights++; midnight.setDate(midnight.getDate()+1);} return nights;
}

function App(){
 const now=new Date();
 const defStart=new Date(now.getFullYear(),now.getMonth(),now.getDate(),9,0);
 const defEnd=new Date(now.getFullYear(),now.getMonth(),now.getDate(),18,0);
 const [start,setStart]=React.useState(defStart.toISOString().slice(0,16));
 const [end,setEnd]=React.useState(defEnd.toISOString().slice(0,16));

 const s=new Date(start), e=new Date(end);
 const hours=Math.ceil((e-s)/(1000*60*60));
 const nights=nightsBetween(start,end);
 const self=calcSelfTotal(start,end);
 const valet=valetDaysByCutoff(start,end)*VALET_BASE*(1+TAX_RATE/100);
 const cheaperIsSelf=self<=valet;
 const diff=Math.abs(self-valet);

 const cards=[
  {name:'Self Parking',total:self,cheap:cheaperIsSelf},
  {name:'Valet Parking',total:valet,cheap:!cheaperIsSelf}
 ];
 const fmt=n=>`${n.toFixed(2)} CAD`;

 return(
  React.createElement('div',{className:'container'},
   React.createElement('div',{className:'header'},React.createElement('h1',null,'🚗 Parconomics — by Ozan Sonmez')),
   React.createElement('div',{className:'subtitle'},'Smart comparison between self and valet parking costs.'),
   React.createElement('div',{className:'inputs'},
     React.createElement('div',{className:'field'},
       React.createElement('div',{className:'field-top'},
         React.createElement('label',null,'Check-in'),
         React.createElement('span',{className:'weekday'},weekdayAbbr(s))
       ),
       React.createElement('input',{className:'input',type:'datetime-local',value:start,onChange:e=>setStart(e.target.value)})
     ),
     React.createElement('div',{className:'field'},
       React.createElement('div',{className:'field-top'},
         React.createElement('label',null,'Check-out'),
         React.createElement('span',{className:'weekday'},weekdayAbbr(e))
       ),
       React.createElement('input',{className:'input',type:'datetime-local',value:end,onChange:e=>setEnd(e.target.value)})
     ),
     React.createElement('div',{className:'pills'},
       React.createElement('div',{className:'pill'},'Duration ≈ ',React.createElement('b',null,hours),' h'),
       React.createElement('div',{className:'pill'},'Nights: ',React.createElement('b',null,nights))
     )
   ),
   React.createElement('div',{className:'grid'},
     cards.map(c=>
       React.createElement('div',{key:c.name,className:'card '+(c.cheap?'cheap':'exp')},
         React.createElement('div',{className:'card-head'},
           React.createElement('strong',null,c.name),
           React.createElement('span',{className:'badge'},c.cheap?'Cheaper':'More Expensive')
         ),
         React.createElement('div',{className:'price'},fmt(c.total)),
         React.createElement('div',{className:'diff'},c.cheap?`Cheaper by ${fmt(diff)}`:`More expensive by ${fmt(diff)}`)
       )
     )
   ),
   React.createElement('div',{className:'footer'},'© 2025 Ozan Sonmez · Parconomics™')
  )
 );
}

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
