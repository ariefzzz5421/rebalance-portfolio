const VALID=/^[A-Za-z0-9.^=\-]+$/;

function nearestPoint(points,targetMs){let best=null,bestDist=Infinity;for(const p of points){const d=Math.abs(p.t-targetMs);if(d<bestDist){best=p;bestDist=d;}}return best;}
function annualized(start,end,days){if(!start||!end||start<=0||end<=0||days<=0)return null;const years=days/365.25,value=(Math.pow(end/start,1/years)-1)*100;return Number.isFinite(value)?value:null;}
function metric(points,endPoint,months){const target=endPoint.t-months*30.4375*86400000,start=nearestPoint(points,target);if(!start)return null;const targetAge=Math.abs(start.t-target)/86400000,tolerance=months<=1?50:months<=12?75:150;if(targetAge>tolerance)return null;return annualized(start.v,endPoint.v,(endPoint.t-start.t)/86400000);}

async function fetchSymbol(symbol,detailed){
  const interval=detailed?'1d':'1mo';
  const url=`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=10y&interval=${interval}&includeAdjustedClose=true&events=history`;
  const r=await fetch(url,{headers:{'User-Agent':'Mozilla/5.0 Porsi/1.2','Accept':'application/json'}});
  if(!r.ok)throw new Error(`Yahoo ${r.status}`);
  const json=await r.json(),result=json&&json.chart&&json.chart.result&&json.chart.result[0];
  if(!result)throw new Error((json&&json.chart&&json.chart.error&&json.chart.error.description)||'No market data');
  const ts=result.timestamp||[],quote=(result.indicators&&result.indicators.quote&&result.indicators.quote[0]&&result.indicators.quote[0].close)||[],adj=(result.indicators&&result.indicators.adjclose&&result.indicators.adjclose[0]&&result.indicators.adjclose[0].adjclose)||[];
  const chartPoints=[],returnPoints=[];
  for(let i=0;i<ts.length;i++){
    const close=Number(quote[i]),adjusted=Number.isFinite(adj[i])?Number(adj[i]):close,t=ts[i]*1000;
    if(Number.isFinite(close)&&close>0)chartPoints.push({t,v:Number(close.toFixed(6))});
    if(Number.isFinite(adjusted)&&adjusted>0)returnPoints.push({t,v:Number(adjusted.toFixed(6))});
  }
  const meta=result.meta||{},live=Number(meta.regularMarketPrice),chartLast=chartPoints[chartPoints.length-1],returnLast=returnPoints[returnPoints.length-1];
  const endTime=(Number(meta.regularMarketTime)||Math.floor(((chartLast||returnLast)||{}).t/1000))*1000;
  const livePrice=Number.isFinite(live)&&live>0?live:(chartLast&&chartLast.v);
  if(!Number.isFinite(livePrice)||!endTime)throw new Error('No usable prices');
  if(!chartPoints.length||Math.abs(chartPoints[chartPoints.length-1].t-endTime)>3600000)chartPoints.push({t:endTime,v:Number(livePrice.toFixed(6))});
  const adjustedEnd=returnLast?{t:endTime,v:returnLast.v}:null;
  const previousClose=Number(meta.chartPreviousClose||meta.previousClose);
  return {
    symbol,price:livePrice,previousClose:Number.isFinite(previousClose)?previousClose:null,currency:meta.currency||null,exchange:meta.exchangeName||null,timezone:meta.exchangeTimezoneName||null,asOf:new Date(endTime).toISOString(),source:'Yahoo Finance',interval,
    history:detailed?chartPoints.slice(-2600):chartPoints.slice(-121),
    cagr:adjustedEnd?{m1:metric(returnPoints,adjustedEnd,1),y1:metric(returnPoints,adjustedEnd,12),y5:metric(returnPoints,adjustedEnd,60),y10:metric(returnPoints,adjustedEnd,120)}:{m1:null,y1:null,y5:null,y10:null}
  };
}

module.exports=async function handler(req,res){
  if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
  const raw=String(req.query.symbols||req.query.symbol||''),symbols=[...new Set(raw.split(',').map(s=>s.trim()).filter(Boolean))].slice(0,45);
  if(!symbols.length||symbols.some(s=>!VALID.test(s)))return res.status(400).json({error:'Invalid symbol'});
  const detailed=String(req.query.detail||'')==='1'&&symbols.length===1;
  try{
    const settled=await Promise.allSettled(symbols.map(s=>fetchSymbol(s,detailed))),data={};
    settled.forEach((r,i)=>{data[symbols[i]]=r.status==='fulfilled'?r.value:{symbol:symbols[i],error:r.reason&&r.reason.message||'Unavailable'};});
    res.setHeader('Cache-Control','s-maxage=900, stale-while-revalidate=3600');
    return res.status(200).json({data,source:'Yahoo Finance historical chart API',detail:detailed,method:'Chart uses raw market close; CAGR uses adjusted close where available.'});
  }catch(err){return res.status(502).json({error:err.message||'Market data unavailable'});}
};