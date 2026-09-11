(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.StrategyPerformance=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const DAY=86400000;
  const YEAR_DAYS=365.2425;
  const INITIAL_NAV=10000;
  const DEFAULT_REBALANCE_MODE='none';

  function utcDay(t){const d=new Date(Number(t));return Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate());}
  function toIso(t){return new Date(Number(t)).toISOString();}
  function normalizeHistory(history){
    if(!Array.isArray(history))return [];
    const byDay=new Map();
    history.forEach(p=>{const t=Number(p&&p.t),v=Number(p&&p.v);if(!Number.isFinite(t)||!Number.isFinite(v)||v<=0)return;byDay.set(utcDay(t),{t:utcDay(t),v});});
    return [...byDay.values()].sort((a,b)=>a.t-b.t);
  }
  function normalizeAsset(asset){return {...asset,history:normalizeHistory(asset&&asset.history)};}
  function getAssetAvailableRange(asset){const a=normalizeAsset(asset),h=a.history;if(!h.length)return null;return {ticker:a.ticker||a.symbol||'',startMs:h[0].t,endMs:h[h.length-1].t,startDate:toIso(h[0].t),endDate:toIso(h[h.length-1].t),days:(h[h.length-1].t-h[0].t)/DAY};}
  function getPortfolioCommonRange(assets){
    const normalized=(assets||[]).map(normalizeAsset);if(!normalized.length)return null;const ranges=normalized.map(getAssetAvailableRange);if(ranges.some(r=>!r))return null;
    const startMs=Math.max(...ranges.map(r=>r.startMs)),endMs=Math.min(...ranges.map(r=>r.endMs));if(!(endMs>startMs))return null;
    const limitedByAssets=ranges.filter(r=>r.startMs===startMs).map(r=>r.ticker).filter(Boolean);
    return {startMs,endMs,startDate:toIso(startMs),endDate:toIso(endMs),days:(endMs-startMs)/DAY,years:(endMs-startMs)/DAY/YEAR_DAYS,limitedByAsset:limitedByAssets[0]||null,limitedByAssets};
  }
  function binaryNearest(points,targetMs){if(!points.length)return null;let lo=0,hi=points.length-1;if(targetMs<=points[lo].t)return points[lo];if(targetMs>=points[hi].t)return points[hi];while(lo<=hi){const mid=(lo+hi)>>1,t=points[mid].t;if(t===targetMs)return points[mid];if(t<targetMs)lo=mid+1;else hi=mid-1;}const before=points[Math.max(0,hi)],after=points[Math.min(points.length-1,lo)];return Math.abs(before.t-targetMs)<=Math.abs(after.t-targetMs)?before:after;}
  function latestAtOrBefore(points,targetMs){if(!points.length||targetMs<points[0].t)return null;let lo=0,hi=points.length-1,best=null;while(lo<=hi){const mid=(lo+hi)>>1,p=points[mid];if(p.t<=targetMs){best=p;lo=mid+1;}else hi=mid-1;}return best;}
  function nearestValidObservation(points,targetMs){return binaryNearest(normalizeHistory(points),utcDay(targetMs));}
  function observationAtOrBefore(points,targetMs){const h=normalizeHistory(points),target=utcDay(targetMs),prev=latestAtOrBefore(h,target);return prev||h[0]||null;}
  function subtractUtcYears(endMs,years){const d=new Date(endMs);d.setUTCFullYear(d.getUTCFullYear()-years);return utcDay(d.getTime());}
  function startOfUtcYear(endMs){const d=new Date(endMs);return Date.UTC(d.getUTCFullYear(),0,1);}
  function monthDiffLabel(days){const months=days/30.4375,buckets=[12,9,6,3,1],b=buckets.find(x=>months>=x-0.08);if(b&&b<12)return `${b}M`;if(days>=7)return `${Math.max(1,Math.floor(days/7))}W`;return `${Math.max(1,Math.floor(days))}D`;}
  function calculatePortfolioValueSeries(assets,weights,startMs,endMs,options){
    const opts={initialValue:INITIAL_NAV,rebalanceMode:DEFAULT_REBALANCE_MODE,...(options||{})};if(opts.rebalanceMode!=='none')throw new Error(`Unsupported rebalanceMode: ${opts.rebalanceMode}`);
    const normalized=(assets||[]).map(normalizeAsset);if(!normalized.length)throw new Error('No assets supplied');const weightMap=new Map();if(Array.isArray(weights))weights.forEach(w=>weightMap.set(w.ticker,Number(w.weight)));else Object.entries(weights||{}).forEach(([k,v])=>weightMap.set(k,Number(v)));
    const sum=[...weightMap.values()].reduce((a,b)=>a+(Number.isFinite(b)?b:0),0);if(Math.abs(sum-1)>1e-6)throw new Error('Weights must sum to 1');
    const anchors=[];normalized.forEach(a=>{const ticker=a.ticker||a.symbol,weight=weightMap.get(ticker);if(!Number.isFinite(weight))throw new Error(`Missing weight for ${ticker}`);const start=observationAtOrBefore(a.history,startMs),end=observationAtOrBefore(a.history,endMs);if(!start||!end)throw new Error(`Insufficient history for ${ticker}`);anchors.push({ticker,weight,start,end,history:a.history,stablecoinFallbackUsed:!!a.stablecoinFallbackUsed});});
    const actualStartMs=Math.max(...anchors.map(p=>p.start.t)),actualEndMs=Math.min(...anchors.map(p=>p.end.t));if(!(actualEndMs>actualStartMs))throw new Error('No common observations in requested period');
    const positions=anchors.map(p=>{const start=observationAtOrBefore(p.history,actualStartMs),end=observationAtOrBefore(p.history,actualEndMs);if(!start||!end||end.t<=start.t)throw new Error(`Invalid history range for ${p.ticker}`);const allocation=opts.initialValue*p.weight;return {...p,startObservation:start,endObservation:end,startPrice:start.v,shares:allocation/start.v};});
    const portfolioStartMs=Math.max(...positions.map(p=>p.startObservation.t)),portfolioEndMs=Math.min(...positions.map(p=>p.endObservation.t));if(!(portfolioEndMs>portfolioStartMs))throw new Error('No common portfolio observations');
    const timeline=new Set([portfolioStartMs,portfolioEndMs]);positions.forEach(p=>p.history.forEach(x=>{if(x.t>portfolioStartMs&&x.t<=portfolioEndMs)timeline.add(x.t);}));const times=[...timeline].sort((a,b)=>a-b),series=[{t:portfolioStartMs,v:opts.initialValue}];
    for(const t of times){if(t===portfolioStartMs)continue;let value=0,complete=true;for(const p of positions){const obs=latestAtOrBefore(p.history,t);if(!obs){complete=false;break;}value+=p.shares*obs.v;}if(complete&&Number.isFinite(value))series.push({t,v:value});}
    if(series.length<2)throw new Error('Insufficient common portfolio observations');return {initialValue:opts.initialValue,rebalanceMode:opts.rebalanceMode,startMs:series[0].t,endMs:series[series.length-1].t,series,positions,stablecoinFallbackUsed:positions.some(p=>p.stablecoinFallbackUsed)};
  }
  function calculatePortfolioReturn(seriesOrResult){const series=Array.isArray(seriesOrResult)?seriesOrResult:(seriesOrResult&&seriesOrResult.series)||[];if(series.length<2)return null;const start=series[0],end=series[series.length-1];if(!(start.v>0)||!(end.v>0))return null;return {value:end.v/start.v-1,startValue:start.v,endValue:end.v,startMs:start.t,endMs:end.t,days:(end.t-start.t)/DAY,years:(end.t-start.t)/DAY/YEAR_DAYS};}
  function calculatePortfolioCAGR(seriesOrResult){const r=calculatePortfolioReturn(seriesOrResult);if(!r||r.days<365)return null;const value=Math.pow(r.endValue/r.startValue,1/r.years)-1;return Number.isFinite(value)?{...r,value}:null;}
  function buildMetric({periodKey,label,startMs,endMs,assets,weights,commonRange,returnType,requestedPeriod,tooltipPrefix}){
    const result=calculatePortfolioValueSeries(assets,weights,startMs,endMs,{initialValue:INITIAL_NAV,rebalanceMode:DEFAULT_REBALANCE_MODE}),raw=returnType==='cagr'?calculatePortfolioCAGR(result):calculatePortfolioReturn(result);if(!raw)return null;
    const actualYears=raw.years,limited=commonRange&&commonRange.limitedByAsset,since=new Date(raw.startMs).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric',timeZone:'UTC'}),typeLabel=returnType==='cagr'?'CAGR':'Total return';let tooltip=tooltipPrefix||`${label} ${typeLabel} uses the strategy's buy-and-hold portfolio series.`;if(periodKey==='MAX')tooltip=`${actualYears>=1?`${actualYears.toFixed(1)}Y CAGR`:`${label} Total return`} · Since ${since}${limited?` · history limited by ${limited}`:''}`;
    return {periodKey,label,actualYears,startDate:toIso(raw.startMs),endDate:toIso(raw.endMs),returnType,value:raw.value,startingPortfolioValue:raw.startValue,endingPortfolioValue:raw.endValue,limitedByAsset:limited,rebalanceMode:DEFAULT_REBALANCE_MODE,stablecoinFallbackUsed:result.stablecoinFallbackUsed,requestedPeriod:requestedPeriod||periodKey,tooltip};
  }
  function windowsEqual(a,b){return a&&b&&a.startDate===b.startDate&&a.endDate===b.endDate;}
  function resolvePerformancePeriods(assets,weights,options){
    const opts={endMs:null,...(options||{})},normalized=(assets||[]).map(normalizeAsset),common=getPortfolioCommonRange(normalized);if(!common)return {metrics:[],commonRange:null,error:'insufficient_history'};const endMs=opts.endMs?Math.min(utcDay(opts.endMs),common.endMs):common.endMs,commonStart=common.startMs;
    const makeTrailing=(years,key)=>{const target=subtractUtcYears(endMs,years);if(commonStart>target)return null;return buildMetric({periodKey:key,label:key,startMs:target,endMs,assets:normalized,weights,commonRange:common,returnType:'cagr',requestedPeriod:key});};
    const one=makeTrailing(1,'1Y'),five=makeTrailing(5,'5Y'),ten=makeTrailing(10,'10Y'),metrics=[];
    if(one)metrics.push(one);else{const availableDays=(endMs-commonStart)/DAY;if(availableDays>0){const label=monthDiffLabel(availableDays),short=buildMetric({periodKey:label,label,startMs:commonStart,endMs,assets:normalized,weights,commonRange:common,returnType:'total_return',requestedPeriod:'1Y',tooltipPrefix:`${label} Total return uses all common history available; CAGR is not shown before 365 days.`});if(short)metrics.push(short);}}
    if(five)metrics.push(five);else{const ytdStart=Math.max(startOfUtcYear(endMs),commonStart);if(endMs-ytdStart>=7*DAY){const ytd=buildMetric({periodKey:'YTD',label:'YTD',startMs:ytdStart,endMs,assets:normalized,weights,commonRange:common,returnType:'total_return',requestedPeriod:'5Y',tooltipPrefix:'YTD is the buy-and-hold total return from the first common observation of the current UTC calendar year.'});if(ytd&&!metrics.some(m=>windowsEqual(m,ytd)))metrics.push(ytd);}}
    if(ten)metrics.push(ten);else{const availableDays=(endMs-commonStart)/DAY,returnType=availableDays>=365?'cagr':'total_return',max=buildMetric({periodKey:'MAX',label:'MAX',startMs:commonStart,endMs,assets:normalized,weights,commonRange:common,returnType,requestedPeriod:'10Y'});if(max&&!metrics.some(m=>windowsEqual(m,max)))metrics.push(max);}
    if(metrics.length<3&&five&&!ten){const ytdStart=Math.max(startOfUtcYear(endMs),commonStart);if(endMs-ytdStart>=7*DAY){const ytd=buildMetric({periodKey:'YTD',label:'YTD',startMs:ytdStart,endMs,assets:normalized,weights,commonRange:common,returnType:'total_return',requestedPeriod:'10Y'});if(ytd&&!metrics.some(m=>windowsEqual(m,ytd)))metrics.splice(Math.min(1,metrics.length),0,ytd);}}
    return {metrics:metrics.slice(0,3),commonRange:{...common,endMs,endDate:toIso(endMs)},initialValue:INITIAL_NAV,rebalanceMode:DEFAULT_REBALANCE_MODE};
  }
  function formatPerformancePeriod(metric){if(!metric)return '';const value=metric.value*100,sign=value>0?'+':'';return `${metric.label} ${sign}${value.toFixed(1)}%`;}
  function withStablecoinFallback(asset,startMs,endMs,enabled){const a=normalizeAsset(asset);if(a.history.length||!enabled||!a.isStablecoin)return a;return {...a,history:[{t:utcDay(startMs),v:1},{t:utcDay(endMs),v:1}],stablecoinFallbackUsed:true};}
  return {DAY,YEAR_DAYS,INITIAL_NAV,DEFAULT_REBALANCE_MODE,normalizeHistory,getAssetAvailableRange,getPortfolioCommonRange,nearestValidObservation,observationAtOrBefore,calculatePortfolioValueSeries,calculatePortfolioReturn,calculatePortfolioCAGR,resolvePerformancePeriods,formatPerformancePeriod,withStablecoinFallback};
});
