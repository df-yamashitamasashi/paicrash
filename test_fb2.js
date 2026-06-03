const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get } = require('firebase/database');
const app = initializeApp({ databaseURL: 'https://paicrash-94d0a-default-rtdb.asia-southeast1.firebasedatabase.app/' });
const db = getDatabase(app);
async function run() {
  try {
    await get(ref(db, '.info/connected'));
    console.log('get OK');
  } catch (e) {
    console.log('Error:', e.message);
  }
  process.exit(0);
}
run();
