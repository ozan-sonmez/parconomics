
const TAX_RATE = 13;
const VALET_BASE = 55;

function pad(n){return String(n).padStart(2,'0');}
function localISO(d){ return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`; }
function addMinutes(d,m){const c=new Date(d); c.setMinutes(c.getMinutes()+m); return c;}
function addDays(d,k){const c=new Date(d); c.setDate(c.getDate()+k); return c;}
function ymd(d){return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;}
function isWeekend(d){const w=d.getDay(); return w===0||w===6;}
function inDayWindow(d){const t=d.getHours()+d.getMinutes()/60; return t>=7&&t<18;}

function calcSelfTotal(startISO,endISO){
 let s=new Date(startISO), e=new Date(endISO);
 if(isNaN(s)||isNaN(e)) return 0;
 if(e<=s) e=addMinutes(e,24*60);
 const buckets={};
 let cur=new Date(s);
 while(cur<e){
   const key=ymd(cur);
   const weekend=isWeekend(cur);
   if(inDayWindow(cur)){
     const cap=weekend?10:32;
     const k=`day_${key}_${weekend?'we':'wd'}`;
     if(!buckets[k]) buckets[k]={sum:0,cap};
     buckets[k].sum+=5;
   }else{
     const k=`night_${key}`;
     if(!buckets[k]) buckets[k]={sum:0,cap:10};
     buckets[k].sum+=5;
   }
   cur=addMinutes(cur,20);
 }
 let total=0; for(const k in buckets){ total+=Math.min(buckets[k].sum,buckets[k].cap); }
 return total;
}

function valetDaysByCutoff(startISO,endISO){
 let s=new Date(startISO), e=new Date(endISO);
 if(isNaN(s)||isNaN(e)) return 1;
 if(e<=s) e=addMinutes(e,24*60);
 let cutoff=new Date(s.getFullYear(),s.getMonth(),s.getDate()+1,18,0,0);
 let days=1; while(e>cutoff){ days++; cutoff.setDate(cutoff.getDate()+1); } return days;
}

function weekdayAbbr(d){
 return new Intl.DateTimeFormat('en-US',{weekday:'short'}).format(d);
}

function nightsBetween(startISO,endISO){
 let s=new Date(startISO), e=new Date(endISO);
 if(isNaN(s)||isNaN(e)) return 0;
 if(e<=s) e=addMinutes(e,24*60);
 let nights=0; let midnight=new Date(s.getFullYear(),s.getMonth(),s.getDate()+1,0,0,0);
 while(e>midnight){ nights++; midnight.setDate(midnight.getDate()+1); } return nights;
}

function App(){
 const now=new Date();
 // both inputs default to *current local* datetime
 const [start,setStart]=React.useState(localISO(now));
 const [end,setEnd]=React.useState(localISO(now));
 const [calculated,setCalculated]=React.useState(false);

 const s=new Date(start), e=new Date(end);
 const hours=Math.max(0, Math.ceil((e - s)/(1000*60*60)));
 const nights=nightsBetween(start,end);

 const self=calcSelfTotal(start,end);
 const valet=valetDaysByCutoff(start,end)*VALET_BASE*(1+TAX_RATE/100);
 const cheaperIsSelf=self<=valet;
 const diff=Math.abs(self - valet);
 const fmt=n=>`${(Number(n)||0).toFixed(2)} CAD`;

 const cards=[
  {name:'Self Parking', total:self, cheap:cheaperIsSelf},
  {name:'Valet Parking', total:valet, cheap:!cheaperIsSelf},
 ];

 return (
  React.createElement('div',{className:'container'},
    React.createElement('div',{className:'header'},
      React.createElement('h1',null,'🚗 Parconomics — by Ozan Sonmez')
    ),
    React.createElement('div',{className:'subtitle'},'Smart comparison between self and valet parking costs.'),
    React.createElement('div',{className:'inputs'},
      React.createElement('div',{className:'field'},
        React.createElement('div',{className:'field-top'},
          React.createElement('label',null,'Check-in'),
          React.createElement('span',{className:'weekday'},weekdayAbbr(s))
        ),
        React.createElement('input',{className:'input',type:'datetime-local',value:start,onChange:e=>{setStart(e.target.value); setCalculated(false);}})
      ),
      React.createElement('div',{className:'field'},
        React.createElement('div',{className:'field-top'},
          React.createElement('label',null,'Check-out'),
          React.createElement('span',{className:'weekday'},weekdayAbbr(e))
        ),
        React.createElement('input',{className:'input',type:'datetime-local',value:end,onChange:e=>{setEnd(e.target.value); setCalculated(false);}})
      ),
      React.createElement('div',{className:'pills'},
        React.createElement('div',{className:'pill'},'Duration ≈ ', React.createElement('b',null, hours ), ' h'),
        React.createElement('div',{className:'pill'},'Nights: ', React.createElement('b',null, nights ))
      ),
      React.createElement('div',{className:'calcbar'},
        React.createElement('button',{className:'btn', onClick:()=>setCalculated(true)}, 'Calculate')
      )
    ),
    React.createElement('div',{className:'grid'},
      calculated
        ? cards.map(c =>
            React.createElement('div',{key:c.name,className:'card '+(c.cheap?'cheap':'exp')},
              React.createElement('div',{className:'card-head'},
                React.createElement('strong',null,c.name),
                React.createElement('span',{className:'badge'}, c.cheap ? 'Cheaper' : 'More Expensive')
              ),
              React.createElement('div',{className:'price'}, fmt(c.total) ),
              React.createElement('div',{className:'diff'}, c.cheap ? `Cheaper by ${fmt(diff)}` : `More expensive by ${fmt(diff)}` )
            ))
        : React.createElement('div',{className:'placeholder'},'Choose dates & tap Calculate to see prices.')
    ),
    React.createElement('div',{className:'footer'},'© 2025 Ozan Sonmez · Parconomics™')
  )
 );
}

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
