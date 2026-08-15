import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const dirPath = path.join(process.cwd(), 'public', 'videos');

if (fs.existsSync(dirPath)) {
  const files = fs.readdirSync(dirPath);
  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const data = fs.readFileSync(filePath);
    const hash = crypto.createHash('md5').update(data).digest('hex');
    console.log(`- ${file}: MD5 = ${hash} | Size = ${data.length} bytes`);
  });
} else {
  console.log('Directory does not exist');
}
