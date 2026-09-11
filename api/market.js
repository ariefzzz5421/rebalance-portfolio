const VALID=/^[A-Za-z0-9.^=\-]+$/;
const RANGE_SPECS={
  '1D':{range:'1d',interval:'5m',ttl:60},
  '1W':{range:'5d',interval:'1h',ttl:120},
  '1M':{range:'1mo',interval:'1d',ttl:300},
  '6M':{range:'6mo',interval:'1d',ttl:600},
  '1Y':{range:'1y',interval:'1d',ttl:900},
  '5Y':{range:'5y',interval:'1wk',ttl:1800},
  '10Y':{range:'10y',interval:'1mo',ttl:3600}
};
const PERIODS={m1:1,y1:12,y5:60,y10:120};
function nearestPoint(points,targetMs){let best=null,bestDist=Infinity;for(const p of points){const d=Math.abs(p.t-targetMs);if(d<bestDist){best=p;bestDist=d;}}return best;}
function annualized(start,end,days){if(!start||!end||start<=0||end<=0||days<=0)return null;const years=days/365.25,value=(Math.pow(end/start,1/years)-1)*100;return Number.isFinite(value)?value:null;}
function periodMetric(points,endPoint,months){
  if(!points.length||!endPoint)return null;
  const target=endPoint.t-months*30.4375*86400000,start=nearestPoint(points,target);if(!start)return null;
  const targetAge=Math.abs(start.t-target)/86400000;
  // Summary data is monthly. A 40-day tolerance allows normal month-boundary drift
  // while preventing an asset with insufficient history from borrowing a much older point.
  if(targetAge>40)return null;
  const days=(endPoint.t-start.t)/86400000;if(days<=0)return null;
  const cagr=annualized(start.v,endPoint.v,days),growth=endPoint.v/start.v;
  if(!Number.isFinite(cagr)||!Number.isFinite(growth)||growth<=0)return null;
  return {cagr,growth,days,start:{t:start.t,v:start.v},end:{t:endPoint.t,v:endPoint.v}};
}
function fetchOptions(){const o={headers:{'User-Agent':'Mozilla/5.0 Porsi/1.6','Accept':'application/json'}};if(typeof AbortSignal!=='undefined'&&AbortSignal.timeout)o.signal=AbortSignal.timeout(10000);return o;}
async function yahoo(symbol,range,interval){
  const url=`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${encodeURIComponent(range)}&interval=${encodeURIComponent(interval)}&includeAdjustedClose=true&events=history`;
  const r=await fetch(url,fetchOptions());if(!r.ok)throw new Error(`Yahoo ${r.status}`);const json=await r.json(),result=json&&json.chart&&json.chart.result&&json.chart.result[0];if(!result)throw new Error((json&&json.chart&&json.chart.error&&json.chart.error.description)||'No market data');return result;
}
function parseResult(symbol,result,includeCagr){
  const ts=result.timestamp||[],quote=(result.indicators&&result.indicators.quote&&result.indicators.quote[0]&&result.indicators.quote[0].close)||[],adj=(result.indicators&&result.indicators.adjclose&&result.indicators.adjclose[0]&&result.indicators.adjclose[0].adjclose)||[];
  const chartPoints=[],returnPoints=[];
  for(let i=0;i<ts.length;i++){
    const close=Number(quote[i]),adjusted=Number.isFinite(adj[i])?Number(adj[i]):close,t=ts[i]*1000;
    if(Number.isFinite(close)&&close>0)chartPoints.push({t,v:Number(close.toFixed(6))});
    if(Number.isFinite(adjusted)&&adjusted>0)returnPoints.push({t,v:Number(adjusted.toFixed(6))});
  }
  const meta=result.meta||{},live=Number(meta.regularMarketPrice),last=chartPoints[chartPoints.length-1]||returnPoints[returnPoints.length-1],endTime=(Number(meta.regularMarketTime)||Math.floor((last&&last.t||0)/1000))*1000,livePrice=Number.isFinite(live)&&live>0?live:(last&&last.v),previousClose=Number(meta.chartPreviousClose||meta.previousClose);
  if(!Number.isFinite(livePrice)||!endTime)throw new Error('No usable prices');
  if(!chartPoints.length||Math.abs(chartPoints[chartPoints.length-1].t-endTime)>3600000)chartPoints.push({t:endTime,v:Number(livePrice.toFixed(6))});
  const adjustedEnd=returnPoints.length?{t:endTime,v:returnPoints[returnPoints.length-1].v}:null;
  const periods={m1:null,y1:null,y5:null,y10:null};
  if(includeCagr&&adjustedEnd){for(const [key,months] of Object.entries(PERIODS))periods[key]=periodMetric(returnPoints,adjustedEnd,months);}
  const cagr={m1:periods.m1&&periods.m1.cagr,y1:periods.y1&&periods.y1.cagr,y5:periods.y5&&periods.y5.cagr,y10:periods.y10&&periods.y10.cagr};
  return {symbol,price:livePrice,previousClose:Number.isFinite(previousClose)?previousClose:null,currency:meta.currency||null,exchange:meta.exchangeName||null,timezone:meta.exchangeTimezoneName||null,asOf:new Date(endTime).toISOString(),source:'Yahoo Finance',history:chartPoints,cagr,periods};
}
async function fetchSummary(symbol){const result=await yahoo(symbol,'10y','1mo');const data=parseResult(symbol,result,true);data.interval='1mo';data.range='10Y-summary';data.history=data.history.slice(-121);return data;}
async function fetchRange(symbol,key){const spec=RANGE_SPECS[key];if(!spec)throw new Error('Unsupported range');const result=await yahoo(symbol,spec.range,spec.interval);const data=parseResult(symbol,result,false);data.interval=spec.interval;data.range=key;return data;}
async function fetchWithLimit(symbols,limit){const data={},queue=symbols.slice();async function worker(){while(queue.length){const symbol=queue.shift();try{data[symbol]=await fetchSummary(symbol);}catch(err){data[symbol]={symbol,error:err&&err.message||'Unavailable'};}}}await Promise.all(Array.from({length:Math.min(limit,symbols.length)},worker));return data;}
module.exports=async function handler(req,res){
  if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
  const raw=String(req.query.symbols||req.query.symbol||''),symbols=[...new Set(raw.split(',').map(s=>s.trim()).filter(Boolean))].slice(0,60),range=String(req.query.range||'').toUpperCase();
  if(!symbols.length||symbols.some(s=>!VALID.test(s)))return res.status(400).json({error:'Invalid symbol'});
  if(range&&!RANGE_SPECS[range])return res.status(400).json({error:'Unsupported range'});
  if(range&&symbols.length!==1)return res.status(400).json({error:'Range requests support one symbol at a time'});
  try{
    if(range){const symbol=symbols[0],value=await fetchRange(symbol,range),ttl=RANGE_SPECS[range].ttl;res.setHeader('Cache-Control',`s-maxage=${ttl}, stale-while-revalidate=${Math.max(ttl*4,300)}`);return res.status(200).json({data:{[symbol]:value},source:'Yahoo Finance historical chart API',range,method:'Chart uses raw market close prices.'});}
    const data=await fetchWithLimit(symbols,6);res.setHeader('Cache-Control','s-maxage=900, stale-while-revalidate=3600');return res.status(200).json({data,source:'Yahoo Finance historical chart API',method:'CAGR and period growth use adjusted close/total-return history where available; price charts use raw close.'});
  }catch(err){return res.status(502).json({error:err.message||'Market data unavailable'});}
};