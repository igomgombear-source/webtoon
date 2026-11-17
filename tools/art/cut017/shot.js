const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:810}});
await p.goto('file://'+process.argv[2]+'/index.html');await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(800);
const ok=await p.evaluate(()=>document.fonts.check('96px "Nanum Pen Script"','합창제 리허설 강당 토'));console.log('font',ok);
await p.screenshot({path:process.argv[2]+'/out.png'});await b.close();})();
