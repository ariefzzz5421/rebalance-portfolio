(function(){
  'use strict';
  const SVG_NS='http://www.w3.org/2000/svg';

  function assetFor(ticker){return window.assetByTicker?window.assetByTicker(ticker):null;}
  function markFor(ticker){
    const marks=window.MARKS||{};
    if(marks[ticker])return marks[ticker];
    const a=assetFor(ticker);
    const key=a&&window.CLASS_MARKS&&window.CLASS_MARKS[a.cls];
    return key&&marks[key]?marks[key]:null;
  }
  function paintMark(svg,mark,color){
    (mark.poly||[]).forEach(part=>{const p=document.createElementNS(SVG_NS,'path');p.setAttribute('d',part.d);p.setAttribute('fill',part.fill||color);svg.appendChild(p);});
    (mark.d||[]).forEach(d=>{const p=document.createElementNS(SVG_NS,'path');p.setAttribute('d',d);p.setAttribute('fill',color);if(mark.rule)p.setAttribute('fill-rule',mark.rule);svg.appendChild(p);});
    (mark.sd||[]).forEach(d=>{const p=document.createElementNS(SVG_NS,'path');p.setAttribute('d',d);p.setAttribute('fill','none');p.setAttribute('stroke',color);p.setAttribute('stroke-width','2');p.setAttribute('stroke-linecap','round');p.setAttribute('stroke-linejoin','round');svg.appendChild(p);});
  }
  function create(ticker,size){
    const a=assetFor(ticker)||{ticker:ticker||'?',name:ticker||'?',color:'#8b8981'};
    const el=document.createElement('span');
    el.className='asset-icon asset-icon--'+(size||'md');
    el.style.setProperty('--brand',a.color||'#8b8981');
    el.setAttribute('aria-hidden','true');
    const logo=(window.LOGO_FILES||{})[ticker];
    const mark=markFor(ticker);
    if(logo){
      const img=document.createElement('img');img.src=logo;img.alt='';img.loading='lazy';el.appendChild(img);
    }else if(mark){
      const svg=document.createElementNS(SVG_NS,'svg');const vb=mark.vb||24;svg.setAttribute('viewBox',`0 0 ${vb} ${vb}`);paintMark(svg,mark,'currentColor');el.appendChild(svg);
    }else{
      const mono=document.createElement('span');mono.className='asset-icon__mono';mono.textContent=String(ticker||a.name||'?').replace(/[^A-Za-z0-9]/g,'').slice(0,2).toUpperCase()||'?';el.appendChild(mono);
    }
    return el;
  }
  function html(ticker,size){const wrap=document.createElement('div');wrap.appendChild(create(ticker,size));return wrap.innerHTML;}
  window.assetIconEl=create;
  window.assetIconHTML=html;
})();