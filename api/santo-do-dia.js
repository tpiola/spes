const MONTHS=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
const FALLBACKS={'08-06':'São Hormisda, papa'};
function clean(value=''){return value.replace(/<[^>]*>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim()}
export default async function handler(_req,res){
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  const get=t=>parts.find(p=>p.type===t)?.value;const month=get('month'),day=get('day'),key=`${month}-${day}`;const sourceUrl=`https://www.vaticannews.va/pt/santo-do-dia/${month}/${day}.html`;
  let name=FALLBACKS[key]||'';
  try{const response=await fetch(sourceUrl,{headers:{'user-agent':'SPES/1.0 (+https://spes.blog)'}});if(response.ok){const html=await response.text();const candidates=[...html.matchAll(/>(S\.?\s*[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][^<>]{2,70})</g)].map(m=>clean(m[1])).filter(v=>v.length<75&&!/Santo do dia/i.test(v));if(candidates.length)name=candidates[0].replace(/^S\.\s*/,'São ')}}catch(_){}
  res.setHeader('Cache-Control','s-maxage=21600, stale-while-revalidate=86400');res.status(200).json({name,dateLabel:`${Number(day)} de ${MONTHS[Number(month)-1]}`,sourceUrl,source:'Vatican News'});
}
