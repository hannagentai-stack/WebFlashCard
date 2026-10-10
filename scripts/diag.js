import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

console.log('1 node', process.version);
const D = require('better-sqlite3');
console.log('2 require sqlite ok');
const db = new D(':memory:');
console.log('3 open sqlite ok', db.prepare('select sqlite_version() v').get());

// bcryptjs check
const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('diag_test_password', 8);
console.log('3.5 bcryptjs hash ok', hash.substring(0, 10));

console.log('4 done');
