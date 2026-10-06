const {spawnSync}=require('node:child_process');
const path=require('node:path');
const suites=['creator-art','creator-review','creator-interaction','creator-variants','creator-variants-review'];
for(const name of suites){
  const result=spawnSync(process.execPath,[path.join(__dirname,'qa',name+'.cjs')],{stdio:'inherit'});
  if(result.error){console.error(result.error.message);process.exit(1);}
  if(result.status!==0)process.exit(result.status||1);
}
console.log('All five creator check suites passed.');
