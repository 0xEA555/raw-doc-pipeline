window.RS=(function(){
  var MONTHS=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  var STEP={done:["Done","st-done"],in_progress:["In progress","st-prog"],not_started:["Not yet","st-none"],issue:["Issue","st-issue"]};
  var COLS=[
    {key:"ingest",label:"Ingested",tip:"Camera footage copied, organized by bin and backed up."},
    {key:"stringouts",label:"Stringouts",tip:"Each natural day built into one uncut stringout, in shooting order."},
    {key:"markers",label:"Markers",tip:"Story moments flagged in the footage by the editor."},
    {key:"transcripts",label:"Transcripts",tip:"Dialogue transcribed inside the edit project, so lines can be searched."},
    {key:"story_cut",label:"Story cut",tip:"The edit of the production's story from the marked footage."}
  ];
  var TYPES=[
    {key:"youtube",label:"YouTube cut",spec:"12–20 min",color:"var(--ty-youtube)",desc:"The priority. Depends on its narrative spine, shot on the FX3 at RS with James."},
    {key:"spine",label:"Spine",spec:"FX3 · Carlos · James",color:"var(--ty-spine)",desc:"Narrative spine interview, shot separately at RS. Its own mini production that a YouTube cut is built around."},
    {key:"raw",label:"RAW cut",spec:"Multi-hour",color:"var(--ty-raw)",desc:"Nearly uncut, premiered or livestreamed. Audio pass and sensitive content removed; everything else plays out."},
    {key:"cutdown",label:"Topical cutdown",spec:"Mini episode",color:"var(--ty-cutdown)",desc:"A mini episode built around one experience."},
    {key:"clip",label:"Clip",spec:"10–90 sec",color:"var(--ty-clip)",desc:"BTS moments for social."},
    {key:"sizzle",label:"Sizzle",spec:"Reel",color:"var(--ty-sizzle)",desc:"A short reel across the shoots."},
    {key:"feature",label:"Feature / docuseries",spec:"Long arc",color:"var(--ty-feature)",desc:"The full story over multiple years: James, RS, AMG."}
  ];
  var CHAIN=[{key:"rough",label:"EA rough"},{key:"rs_treatment",label:"RS treatment"},{key:"rs_approval",label:"RS approval"},{key:"published",label:"Published"}];
  var SPINE={not_started:{label:"Not started",n:0},scheduled:{label:"Scheduled",n:1},shot:{label:"Shot",n:2},delivered:{label:"Delivered",n:3}};
  function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c];});}
  function n(x){return Number(x).toLocaleString("en-US");}
  function fmtDate(d){if(!d)return "Date TBD";var p=d.split("-");return MONTHS[+p[1]-1]+" "+p[0];}
  function prods(shoots){return shoots.filter(function(s){return s.footage;}).sort(function(a,b){return (a.number||99)-(b.number||99);});}
  function state(s,key){
    if(key==="ingest"){var vx=(s.sources||[]).filter(function(x){return x.camera==="Vixia";});return vx.length&&vx.every(function(x){return x.ingest==="done";})?"done":"in_progress";}
    if(key==="transcripts"){var t=s.footage.transcribed_pct;return t>=98?"done":t>0?"in_progress":"not_started";}
    return (s.stages||{})[key]||"not_started";
  }
  function pill(s,key){
    var st=state(s,key),lab=STEP[st][0],col=COLS.filter(function(c){return c.key===key;})[0];
    if(key==="transcripts")lab=s.footage.transcribed_pct+"%";
    return '<span class="pill '+STEP[st][1]+'" data-label="'+esc(col.label)+'">'+esc(lab)+'</span>';
  }
  function chainIndex(stage){for(var i=0;i<CHAIN.length;i++){if(CHAIN[i].key===stage)return i;}return -1;}
  function chainLabel(stage){var i=chainIndex(stage);return i<0?"Not started":CHAIN[i].label;}
  function typeInfo(k){for(var i=0;i<TYPES.length;i++){if(TYPES[i].key===k)return TYPES[i];}return TYPES[0];}
  function load(u){return fetch(u,{cache:"no-store"}).then(function(r){if(!r.ok)throw new Error(u+" "+r.status);return r.json();});}
  function rootShoot(p,byPiece,byShoot){
    if(p&&p.type==="spine"&&p.for_episode&&byPiece[p.for_episode])return rootShoot(byPiece[p.for_episode],byPiece,byShoot);
    var cur=p,g=0;while(cur&&cur.parent&&byPiece[cur.parent]&&g++<20)cur=byPiece[cur.parent];
    return cur&&cur.shoot&&byShoot[cur.shoot]?cur.shoot:null;
  }
  function index(list){var m={};list.forEach(function(x){m[x.id]=x;});return m;}
  function fail(el,e){document.getElementById(el).innerHTML='<p class="note">Could not load the data ('+esc(e&&e.message)+').</p>';}
  return {STEP:STEP,COLS:COLS,TYPES:TYPES,CHAIN:CHAIN,SPINE:SPINE,esc:esc,n:n,fmtDate:fmtDate,prods:prods,state:state,pill:pill,chainIndex:chainIndex,chainLabel:chainLabel,typeInfo:typeInfo,load:load,rootShoot:rootShoot,index:index,fail:fail};
})();
