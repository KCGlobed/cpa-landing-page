const fs = require('fs');

const html = fs.readFileSync('dev_out.html', 'utf8');

// Remove all script tags
let processed = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

// Remove existing Next.js stylesheets
processed = processed.replace(/<link[^>]+rel="stylesheet"[^>]*>/gi, '');

// Inject our stylesheet in the head
processed = processed.replace('</head>', '\n<link rel="stylesheet" href="kcglobed-home.css">\n</head>');

// Replace next.js internal links that might use _next/image with their direct source
// (Actually Next.js dev server already renders absolute or direct relative paths, but we keep them as is for now)

fs.writeFileSync('Home.html', processed);
console.log('Successfully processed dev_out.html and created Home.html');
