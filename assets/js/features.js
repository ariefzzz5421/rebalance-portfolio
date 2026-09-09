(function(){
  'use strict';
  const STORE='porsi.v1';
  const STRATEGIES={
    high:{title:'Strategy 1 · High Risk',subtitle:'Crypto-heavy growth allocation',parts:[['BTC','Bitcoin',50],['HYPE','Hyperliquid',20],['XAUT','Tether Gold',15],['USDT','Tether USD',15]]},
    conservative:{title:'Strategy 2 · Conservative',subtitle:'Balanced S&P 500, Bitcoin, and gold',parts:[['SPX','S&P 500',34],['BTC','Bitcoin',33],['GOLD','Emas Fisik / Logam Mulia',33]]}
  };
  let selected=null;
  const $=(s,r)=>(r||document).querySelector(s);
  function uid(){return 'p'+Math.random().toString(36).slice(2,8);}
  function buildRow(ticker,name,pct){
    const row=document.createElement('div');row.className='strategy-modal__row';
    const left=document.createElement('div');left.className='strategy-modal__asset';
    if(window.assetIconEl)left.appendChild(window.assetIconEl(ticker,'md'));
    const text=document.createElement('div');text.className='strategy-modal__identity';
    const tk=document.createElement('strong');tk.textContent=ticker;
    const nm=document.createElement('span');nm.textContent=name;
    text.append(tk,nm);left.appendChild(text);
    const value=document.createElement('span');value.className='strategy-modal__pct';value.textContent=pct+'%';
    row.append(left,value);return row;
  }
  function openStrategy(key){
    const s=STRATEGIES[key];if(!s)return;selected=key;
    $('#strategy-title').textContent=s.title;$('#strategy-subtitle').textContent=s.subtitle;
    const host=$('#strategy-list');host.textContent='';s.parts.forEach(([ticker,name,pct])=>host.appendChild(buildRow(ticker,name,pct)));
    const sheet=$('#strategy-modal');sheet.hidden=false;document.body.classList.add('locked');requestAnimationFrame(()=>sheet.classList.add('on'));
  }
  function closeStrategy(){const sheet=$('#strategy-modal');if(!sheet)return;sheet.classList.remove('on');document.body.classList.remove('locked');setTimeout(()=>sheet.hidden=true,200);}
  function applyStrategy(){
    const s=STRATEGIES[selected];if(!s)return;
    let prev={};try{prev=JSON.parse(localStorage.getItem(STORE)||'{}')||{};}catch{}
    const next={currency:prev.currency||'IDR',total:Number(prev.total)||0,theme:prev.theme==='light'?'light':'dark',parts:s.parts.map(([ticker,name,pct],i)=>({id:uid(),ticker,name:ticker,pct,slot:i+1}))};
    localStorage.setItem(STORE,JSON.stringify(next));location.reload();
  }
  function boot(){
    document.querySelectorAll('[data-strategy]').forEach(btn=>btn.addEventListener('click',()=>openStrategy(btn.dataset.strategy)));
    document.querySelectorAll('#strategy-modal [data-close-strategy]').forEach(btn=>btn.addEventListener('click',closeStrategy));
    const apply=$('#apply-strategy');if(apply)apply.addEventListener('click',applyStrategy);
    const ccy=$('#ccy-chip');if(ccy)ccy.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();location.href='settings.html';},true);
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('#strategy-modal')&&!$('#strategy-modal').hidden)closeStrategy();});
  }
  document.addEventListener('DOMContentLoaded',boot);
})();