"""Download selected upstream animations, verify frames, and keep small WebP copies.
This script writes ONLY inside emoji-special/assets and emoji-special/vendor.
"""
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import quote
from concurrent.futures import ThreadPoolExecutor
from PIL import Image, ImageSequence, ImageDraw
import io, json, time, hashlib
ROOT = Path(__file__).resolve().parent
ASSETS = ROOT / 'assets'; ASSETS.mkdir(exist_ok=True)
VENDOR = ROOT / 'vendor'; VENDOR.mkdir(exist_ok=True)
def get(url):
    for attempt in range(3):
        try:
            with urlopen(Request(url, headers={'User-Agent':'Fenhao-Emoji-Special/1.0'}), timeout=40) as r:
                data = r.read(25_000_001)
                if len(data)>25_000_000: raise ValueError('oversized response')
                return data
        except Exception:
            if attempt==2: raise
            time.sleep(attempt+1)
def tree(repo, ref):
    d=json.loads(get('https://api.github.com/repos/'+repo+'/git/trees/'+ref+'?recursive=1'))
    assert not d.get('truncated'), 'incomplete tree'
    return d['sha'], [x['path'] for x in d['tree'] if x['type']=='blob']
ms='microsoft/fluentui-emoji-animated'; par='jmhobbs/cultofthepartyparrot.com'
msref,mstree=tree(ms,'main'); pref,ptree=tree(par,'main')
msdefs=[('Exploding head','脑子炸了','这个知识点有点猛'),('Melting face','原地融化','听着听着人化了'),('Face with spiral eyes','脑子转圈','信息量有点大'),('Zany face','放飞自我','今天主打一个搞怪'),('Upside-down face','倒着思考','换个角度想想'),('Ghost','我又出现了','潜水同学冒个泡'),('Alien monster','小怪兽上线','今天也要打怪升级'),('See-no-evil monkey','不敢看答案','先别揭晓答案'),('Face with peeking eye','偷偷看一眼','到底选什么'),('Loudly crying face','被难哭了','这题真的有点难'),('Rolling on the floor laughing','笑到打滚','这个解释有画面了'),('Face screaming in fear','震惊全班','原来还能这么答')]
pardefs=[('hd/moonwalkingparrot.gif','太空步','这题我先溜了'),('hd/dealwithitparrot.gif','墨镜一戴','答案我心里有数'),('hd/confusedparrot.gif','歪头迷惑','你再说一遍'),('hd/coffeeparrot.gif','喝口咖啡','让我缓一缓'),('hd/popcornparrot.gif','吃瓜围观','前排认真围观'),('hd/sleepingparrot.gif','困到变形','老师我还撑得住'),('hd/scienceparrot.gif','科学怪鸟','开始认真研究'),('hd/congaparrot.gif','排队摇摆','全班一起动起来')]
jobs=[]
for i,(folder,name,caption) in enumerate(msdefs):
    matches=[p for p in mstree if p.startswith('assets/'+folder+'/') and p.endswith('.png') and '/animated/' in p]
    if not matches: raise ValueError('Missing upstream folder '+folder)
    path=sorted(matches)[0]
    jobs.append({'id':'ms-'+str(i),'name':name,'caption':caption,'group':'fluent','repo':ms,'ref':msref,'path':path,'license':'MIT · Microsoft','url':'https://media.githubusercontent.com/media/'+ms+'/main/'+quote(path,safe='/')})
for i,(p,name,caption) in enumerate(pardefs):
    path='parrots/'+p
    assert path in ptree, path
    jobs.append({'id':'parrot-'+str(i),'name':name,'caption':caption,'group':'parrot','repo':par,'ref':pref,'path':path,'license':'素材许可混合，商用逐项核对','url':'https://raw.githubusercontent.com/'+par+'/'+pref+'/'+path})
def convert(a):
    raw=get(a['url']); im=Image.open(io.BytesIO(raw))
    assert getattr(im,'n_frames',1)>1, a['id']+' is not animated'
    frames=[]; durations=[]; original=im.size
    start=1 if im.info.get('default_image') else 0
    for i in range(start,im.n_frames):
        im.seek(i)
        frame=im.convert('RGBA'); frame.thumbnail((256,256),Image.Resampling.LANCZOS)
        frames.append(frame.copy()); durations.append(max(20,round(im.info.get('duration',80))))
    # Cap to about 20 fps while retaining the full timeline and loop.
    ff=[]; dd=[]; elapsed=0
    for f,d in zip(frames,durations):
        if not ff or elapsed>=50:
            ff.append(f); dd.append(d); elapsed=d
        else:
            dd[-1]+=d; elapsed+=d
    out=ASSETS/(a['id']+'.webp')
    ff[0].save(out,format='WEBP',save_all=True,append_images=ff[1:],duration=dd,loop=0,quality=84,method=4)
    chk=Image.open(out); assert chk.n_frames>1
    poster=ff[min(len(ff)-1,len(ff)//3)]; poster.save(ASSETS/(a['id']+'.png'))
    a.update({'src':'assets/'+out.name,'poster':'assets/'+a['id']+'.png','frames':chk.n_frames,'bytes':out.stat().st_size,'width':chk.width,'height':chk.height,'source_bytes':len(raw),'source_dimensions':list(original),'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'source':'https://github.com/'+a['repo']+'/blob/'+('main' if a['group']=='fluent' else a['ref'])+'/'+quote(a['path'],safe='/'),'format':'Animated WebP'})
    return a
with ThreadPoolExecutor(max_workers=3) as pool: items=list(pool.map(convert,jobs))
for repo,key in [(ms,'microsoft'),(par,'party-parrot')]:
    (ASSETS/(key+'-LICENSE.txt')).write_bytes(get('https://raw.githubusercontent.com/'+repo+'/main/LICENSE'))
libs=[('canvas-confetti@1.9.3/dist/confetti.browser.min.js','confetti.js'),('fireworks-js@2.10.8/dist/index.umd.js','fireworks.js'),('lottie-web@5.13.0/build/player/lottie_svg.min.js','lottie.js'),('canvas-confetti@1.9.3/LICENSE','confetti-LICENSE.txt'),('fireworks-js@2.10.8/LICENSE','fireworks-LICENSE.txt'),('lottie-web@5.13.0/LICENSE.md','lottie-LICENSE.txt')]
for suffix,name in libs:
    try: data=get('https://cdn.jsdelivr.net/npm/'+suffix)
    except Exception: data=get('https://unpkg.com/'+suffix)
    (VENDOR/name).write_bytes(data)
manifest={'version':'20260922-special1','items':items,'upstream_trees':{ms:msref,par:pref},'count':len(items),'bytes':sum(a['bytes'] for a in items)}
(ASSETS/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
(ROOT/'assets.js').write_text('window.SPECIAL_ASSETS = '+json.dumps(manifest,ensure_ascii=False)+';\n')
# Contact sheet for visual review; not a substitute for animation checks.
w=1000; sheet=Image.new('RGB',(w,5*225),'#edf1ea'); draw=ImageDraw.Draw(sheet)
for i,a in enumerate(items):
    p=Image.open(ASSETS/(a['id']+'.png')).convert('RGBA'); p.thumbnail((170,180))
    x=(i%4)*250+(250-p.width)//2; y=(i//4)*225
    sheet.paste(p,(x,y),p); draw.text(((i%4)*250+12,y+190),a['id']+' | '+str(a['frames'])+' frames',fill='#1b3530')
sheet.save(ASSETS/'contact-sheet.jpg')
print(json.dumps({'count':len(items),'total_webp_bytes':manifest['bytes'],'items':[{k:a[k] for k in ['id','name','frames','bytes','source_dimensions']} for a in items]},ensure_ascii=False))
