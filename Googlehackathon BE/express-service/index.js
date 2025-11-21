const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const FASTAPI_URL = process.env.FASTAPI_URL || 'http://127.0.0.1:8000';
// Middleware
app.use(cors());
app.use(express.json());

try {
  admin.initializeApp({
    credential: admin.credential.applicationDefault()
  });
  console.log('Firebase Admin Initialized');
} catch (error) {
  console.error('Firebase Admin Initialization Error:', error);
}

const db = admin.firestore();
const COLLECTION_NAME = 'all_beats'; // Default collection name, can be changed
const PRESETS_COLLECTION = 'public_beats'; // Collection for public beats/presets

// Routes

// ============= PRESET/BEAT MANAGEMENT ROUTES =============

// Get all public beats/presets
app.get('/api/presets', async (req, res) => {
  try {
    const snapshot = await db.collection(PRESETS_COLLECTION)
      .orderBy('createdAt', 'desc')
      .get();

    if (snapshot.empty) {
      return res.status(200).json([]);
    }

    const presets = [];
    snapshot.forEach(doc => {
      presets.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.status(200).json(presets);
  } catch (error) {
    console.error('Error getting presets:', error);
    res.status(500).json({ error: 'Failed to fetch presets' });
  }
});

// Get current/latest preset
app.get('/api/presets/current', async (req, res) => {
  try {
    const snapshot = await db.collection(PRESETS_COLLECTION)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(200).json(null);
    }

    const doc = snapshot.docs[0];
    res.status(200).json({
      id: doc.id,
      ...doc.data()
    });
  } catch (error) {
    console.error('Error getting current preset:', error);
    res.status(500).json({ error: 'Failed to fetch current preset' });
  }
});

// Create/Save a new preset
app.post('/api/presets', async (req, res) => {
  try {
    const { name, description, bpm, stepCount, tracks } = req.body;

    // Validate required fields
    if (!name || !description || !bpm || !stepCount || !tracks) {
      return res.status(400).json({
        error: 'Missing required fields: name, description, bpm, stepCount, tracks'
      });
    }

    // Validate data types
    if (typeof name !== 'string' || typeof description !== 'string') {
      return res.status(400).json({ error: 'Name and description must be strings' });
    }

    if (typeof bpm !== 'number' || typeof stepCount !== 'number') {
      return res.status(400).json({ error: 'BPM and stepCount must be numbers' });
    }

    if (!Array.isArray(tracks)) {
      return res.status(400).json({ error: 'Tracks must be an array' });
    }

    const presetData = {
      name,
      description,
      bpm,
      stepCount,
      tracks,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection(PRESETS_COLLECTION).add(presetData);

    res.status(201).json({
      message: 'Preset saved successfully',
      id: docRef.id,
      preset: {
        id: docRef.id,
        ...presetData,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error saving preset:', error);
    res.status(500).json({ error: 'Failed to save preset' });
  }
});

// Delete a preset
app.delete('/api/presets/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Preset ID is required' });
    }

    await db.collection(PRESETS_COLLECTION).doc(id).delete();

    res.status(200).json({
      message: 'Preset deleted successfully',
      id
    });
  } catch (error) {
    console.error('Error deleting preset:', error);
    res.status(500).json({ error: 'Failed to delete preset' });
  }
});

// ============= END PRESET ROUTES =============

// Save data to Firestore
app.post('/api/save', async (req, res) => {
  try {
    const data = req.body;
    if (!data || Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'No data provided' });
    }

    // Add a timestamp
    const docData = {
      ...data,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection(COLLECTION_NAME).add(docData);
    
    res.status(201).json({ 
      message: 'Data saved successfully', 
      id: docRef.id 
    });
  } catch (error) {
    console.error('Error saving document:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get all data from Firestore
app.get('/api/data', async (req, res) => {
  try {
    const snapshot = await db.collection(COLLECTION_NAME).get();
    
    if (snapshot.empty) {
      return res.status(200).json([]);
    }

    const data = [];
    snapshot.forEach(doc => {
      data.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.status(200).json(data);
  } catch (error) {
    console.error('Error getting documents:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Helper function to extract JSON from markdown code blocks
function extractJsonFromText(text) {
  if (!text) return null;

  // Try to extract JSON from markdown code blocks (```json ... ``` or ```JSON ... ```)
  // Case-insensitive, handles optional spaces/newlines after json/JSON
  const jsonBlockRegex = /```(?:json|JSON)\s*([\s\S]*?)\s*```/gi;
  const matches = [...text.matchAll(jsonBlockRegex)];

  if (matches.length > 0) {
    // Get the longest/most complete JSON block
    let longestJson = '';
    let longestLength = 0;

    for (const match of matches) {
      if (match[1] && match[1].length > longestLength) {
        longestJson = match[1];
        longestLength = match[1].length;
      }
    }

    if (longestJson) {
      try {
        const parsed = JSON.parse(longestJson);
        console.log('Successfully parsed JSON with', longestJson.length, 'characters');
        return parsed;
      } catch (e) {
        console.error('Failed to parse JSON:', e.message);
        console.error('JSON was', longestJson.length, 'characters');

        // Check if JSON looks incomplete (common signs)
        if (longestJson.includes('false, false, false, false') ||
            !longestJson.trim().endsWith('}') ||
            longestJson.includes('"name, false')) {
          console.error('JSON appears to be incomplete/truncated (possibly hit token limit)');
        }
        return null;
      }
    }
  }

  // Try to parse the entire text as JSON
  try {
    return JSON.parse(text);
  } catch (e) {
    // Not valid JSON
    return null;
  }
}

// Helper function to extract generated JSON from Gemini response
function extractGeneratedJson(responseData) {
  try {
    // The actual structure from FastAPI is: { response: [{ content: { parts: [...] } }] }
    // Navigate directly to response.response array
    
    console.log('Attempting to extract JSON from response... ... ');
    console.log(responseData[0]?.content);

    // Get the FIRST response item (not last)
    const firstResponse = responseData[0]

    const parts = firstResponse.content.parts;
    console.log(`Found ${parts.length} parts in response`);

    // Try each part to find JSON (loop through ALL parts, not just first)
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (part && part.text) {
        console.log(`Checking part ${i} for JSON...`);
        const extractedJson = extractJsonFromText(part.text);
        if (extractedJson) {
          console.log('Successfully extracted JSON from part', i);
          return extractedJson;
        }
      }
    }

    console.log('No JSON found in any parts');
    return null;
  } catch (error) {
    console.error('Error extracting JSON:', error);
    return null;
  }
}

app.post('/api/llm', async (req, res) => {
  try {
    const { userId, sessionId, messages } = req.body;

    // Ensure messages is an array and has at least one message
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required and cannot be empty' });
    }

    // Get the last message (the newest one) to match the "newMessage" format
    const lastMessage = messages[messages.length - 1];

    // Construct the payload EXACTLY like your working Postman JSON
    const payload = {
      appName: "multi_tool_agent",
      userId: userId,
      sessionId: sessionId,
      newMessage: {  // CHANGED: API expects 'newMessage', not 'messages'
        role: lastMessage.role,
        parts: [{
          text: lastMessage.text
        }]
      }
    };

    // CHANGED: Pass 'payload' directly. Do NOT wrap it in { body }
    const response = await axios.post(`${FASTAPI_URL}/run`, payload);

    // Extract generated JSON from the response
    const generatedJson = extractGeneratedJson(response.data);

    // Return both the original response and the extracted JSON
    res.status(200).json({
      response: response.data,
      generatedJson: generatedJson,
      hasGeneratedJson: !!generatedJson
    });
  } catch (error) {
    // Log the detailed error from the Python backend if available
    if (error.response) {
        console.error('Python Backend Error:', JSON.stringify(error.response.data, null, 2));
        return res.status(error.response.status).json(error.response.data);
    }
    console.error('Error generating response:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/create-session', async (req, res) => {
  try {
    const { userId, sessionId } = req.body;
    const response = await axios.post(`${FASTAPI_URL}/apps/multi_tool_agent/users/${userId}/sessions/${sessionId}`);
    res.status(200).json({ response: response.data });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.listen(port, () => {
  console.log(`Express service listening on port ${port}`);
});

