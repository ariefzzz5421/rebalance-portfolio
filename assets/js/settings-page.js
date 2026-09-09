(function(){
'use strict';
const STORE='porsi.v1';
function defaults(){return{currency:'IDR',total:0,theme:'dark',parts:[]};}
function load(){try{return Object.assign(defaults(),JSON.parse(localStorage.getItem(STORE)||'{}')||{});}catch{return defaults();}}
let state=load();
function save(){localStorage.setItem(STORE,JSON.stringify(state));render();}
function render(){
 document.documentElement.dataset.theme=state.theme==='light'?'light':'dark';
 document.documentElement.style.colorScheme=state.theme==='light'?'light':'dark';
 document.querySelectorAll('[data-currency]').forEach(b=>b.classList.toggle('is-on',b.dataset.currency===state.currency));
 document.querySelectorAll('[data-theme-choice]').forEach(b=>b.classList.toggle('is-on',b.dataset.themeChoice===state.theme));
}
document.getElementById('currency-choices').addEventListener('click',e=>{const b=e.target.closest('[data-currency]');if(!b)return;state.currency=b.dataset.currency;save();});
document.getElementById('theme-choices').addEventListener('click',e=>{const b=e.target.closest('[data-theme-choice]');if(!b)return;state.theme=b.dataset.themeChoice;save();});
document.getElementById('reset-data').addEventListener('click',()=>{if(!confirm('Hapus semua isian dan mulai dari awal?'))return;localStorage.removeItem(STORE);location.href='index.html';});
render();
})();