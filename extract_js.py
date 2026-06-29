// Extract JS from index.html and check it
var fs = require('fs');
var content = fs.readFileSync('index.html', 'utf-8');
var scriptMatch = content.match(/<script>"use strict";([\s\S]*?)<\/script>/);
if (!scriptMatch) {
  // Try without "use strict"
  scriptMatch = content.match(/<script>([\s\S]*?)<\/script>/);
}
if (scriptMatch) {
  var js = '"use strict";' + scriptMatch[1];
  fs.writeFileSync('test_check.js', js);
  console.log('JS extracted, length:', js.length);
} else {
  console.log('ERROR: no script found');
}
