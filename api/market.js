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
  const points=[];
  for(let i=0;i<ts.length;i++){const v=Number.isFinite(adj[i])?adj[i]:quote[i];if(Number.isFinite(v)&&v>0)points.push({t:ts[i]*1000,v:Number(v.toFixed(6))});}
  const meta=result.meta||{},live=Number(meta.regularMarketPrice),last=points[points.length-1];
  const endPoint=last?{t:(Number(meta.regularMarketTime)||Math.floor(last.t/1000))*1000,v:Number.isFinite(live)&&live>0?live:last.v}:null;
  if(!endPoint)throw new Error('No usable prices');
  if(!points.length||Math.abs(points[points.length-1].t-endPoint.t)>3600000)points.push({t:endPoint.t,v:Number(endPoint.v.toFixed(6))});
  const previousClose=Number(meta.chartPreviousClose||meta.previousClose);
  return {
    symbol,price:endPoint.v,previousClose:Number.isFinite(previousClose)?previousClose:null,currency:meta.currency||null,exchange:meta.exchangeName||null,timezone:meta.exchangeTimezoneName||null,asOf:new Date(endPoint.t).toISOString(),source:'Yahoo Finance',interval,
    history:detailed?points.slice(-2600):points.slice(-121),
    cagr:{m1:metric(points,endPoint,1),y1:metric(points,endPoint,12),y5:metric(points,endPoint,60),y10:metric(points,endPoint,120)}
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
    return res.status(200).json({data,source:'Yahoo Finance historical chart API',detail:detailed,method:'CAGR is annualized from the nearest adjusted-close observation to each lookback date.'});
  }catch(err){return res.status(502).json({error:err.message||'Market data unavailable'});}
};