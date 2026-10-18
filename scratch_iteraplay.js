import axios from 'axios';

async function test() {
  const res = await axios.get('https://iteraplay.com/_next/static/chunks/app/page-4a875d26cc74870b.js');
  const text = res.data;
  const matches = text.match(/[a-zA-Z0-9_$]+\s*=\s*["']https?:\/\/[^"']+["']/g);
  console.log('Constants:', matches);
}
test();
