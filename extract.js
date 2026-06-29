var fs=require('fs');
var content=fs.readFileSync('index.html','utf8');
var m=content.match(/<script>([\s\S]*?)<\/script>/);
if(m){
  fs.writeFileSync('test_game.js',m[1]);
  console.log('Extracted',m[1].length,'chars of JS');
} else {
  console.log('no script found');
}
