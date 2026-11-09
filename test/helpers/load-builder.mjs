import fs from 'node:fs';
export function loadBuilderHTML(){
  const base=new URL('../../',import.meta.url);
  return fs.readFileSync(new URL('index.html',base),'utf8').replace(/<script src="([^"\:]+\.js)(?:\?[^"\s]*)?"><\/script>/g,(_,file)=>'<script>'+fs.readFileSync(new URL(file,base),'utf8')+'</script>');
}
