/* Browser checks and deterministic answer-frame export. No production services are accessed. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {spawn}=require('node:child_process');
const {createHash}=require('node:crypto');
const ROOT=path.join(process.env.GITHUB_WORKSPACE||process.cwd(),'emoji-special');
const OUT=process.env.QA_REPORT||path.join(ROOT,'qa-report');
fs.mkdirSync(OUT,{recursive:true});
const report={version:'20260922-special1',mocked:false,started:new Date().toISOString(),checks:[],effects:[]};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const digest=b=>createHash('sha256').update(b).digest('hex');
let browser,server;
(async()=>{
try{
 browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 if(process.env.PUBLIC_CHECK){
  const base='https://muzi2023.github.io/jiaozichaxun/emoji-special/';
  let ready=false;
  for(let i=0;i<20;i++){
   try{const r=await fetch(base+'answers/answer-comic-A.webp?qa='+Date.now(),{signal:AbortSignal.timeout(15000)});if(r.ok){ready=true;break;}}catch(_){}
   await wait(8000);
  }
  assert(ready,'Published answer files were not ready');
  await page.goto(base+'?v=20260922-special1',{waitUntil:'networkidle'});
  await page.waitForFunction(()=>window.__special?.assets===20);
  await page.locator('#gallery img').evaluateAll(imgs=>imgs.forEach(x=>x.loading='eager'));
  await page.waitForFunction(()=>[...document.querySelectorAll('#gallery img')].every(x=>x.complete&&x.naturalWidth>0));
  await page.locator('[data-send="ms-0"]').click();
  assert.equal(await page.locator('#chat .message:not(.sys)').count(),1);
  await page.screenshot({path:path.join(OUT,'published-desktop.png'),fullPage:true});
  await page.setViewportSize({width:390,height:844});
  await page.locator('[data-tab="answers"]').click();
  await page.locator('[data-send="answer-sign-D"]').click();
  assert(await page.locator('body').evaluate(x=>x.classList.contains('chat-open')));
  await page.waitForFunction(()=>document.querySelector('#chat .answer-art svg path'));
  await page.screenshot({path:path.join(OUT,'published-mobile-chat.png')});
  await page.locator('#closeChat').click();
  await page.screenshot({path:path.join(OUT,'published-mobile-answers.png'),fullPage:true});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  for(const file of ['assets/ms-0.webp','assets/parrot-0.webp','answers/answer-comic-A.webp','answers/answer-sign-D.webp']){
    const r=await fetch(base+file);assert(r.ok);const b=Buffer.from(await r.arrayBuffer());assert.equal(b.subarray(8,12).toString(),'WEBP');assert(b.includes(Buffer.from('ANIM')));
  }
  report.checks.push('Published page loaded all 20 real WebP assets','Published desktop chat send','390px published ABCD chat send','Published WebP files contain animation data');
  report.published=true;
 }else{
  server=spawn('python3',['-m','http.server','8768','--bind','127.0.0.1','--directory',ROOT],{stdio:'ignore'});
  await wait(1200);
  await page.goto('http://127.0.0.1:8768/',{waitUntil:'networkidle'});
  await page.waitForFunction(()=>window.__special?.count===40);
  await page.locator('#gallery img').evaluateAll(imgs=>imgs.forEach(x=>x.loading='eager'));
  await page.waitForFunction(()=>[...document.querySelectorAll('#gallery img')].every(x=>x.complete&&x.naturalWidth>0));
  assert.equal(await page.locator('#gallery img').count(),20);
  const manifest=JSON.parse(fs.readFileSync(path.join(ROOT,'assets/manifest.json'),'utf8'));
  for(const a of manifest.items){const bytes=fs.readFileSync(path.join(ROOT,a.src));assert.equal(digest(bytes),a.sha256);assert(bytes.includes(Buffer.from('ANIM')));assert(a.frames>1);}
  for(const a of manifest.items)await page.locator('[data-send="'+a.id+'"]').click();
  assert.equal(await page.locator('#chat .message:not(.sys)').count(),20);
  report.checks.push('20 source-backed WebP files pass frame/header/hash validation','All 20 sticker buttons send chat messages');
  await page.locator('[data-fav="ms-0"]').click();assert.equal(await page.locator('#favCount').innerText(),'1');
  const dl=page.waitForEvent('download');await page.locator('#export').click();await(await dl).saveAs(path.join(OUT,'selection.json'));
  assert.equal(JSON.parse(fs.readFileSync(path.join(OUT,'selection.json'))).items[0].id,'ms-0');
  report.checks.push('Favorite and actual manifest download');
  await page.screenshot({path:path.join(OUT,'desktop.png'),fullPage:true});
  await page.locator('[data-tab="answers"]').click();
  assert.equal(await page.locator('#gallery .tile').count(),12);
  await page.waitForFunction(()=>document.querySelectorAll('#gallery svg path').length>80);
  await page.screenshot({path:path.join(OUT,'answers.png'),fullPage:true});
  // Render each original Lottie at fixed timeline positions into transparent PNGs.
  const answerDefs=await page.evaluate(()=>SpecialLab.answers.map(a=>({id:a.id,data:SpecialLab.lottieFor(a)})));
  const frameRoot=path.join(OUT,'frames');fs.mkdirSync(frameRoot,{recursive:true});
  fs.mkdirSync(path.join(ROOT,'answers'),{recursive:true});
  for(const answer of answerDefs){
   fs.writeFileSync(path.join(ROOT,'answers',answer.id+'.json'),JSON.stringify(answer.data));
   const frames=await page.evaluate(async data=>{
    const host=document.createElement('div');host.style.cssText='width:256px;height:256px;position:fixed;left:0;top:0;z-index:999;background:transparent';document.body.append(host);
    const anim=lottie.loadAnimation({container:host,renderer:'svg',loop:false,autoplay:false,animationData:data});
    await new Promise(resolve=>anim.isLoaded?resolve():anim.addEventListener('DOMLoaded',resolve));
    const result=[];
    for(let frame=0;frame<60;frame+=3){
     anim.goToAndStop(frame,true);
     const svg=host.querySelector('svg').cloneNode(true);svg.setAttribute('width','256');svg.setAttribute('height','256');svg.style.width='256px';svg.style.height='256px';
     const text=new XMLSerializer().serializeToString(svg);
     const img=new Image();const src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(text);
     await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=src;});
     const c=document.createElement('canvas');c.width=256;c.height=256;c.getContext('2d').drawImage(img,0,0,256,256);result.push(c.toDataURL('image/png').split(',')[1]);
    }
    anim.destroy();host.remove();return result;
   },answer.data);
   assert(new Set(frames).size>3,answer.id+' must really animate');
   const folder=path.join(frameRoot,answer.id);fs.mkdirSync(folder,{recursive:true});frames.forEach((f,i)=>fs.writeFileSync(path.join(folder,String(i).padStart(2,'0')+'.png'),Buffer.from(f,'base64')));
  }
  report.checks.push('All 12 original ABCD Lotties render and visibly change across 20 sampled frames');
  await page.locator('[data-tab="effects"]').click();
  for(const key of ['cannon','fireworks','gold','heart','stars','warp','shock','parade']){
   await page.locator('[data-send="fx-'+key+'"]').click();await wait(key==='fireworks'?2200:1000);
   assert.equal(await page.evaluate(()=>window.__special.activeEffect),'fx-'+key);
   const pixels=await page.evaluate(()=>{const c=document.querySelector('#fxVisual canvas');const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0;for(let i=3;i<d.length;i+=4)if(d[i])n++;return n;});
   assert(pixels>20,key+' canvas must not be empty');
   await page.screenshot({path:path.join(OUT,'effect-'+key+'.png')});
   report.effects.push({key,nontransparentPixels:pixels});
   await page.locator('#stopFx').click();assert.equal(await page.evaluate(()=>window.__special.activeEffect),null);
  }
  report.checks.push('All 8 fullscreen effects draw visible particles or rings and stop correctly');
  await page.setViewportSize({width:390,height:844});
  await page.locator('[data-tab="answers"]').click();
  await page.locator('[data-send="answer-comic-A"]').click();
  assert(await page.locator('body').evaluate(x=>x.classList.contains('chat-open')));
  await page.screenshot({path:path.join(OUT,'mobile-chat.png')});
  await page.locator('#closeChat').click();
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:path.join(OUT,'mobile.png'),fullPage:true});
  report.checks.push('390px mobile layout and automatic chat sheet');
 }
 assert.deepEqual(errors,[]);report.pageErrors=errors;report.passed=true;
}catch(e){report.passed=false;report.error=String(e);process.exitCode=1;}
finally{if(browser)await browser.close();if(server)server.kill();fs.writeFileSync(path.join(OUT,process.env.PUBLIC_CHECK?'published-result.json':'result.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));}
})();
