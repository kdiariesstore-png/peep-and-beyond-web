const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({viewport:{width:1120,height:800}});
  await p.goto('file://' + process.argv[2]); await p.screenshot({path: process.argv[3], fullPage: true}); await b.close();
})();
