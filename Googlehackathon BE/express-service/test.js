// Test script to verify Firestore connection
require('dotenv').config();
const admin = require('firebase-admin');

async function testFirestore() {
  try {
    // Initialize Firebase Admin
    admin.initializeApp({
      credential: admin.credential.applicationDefault()
    });
    console.log('✓ Firebase Admin initialized successfully');

    const db = admin.firestore();

    // Test write operation
    const testDoc = {
      test: true,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      message: "Test document from setup verification"
    };

    const docRef = await db.collection('all_beats').add(testDoc);
    console.log('✓ Test document written successfully with ID:', docRef.id);

    // Test read operation
    const snapshot = await db.collection('all_beats').get();
    console.log('✓ Collection contains', snapshot.size, 'documents');

    // Clean up test document
    await docRef.delete();
    console.log('✓ Test document cleaned up');

    console.log('\n🎉 Firestore setup is working correctly!');
    console.log('You can now start your Express server with: yarn start');

  } catch (error) {
    console.error('❌ Firestore setup error:', error.message);
    console.log('\n🔧 Please check your setup:');
    console.log('1. Make sure you have a .env file with GOOGLE_CLOUD_PROJECT set');
    console.log('2. Ensure your authentication method is properly configured');
    console.log('3. Check that Firestore API is enabled in your Google Cloud project');
  } finally {
    process.exit();
  }
}

testFirestore();
