
(function(){
  const root=document.documentElement;
  const key='pure20_lang_v1';
  const langButtons=[...document.querySelectorAll('[data-lang]')];
  const textNodes=[...document.querySelectorAll('[data-nl][data-en]')];

  function apply(lang){
    root.lang=lang;
    document.body.dataset.lang=lang;
    localStorage.setItem(key,lang);
    textNodes.forEach(el=>{
      const value=el.getAttribute('data-'+lang);
      if(value!=null) el.textContent=value;
    });
    langButtons.forEach(btn=>btn.classList.toggle('active',btn.dataset.lang===lang));
  }
  langButtons.forEach(btn=>btn.addEventListener('click',()=>apply(btn.dataset.lang)));
  apply(localStorage.getItem(key)||'nl');
})();
