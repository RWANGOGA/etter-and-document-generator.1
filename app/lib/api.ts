/**
 * API wrapper for LetDoc backend
 * Handles all HTTP requests to the FastAPI backend
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface DocumentRecord {
  id: string;
  type: 'letter' | 'freeform';
  title: string;
  content: {
    kind: 'freeform' | 'letter';
    html: string;
    watermark?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface DocumentCreateRequest {
  type: 'letter' | 'freeform';
  title: string;
  content?: {
    kind: 'freeform' | 'letter';
    html: string;
    watermark?: string;
  };
}

export interface DocumentUpdateRequest {
  title?: string;
  content?: {
    kind: 'freeform' | 'letter';
    html: string;
    watermark?: string;
  };
  watermark?: string;
}

export interface GenerateRequest {
  prompt: string;
  mode: 'generate' | 'polish' | 'fix-grammar' | 'generate-document' | 'continue';
  currentText?: string;
}

export interface GenerateResponse {
  success: boolean;
  text?: string;
  error?: string;
}

export interface DocumentListResponse {
  total: number;
  items: DocumentRecord[];
}

/**
 * API client for documents endpoints
 */
export const api = {
  /**
   * List all documents (paginated)
   */
  documents: {
    list: async (skip = 0, limit = 20): Promise<DocumentListResponse> => {
      const response = await fetch(
        `${API_URL}/api/documents?skip=${skip}&limit=${limit}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );
      if (!response.ok) throw new Error(`Failed to list documents: ${response.statusText}`);
      return response.json();
    },

    /**
     * Get a single document
     */
    get: async (id: string): Promise<DocumentRecord> => {
      const response = await fetch(`${API_URL}/api/documents/${id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(`Failed to get document: ${response.statusText}`);
      return response.json();
    },

    /**
     * Create a new document
     */
    create: async (doc: DocumentCreateRequest): Promise<DocumentRecord> => {
      const response = await fetch(`${API_URL}/api/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doc),
      });
      if (!response.ok) throw new Error(`Failed to create document: ${response.statusText}`);
      return response.json();
    },

    /**
     * Update a document
     */
    update: async (id: string, doc: DocumentUpdateRequest): Promise<DocumentRecord> => {
      const response = await fetch(`${API_URL}/api/documents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doc),
      });
      if (!response.ok) throw new Error(`Failed to update document: ${response.statusText}`);
      return response.json();
    },

    /**
     * Delete a document
     */
    delete: async (id: string): Promise<{ success: boolean; id: string }> => {
      const response = await fetch(`${API_URL}/api/documents/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(`Failed to delete document: ${response.statusText}`);
      return response.json();
    },
  },

  /**
   * Generate content via Groq AI
   */
  generate: async (request: GenerateRequest): Promise<GenerateResponse> => {
    const response = await fetch(`${API_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error(`Failed to generate content: ${response.statusText}`);
    return response.json();
  },
};
