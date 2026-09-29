(()=>{'use strict';
const get=(k)=>{try{return localStorage.getItem(k)}catch{return null}};
const put=(k,v)=>{try{localStorage.setItem(k,v)}catch{}};
let lang=get('pure20-knowledge-language')==='en'?'en':'nl';
const input=document.querySelector('#knowledge-search');
const rows=[...document.querySelectorAll('#entries .entry')];
const filters=[...document.querySelectorAll('[data-category]')].filter(e=>e.tagName==='BUTTON');
const params=new URLSearchParams(location.search);
let category=filters.some(b=>b.dataset.category===params.get('category'))?params.get('category'):'all';
if(input)input.value=params.get('q')||'';
const normalize=(s)=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[–—]/g,'-');
function filter(updateUrl=false){if(!input)return;const words=normalize(input.value.trim()).split(/\s+/).filter(Boolean);let total=0;
for(const row of rows){const matchCategory=category==='all'?row.dataset.category!=='archive':row.dataset.category===category;const text=normalize(row.dataset.search);row.hidden=!(matchCategory&&words.every(w=>text.includes(w)));if(!row.hidden)total++;}
for(const b of filters)b.setAttribute('aria-pressed',String(b.dataset.category===category));
document.querySelector('#results').textContent=`${total} ${lang==='nl'?(total===1?'document':'documenten'):(total===1?'document':'documents')}`;
document.querySelector('#no-results').hidden=total!==0;
if(updateUrl){const p=new URLSearchParams();if(input.value.trim())p.set('q',input.value.trim());if(category!=='all')p.set('category',category);history.replaceState(null,'',location.pathname+(p.size?'?'+p:'')+location.hash);}}
function language(value){lang=value;document.documentElement.lang=lang;document.querySelectorAll('[data-content-language]').forEach(e=>e.lang=lang);put('pure20-knowledge-language',lang);const legacySearch=document.querySelector('#peptide-search');if(legacySearch)legacySearch.placeholder=lang==='nl'?'Zoek naam, synoniem of categorie':'Search name, alias or class';document.querySelectorAll('[data-nl][data-en]').forEach(e=>{e.textContent=e.dataset[lang]});document.querySelectorAll('[data-language]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.language===lang)));if(input)input.placeholder=lang==='nl'?'Bijvoorbeeld BPC-157, retatrutide of 10 mg':'Try BPC-157, retatrutide or 10 mg';filter();document.dispatchEvent(new Event('pure20-language'));}
document.querySelectorAll('[data-language]').forEach(b=>b.addEventListener('click',()=>language(b.dataset.language)));
filters.forEach(b=>b.addEventListener('click',()=>{category=b.dataset.category;filter(true)}));
input?.addEventListener('input',()=>filter(true));document.querySelector('#clear-search')?.addEventListener('click',()=>{input.value='';filter(true);input.focus()});language(lang);
})();
