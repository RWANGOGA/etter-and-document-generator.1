'use server';

// This should be the URL of your Python FastAPI backend.
// Locally: http://localhost:8000 (or whatever port your FastAPI runs on)
// On Render: The public URL of your Python web service
const BACKEND_URL = process.env.FASTAPI_BACKEND_URL || 'http://localhost:8001';

export async function generateLetterContent(
  prompt: string,
  mode: 'generate' | 'polish' | 'fix-grammar' | 'generate-document' | 'continue',
  currentText?: string
) {
  try {
    // We forward the request directly to your Python FastAPI backend
    const response = await fetch(`${BACKEND_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        notes: prompt,               // Maps to 'notes' in Python
        mode: mode,                  // Maps to 'mode' in Python
        existing_text: currentText || '', // Maps to 'existing_text' in Python
      }),
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status ${response.status}`);
    }

    const data = await response.json();

    // The Python backend returns { success: boolean, text: string }
    if (data.success) {
      return { success: true, text: data.text };
    } else {
      return { success: false, text: data.text || "An error occurred on the backend." };
    }

  } catch (error: any) {
    console.error("❌ Error calling FastAPI backend:", error);
    return { 
      success: false, 
      text: "Could not connect to the AI server. Please ensure the backend is running." 
    };
  }
}