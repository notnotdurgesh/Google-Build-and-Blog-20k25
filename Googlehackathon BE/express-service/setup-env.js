const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setup() {
  console.log('🔧 Firestore Environment Setup Helper\n');

  const projectId = await question('Enter your Google Cloud Project ID: ');
  const useServiceAccount = await question('Do you have a service account key JSON file? (y/n): ');

  let envContent = `# Environment Variables for Firestore Service
PORT=3000
GOOGLE_CLOUD_PROJECT=${projectId}
`;

  if (useServiceAccount.toLowerCase() === 'y') {
    const keyPath = await question('Enter the path to your service account key JSON file: ');
    envContent += `GOOGLE_APPLICATION_CREDENTIALS="${keyPath}"\n`;
  } else {
    console.log('\n📝 You chose not to use a service account key.');
    console.log('Make sure to run: gcloud auth application-default login');
    console.log('And ensure you have the Google Cloud CLI installed.\n');
  }

  const envPath = path.join(__dirname, '.env');
  fs.writeFileSync(envPath, envContent);

  console.log('✅ .env file created successfully!');
  console.log('📄 File contents:');
  console.log(envContent);
  console.log('\n🚀 Next steps:');
  console.log('1. Run: node test.js (to verify setup)');
  console.log('2. Run: yarn start (to start the server)');

  rl.close();
}

setup().catch(console.error);
