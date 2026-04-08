const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

async function testUri(label, uri) {
  if (!uri) {
    console.log(`${label}:SKIPPED`);
    return;
  }

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
    console.log(`${label}:SUCCESS`);
  } catch (error) {
    console.log(`${label}:FAIL`);
    console.log(error.message);
  } finally {
    try {
      await mongoose.disconnect();
    } catch (disconnectError) {
      // no-op
    }
  }
}

async function main() {
  const srvUri = process.argv[2] || process.env.MONGODB_URI;
  const nonSrvUri = process.argv[3] || process.env.MONGODB_URI_FALLBACK;

  await testUri('MONGO_TEST:SRV', srvUri);
  await testUri('MONGO_TEST:NONSRV', nonSrvUri);

  process.exit(0);
}

main().catch((error) => {
  console.error('MONGO_TEST:UNEXPECTED_FAIL');
  console.error(error.message);
  process.exit(1);
});
