const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const m = html.match(/<script>([\s\S]*?)<\/script>/);
if (!m) {
  console.log('FAIL: no script block found');
  process.exit(1);
}
try {
  new Function(m[1]);
  console.log('OK: JS syntax valid (' + m[1].length + ' chars)');
} catch(e) {
  console.log('FAIL: ' + e.message);
  process.exit(1);
}

// Verify specific fix - label syntax replaced with assignments
const js = m[1];
if (js.indexOf('rw=10+Math.floor(day%5)*2') >= 0) {
  console.log('OK: boss daily quest rw assignment fixed');
} else {
  console.log('WARN: boss daily quest rw assignment not found');
}
if (js.indexOf('rw=8+Math.floor(day%4)') >= 0) {
  console.log('OK: upgrade daily quest rw assignment fixed');
} else {
  console.log('WARN: upgrade daily quest rw assignment not found');
}
if (js.indexOf('tgt=5+Math.floor(day%4)') >= 0) {
  console.log('OK: combo daily quest tgt assignment fixed');
} else {
  console.log('WARN: combo daily quest tgt assignment not found');
}
if (js.indexOf('rw=5+Math.floor(day%3)') >= 0) {
  console.log('OK: combo daily quest rw assignment fixed');
} else {
  console.log('WARN: combo daily quest rw assignment not found');
}
console.log('All validation checks done.');
