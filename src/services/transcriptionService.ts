/**
 * Transcription Service - Interfaces with the server-side gemini-3.5-transcribe endpoint
 */

export interface TranscriptionResponse {
  transcript: string;
  error?: string;
}

export const transcriptionService = {
  /**
   * Transcribes audio data (base64 encoded)
   */
  async transcribe(base64Audio: string, mimeType: string = 'audio/mp3'): Promise<TranscriptionResponse> {
    try {
      const response = await fetch('/api/gemini/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ audioData: base64Audio, mimeType }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Transcription request failed');
      }

      return await response.json();
    } catch (err: any) {
      console.error('[TranscriptionService Error]:', err.message);
      return { transcript: '', error: err.message };
    }
  }
};
