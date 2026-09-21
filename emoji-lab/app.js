/* Fenhao Emoji Lab repair 20260922-fix2. No inline event-handler strings. */
(function () {
  'use strict';
  const VERSION = '20260922-fix2';
  const $ = (s) => document.querySelector(s);
  const all = new Map();
  const states = { noto: '等待连接', telegram: '等待连接', telemoji: '等待连接' };
  const sourceNames = { noto: 'Noto', telegram: 'Telegram 特效', telemoji: 'Telemoji', class: '课堂组合', fx: '网页特效' };
  let tab = 'featured', page = 1, mode = 'chat', fav = {}, gridCleanups = [], fxTimer, detailPlayer, detailToken = 0, libraryPromise;
  const perPage = 24;
  function el(tag, cls, text) { const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; }
  function button(text, action) { const b = el('button', '', text); b.type = 'button'; b.addEventListener('click', action); return b; }
  function link(text, url) { const a = el('a', '', text); a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; return a; }
  function toast(text) { $('#toast').textContent = text; $('#toast').classList.add('on'); clearTimeout(toast.timer); toast.timer = setTimeout(() => $('#toast').classList.remove('on'), 2600); }
  try { const v = JSON.parse(localStorage.getItem('fenhaoEmojiFav') || '{}'); if (v && typeof v === 'object' && !Array.isArray(v)) fav = v; } catch (_) {}
  function save() { $('#favCount').textContent = Object.keys(fav).length; try { localStorage.setItem('fenhaoEmojiFav', JSON.stringify(fav)); } catch (_) { $('#storageNote').textContent = '此浏览器不允许保存收藏；关闭前请导出清单。'; } }
  function codeToEmoji(cp) { try { return String.fromCodePoint(...cp.split('_').map(x => parseInt(x, 16))); } catch (_) { return ''; } }
  const cn = { '1f389':'撒花庆祝','1f525':'燃起来','2764':'爱心','2728':'闪闪发光','1f60e':'稳了','1f44d':'点赞真棒','1f44f':'鼓掌','1f602':'笑哭了','1f973':'派对庆祝','1f92f':'脑子炸了','1f4af':'满分','1f680':'起飞','1f3c6':'拿下冠军','1f4a1':'我悟了','1f64c':'举手欢呼','1f970':'被暖到了','1f60d':'太爱了','1f62d':'哭了','1f914':'认真思考','1f642_200d_2195_fe0f':'点头懂了','1f642_200d_2194_fe0f':'摇头没懂','1f913':'学霸上线','1fae1':'收到','1f4aa':'加油','1f64f':'谢谢老师','1f971':'休息一下','1f44b':'挥手再见','1f605':'有点跟不上','1f44c':'可以','1f929':'太精彩了','1f979':'感动了' };
  const featured = new Set(['1f389','1f525','2764','2728','1f60e','1f44d','1f44f','1f602','1f973','1f92f','1f4af','1f680','1f3c6','1f4a1','1f64c','1f970','1f60d','1f62d','1f914']);
  function noto(cp, name) { return { id:'noto-'+cp, name:cn[cp] || name || codeToEmoji(cp), emoji:codeToEmoji(cp), source:'noto', kind:'asset', cp, webp:'https://fonts.gstatic.com/s/e/notoemoji/latest/'+cp+'/512.webp', lottie:'https://fonts.gstatic.com/s/e/notoemoji/latest/'+cp+'/lottie.json', lottieBackup:'https://raw.githubusercontent.com/quarrel/noto-emoji-dotlottie/main/noto-anim-lottie.json/'+cp+'.json', origin:'https://github.com/quarrel/noto-emoji-dotlottie', license:'Google Noto · CC BY 4.0，保留署名和许可链接', featured:featured.has(cp) }; }
  function add(a) { if (a && a.id && !all.has(a.id)) all.set(a.id, a); }
  Object.keys(cn).forEach(cp => add(noto(cp)));
  const classes = [['点头懂了','1f642_200d_2195_fe0f','我听懂了'],['还没听懂','1f642_200d_2194_fe0f','这里我还没弄懂'],['再讲一遍','1f914','老师，这里再讲一遍'],['老师慢点','1f605','老师慢一点，我在跟'],['我悟了','1f4a1','我悟了！'],['记笔记中','1f913','正在记重点'],['我要提问','1f64c','老师，我有个问题'],['这题稳了','1f60e','这题我会了'],['谢谢老师','1f64f','谢谢老师'],['老师讲得好','1f44f','这次讲清楚了'],['加油冲刺','1f4aa','一起加油'],['收到','1fae1','收到！'],['答案选A','1f44c','我选 A'],['答案选B','1f44c','我选 B'],['答案选C','1f44c','我选 C'],['答案选D','1f44c','我选 D'],['成功拿下','1f3c6','这个知识点拿下'],['冲上岸','1f680','继续练，冲上岸'],['满分思路','1f4af','这个思路很完整'],['请举个例子','1f914','老师，可以举个例子吗'],['我来试讲','1f64c','老师，我来试讲'],['结构化练习','1f913','开始结构化练习'],['计时开始','1fae1','准备好，开始计时'],['同学太棒了','1f44d','同学答得真好'],['原来如此','1f929','原来还可以这样答'],['作文有救了','1f979','作文终于有思路了'],['休息一下','1f971','课间休息一下'],['明天继续','1f44b','明天接着练'],['下课撒花','1f389','下课啦，辛苦大家']];
  classes.forEach((x,i) => add(Object.assign(noto(x[1]), { id:'class-'+i, name:x[0], source:'class', kind:'class', caption:x[2], featured:i<6 })));
  const effects = [['彩纸庆祝','🎉','一起庆祝'],['爱心雨','💗','被你们暖到了'],['全屏掌声','👏','把掌声送给你'],['满屏666','🔥','666'],['火箭起飞','🚀','一起起飞'],['上岸冲刺','🏆','冲上岸！'],['星光满屏','✨','你真的很棒'],['我悟了','💡','我 悟 了'],['点赞暴击','👍','这次真的学会了'],['全体起立','🙌','全体起立！'],['老师辛苦了','❤️','老师辛苦了'],['下课狂欢','🎓','下课啦，撒花！']];
  effects.forEach((x,i) => add({ id:'fx-'+i, name:x[0], emoji:x[1], source:'fx', kind:'fx', caption:x[2], featured:i<6, origin:'https://github.com/muzi2023/jiaozichaxun/tree/main/emoji-lab', license:'本页编排的 CSS 特效；不是下载的 Lottie 素材' }));
  function validPath(p, prefix, ext) { return typeof p === 'string' && p.startsWith(prefix+'/') && p.endsWith(ext) && !p.includes('..') && /^[A-Za-z0-9_+./-]+$/.test(p); }
  function telegram(emoji, code, index, file) {
    if (!file || !validPath(file.webp, 'webp', '.webp')) return;
    const cp = String(code).replace(/U\+/g,'').toLowerCase();
    const base = 'https://media.githubusercontent.com/media/ilyhalight/telegram-emoji-effects/master/';
    add({ id:'tg-'+code+'-'+index, name:(cn[cp] || emoji+' 动效')+' · '+(index+1), emoji, source:'telegram', kind:'asset', cp, webp:base+file.webp, lottie:validPath(file.lottie,'lottie','.json') ? base+file.lottie : '', origin:'https://github.com/ilyhalight/telegram-emoji-effects', license:'Telegram 原始素材；商业使用范围待核对', featured:index===0 && featured.has(cp) });
  }
  [['🎉','U+1F389'],['🔥','U+1F525'],['❤','U+2764'],['✨','U+2728'],['😎','U+1F60E']].forEach(x => telegram(x[0],x[1],0,{ webp:'webp/'+x[1]+'/0.webp', lottie:'lottie/'+x[1]+'/0.json' }));
  function list() {
    const q = $('#search').value.toLowerCase().trim(), src = $('#source').value;
    const items = tab === 'fav' ? Object.keys(fav).map(id => all.get(id)).filter(Boolean) : [...all.values()];
    return items.filter(a => !(tab==='featured' && !a.featured) && !(tab==='class' && a.kind!=='class') && !(tab==='fx' && a.kind!=='fx') && (src==='all' || src===a.source) && (!q || [a.name,a.emoji,a.id,a.caption||''].join(' ').toLowerCase().includes(q)));
  }
  // Explicit error UI: a failed animation is never disguised as a working static emoji.
  function picture(a, host, lazy) {
    const wrap = el('div','picture'), img = el('img'), status = el('small','asset-status','加载中');
    img.alt = a.name; img.referrerPolicy = 'no-referrer'; img.decoding = 'async'; img.hidden = true;
    wrap.append(img,status); host.append(wrap);
    let timer, observer, disposed = false, started = false, index = 0;
    const urls = [a.webp, a.webpBackup].filter(Boolean);
    function fail() {
      clearTimeout(timer); if (disposed) return;
      if (++index < urls.length) { attempt(); return; }
      img.hidden = true; wrap.dataset.state = 'error'; status.textContent = '动画加载失败'; status.hidden = false;
    }
    function attempt() {
      wrap.dataset.state = 'loading'; timer = setTimeout(fail, 10000);
      img.onload = () => { clearTimeout(timer); if (disposed) return; img.hidden = false; status.hidden = true; wrap.dataset.state = 'loaded'; };
      img.onerror = fail; img.src = urls[index];
    }
    function start() { if (started || disposed) return; started = true; if (!urls.length) { fail(); return; } attempt(); }
    if (lazy && 'IntersectionObserver' in window) { observer = new IntersectionObserver(entries => { if (entries.some(e=>e.isIntersecting)) { observer.disconnect(); start(); } }, { rootMargin:'120px' }); observer.observe(wrap); } else start();
    return () => { disposed = true; clearTimeout(timer); if (observer) observer.disconnect(); img.onload = img.onerror = null; img.removeAttribute('src'); };
  }
  function render() {
    gridCleanups.forEach(fn => fn()); gridCleanups = [];
    const arr = list(), pages = Math.max(1, Math.ceil(arr.length/perPage)); page = Math.max(1,Math.min(page,pages));
    $('#count').textContent = all.size; $('#result').textContent = arr.length+' 个条目'; $('#page').textContent = page+' / '+pages;
    $('#prev').disabled = page<=1; $('#next').disabled = page>=pages;
    const grid = $('#grid'); grid.replaceChildren();
    arr.slice((page-1)*perPage,page*perPage).forEach(a => {
      const card = el('div','card'), sendButton = button('', () => send(a)); sendButton.className = 'asset'; sendButton.dataset.send = a.id; sendButton.setAttribute('aria-label','发送 '+a.name);
      const pic = el('div','pic'); if (a.kind==='fx') pic.append(el('span','fallback',a.emoji)); else gridCleanups.push(picture(a,pic,true));
      sendButton.append(pic,el('div','name',a.name),el('div','meta',sourceNames[a.source]+' · '+(a.kind==='fx'?'CSS':'WebP')));
      const foot = el('div','cardfoot'), fb = button(fav[a.id]?'♥ 已选':'♡ 收藏', () => { if (fav[a.id]) delete fav[a.id]; else fav[a.id] = a; save(); render(); }); fb.dataset.fav = a.id; if (fav[a.id]) fb.className='fav';
      const db = button('详情', () => info(a)); db.dataset.info = a.id; foot.append(fb,db); card.append(sendButton,foot); grid.append(card);
    });
    if (!arr.length) grid.append(el('div','empty',tab==='fav'?'还没有收藏。点喜欢的素材下方的“♡ 收藏”。':'没有匹配条目，试试清空搜索或切换来源。'));
    $('#hint').textContent = '目录数量不等于已播放数量；动画失败会单独标明。'; save();
  }
  function append(text, a) {
    const msg = el('div','msg'), bubble = el('div','bubble'); msg.append(el('div','ava','我'),bubble);
    if (a && a.kind!=='fx') { msg.dispose = picture(a,bubble,false); bubble.append(el('b','',a.name)); }
    bubble.append(el('div','',text)); $('#chat').append(msg);
    while ($('#chat').children.length>40) { const old=$('#chat').firstElementChild; if (old.dispose) old.dispose(); old.remove(); }
    $('#chat').scrollTop=$('#chat').scrollHeight;
  }
  function send(a) { if (!a) return; append(a.caption||a.name,a); if (a.kind==='fx') effect(a); else if (mode==='full') big(a); else toast('已发送到试玩聊天区'); }
  let fxDispose;
  function clearFx() { clearTimeout(fxTimer); if (fxDispose) fxDispose(); fxDispose = null; const root=$('.fx'); if(root) root.remove(); $('#stop').hidden=true; }
  function effect(a) {
    clearFx(); const root=el('div','fx'); root.append(el('div','word',a.caption));
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches, count=reduced?8:40;
    for(let i=0;i<count;i++){ const p=el('span','particle',a.emoji); p.style.left=Math.random()*96+'vw'; p.style.animationDuration=(2.4+Math.random()*2.8)+'s'; p.style.animationDelay=Math.random()*.6+'s'; p.style.setProperty('--drift',(Math.random()*180-90)+'px'); root.append(p); }
    document.body.append(root); $('#stop').hidden=false; fxTimer=setTimeout(clearFx,6200);
  }
  function big(a) { clearFx(); const root=el('div','fx'), large=el('div','bigasset'); fxDispose=picture(a,large,false); root.append(large,el('div','word low',a.caption||a.name)); document.body.append(root); $('#stop').hidden=false; fxTimer=setTimeout(clearFx,6000); }
  async function getJSON(url, timeout=7000) { const ctrl=new AbortController(), id=setTimeout(()=>ctrl.abort(),timeout); try { const r=await fetch(url,{signal:ctrl.signal,credentials:'omit'}); if(!r.ok) throw Error('HTTP '+r.status); const data=await r.json(); return data; } finally { clearTimeout(id); } }
  async function firstJSON(urls) { let error; for(const u of urls){ try{return await getJSON(u);}catch(e){error=e;} } throw error || Error('无可用来源'); }
  async function loadPlayer() {
    if(window.lottie) return window.lottie; if(libraryPromise) return libraryPromise;
    libraryPromise=(async()=>{ for(const url of ['https://cdn.jsdelivr.net/npm/lottie-web@5.12.2/build/player/lottie_light.min.js','https://unpkg.com/lottie-web@5.12.2/build/player/lottie_light.min.js']) { try{ await new Promise((resolve,reject)=>{ const s=el('script'); const timer=setTimeout(()=>{s.remove();reject(Error('播放器连接超时'));},7000); s.src=url;s.onload=()=>{clearTimeout(timer);resolve();};s.onerror=()=>{clearTimeout(timer);s.remove();reject(Error('播放器加载失败'));};document.head.append(s);}); if(window.lottie)return window.lottie; }catch(_){} } throw Error('Lottie 播放器未能连接'); })();
    try{return await libraryPromise;}catch(e){libraryPromise=null;throw e;}
  }
  function closeDetail(){ detailToken++; if(detailPlayer){detailPlayer.destroy();detailPlayer=null;} if(info.dispose){info.dispose();info.dispose=null;} }
  function info(a) {
    closeDetail(); const token=detailToken; $('#dt').textContent=a.name; const body=$('#db'); body.replaceChildren(); const preview=el('div','preview'); body.append(preview);
    if(a.kind==='fx') preview.append(el('span','fallback',a.emoji)); else info.dispose=picture(a,preview,false);
    [['编号',a.id],['来源',sourceNames[a.source]],['许可',a.license],['形式',a.kind==='fx'?'网页组合特效，不是 Lottie 文件':a.kind==='class'?'原始动画 + 本页中文文案':'原始动态素材']].forEach(x=>body.append(el('p','row',x[0]+'：'+x[1])));
    const links=el('p','row'); links.append(link('来源仓库 ↗',a.origin)); if(a.webp) links.append(document.createTextNode(' · '),link('WebP 原文件 ↗',a.webp)); if(a.lottie) links.append(document.createTextNode(' · '),link('Lottie JSON ↗',a.lottie)); body.append(links);
    if(a.lottie) { const play=button('切换为 Lottie 动画预览',async()=>{play.disabled=true;play.textContent='连接 Lottie…';try{const [player,data]=await Promise.all([loadPlayer(),firstJSON([a.lottie,a.lottieBackup].filter(Boolean))]);if(token!==detailToken)return;if(!Array.isArray(data.layers)||!data.fr||!(data.op>data.ip))throw Error('动画 JSON 无效');if(info.dispose){info.dispose();info.dispose=null;}preview.replaceChildren();detailPlayer=player.loadAnimation({container:preview,renderer:'svg',loop:true,autoplay:true,animationData:data});play.textContent='正在播放 Lottie';}catch(e){if(token!==detailToken)return;play.textContent='连接失败，点此重试';play.disabled=false;toast('Lottie 加载失败；可继续查看 WebP');}});play.className='btn';body.append(play); }
    if(a.source==='telegram'||a.source==='telemoji')body.append(el('p','warn','Telegram 素材仅归档供选型；正式商业使用前核对原始授权。'));
    $('#detail').showModal();
  }
  function applyNoto(data) {
    const records=Array.isArray(data)?data:data.icons; if(!Array.isArray(records))throw Error('Noto 目录格式变化'); let valid=0;
    records.forEach(x=>{const cp=String(x.name||x.codepoint||'').replace(/^emoji_u/,'').replace(/\.json$/,'').toLowerCase();if(!/^[0-9a-f]+(?:_[0-9a-f]+)*$/.test(cp))return;valid++;add(noto(cp,x.title||x.description||(Array.isArray(x.tags)?x.tags.join(' '):'')));});if(!valid)throw Error('Noto 目录为空');return valid;
  }
  function applyTG(data) { let valid=0; Object.keys(data||{}).forEach(emoji=>{const vs=data[emoji];if(!Array.isArray(vs))return;vs.forEach((v,i)=>{if(v.file&&validPath(v.file.webp,'webp','.webp')){telegram(emoji,v.emojiCode,i,v.file);valid++;}});});if(!valid)throw Error('Telegram 目录为空');return valid; }
  function applyTelemoji(data) {if(!Array.isArray(data))throw Error('Telemoji 目录格式变化');let valid=0;data.forEach(x=>{if(!validPath(x.file_webp,'webp','.webp'))return;valid++;const cp=String(x.emoji_code||'').replace(/U\+/g,'').toLowerCase();const base='https://media.githubusercontent.com/media/saeedtahmtan/telemoji/main/';add({id:'tele-'+x.file_webp,name:(cn[cp]||x.emoji||x.emoji_code||'动画')+' · '+(x.variant||1),emoji:x.emoji||'',source:'telemoji',kind:'asset',cp,webp:base+x.file_webp,webpBackup:'https://saeedtahmtan.github.io/telemoji/'+x.file_webp,lottie:validPath(x.file_lottie,'lottie','.json')?'https://raw.githubusercontent.com/saeedtahmtan/telemoji/main/'+x.file_lottie:'',origin:'https://github.com/saeedtahmtan/telemoji',license:'Telegram 原始素材；商业使用范围待核对',featured:false});});if(!valid)throw Error('Telemoji 目录为空');return valid;}
  const feeds=[['noto',['https://googlefonts.github.io/noto-emoji-animation/data/api.json','https://api.github.com/repos/quarrel/noto-emoji-dotlottie/contents/noto-anim-lottie.json?ref=main'],applyNoto],['telegram',['https://raw.githubusercontent.com/ilyhalight/telegram-emoji-effects/master/manifest.json','https://cdn.jsdelivr.net/gh/ilyhalight/telegram-emoji-effects@master/manifest.json'],applyTG],['telemoji',['https://raw.githubusercontent.com/saeedtahmtan/telemoji/main/emojis.json','https://cdn.jsdelivr.net/gh/saeedtahmtan/telemoji@main/emojis.json'],applyTelemoji]];
  function showStates(){ $('#network').textContent=Object.keys(states).map(k=>sourceNames[k]+'：'+states[k]).join(' ｜ '); }
  async function loadCatalog(){ if(loadCatalog.running)return;loadCatalog.running=true;$('#retry').disabled=true;await Promise.all(feeds.map(async([id,urls,apply])=>{states[id]='连接中';showStates();try{const n=apply(await firstJSON(urls));states[id]='目录 '+n+' 条';render();}catch(_){states[id]='连接失败，可重试';}finally{showStates();}}));loadCatalog.running=false;$('#retry').disabled=false; }
  function exportFav(){const selected=Object.keys(fav).map(id=>all.get(id)||fav[id]).filter(x=>x&&x.id);if(!selected.length){toast('先收藏几个喜欢的素材');return;}const data={version:VERSION,createdAt:new Date().toISOString(),note:'目录不是已下载素材；上线前下载原文件、核对授权并测试播放。',selected};const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=el('a');a.href=url;a.download='fenhao-emoji-selection.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  $('#tabs').addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(!b)return;tab=b.dataset.tab;page=1;document.querySelectorAll('#tabs [data-tab]').forEach(x=>x.classList.toggle('on',x===b));render();});
  $('#mode').addEventListener('click',e=>{const b=e.target.closest('[data-mode]');if(!b)return;mode=b.dataset.mode;document.querySelectorAll('#mode button').forEach(x=>x.classList.toggle('on',x===b));});
  $('#search').oninput=()=>{page=1;render();};$('#source').onchange=()=>{page=1;render();};$('#prev').onclick=()=>{page--;render();};$('#next').onclick=()=>{page++;render();};$('#random').onclick=()=>{const a=list();if(a.length)send(a[Math.floor(Math.random()*a.length)]);};
  $('#form').onsubmit=e=>{e.preventDefault();const t=$('#text').value.trim();if(t){append(t);$('#text').value='';}};
  $('#sourceBtn').onclick=()=>$('#sources').showModal();$('#sc').onclick=()=>$('#sources').close();$('#dc').onclick=()=>$('#detail').close();$('#detail').addEventListener('close',closeDetail);$('#stop').onclick=clearFx;document.addEventListener('keydown',e=>{if(e.key==='Escape')clearFx();});
  $('#retry').onclick=loadCatalog;$('#export').onclick=exportFav;$('#jumpChat').onclick=()=>$('#chatPanel').scrollIntoView({behavior:'smooth',block:'center'});
  render();showStates();$('#boot').textContent='修复版 '+VERSION+' · 程序已启动';window.__emojiLab={version:VERSION,get catalogCount(){return all.size;},get sourceStates(){return Object.assign({},states);}};loadCatalog();
})();
