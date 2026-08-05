'use client';

import { useState, useRef } from 'react';
import { X, Mic, MicOff, Loader2, Volume2 } from 'lucide-react';
import { api, playBase64Audio } from '@/app/lib/api';

interface VoiceGenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: string;
  onFieldsUpdated: (fields: Record<string, string>) => void;
}

type Status = 'idle' | 'speaking' | 'listening' | 'processing' | 'done' | 'error';

export default function VoiceGenerateModal({
  isOpen, onClose, documentType, onFieldsUpdated,
}: VoiceGenerateModalProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');

  const currentFieldRef = useRef<string>('');
  const fieldsRef = useRef<Record<string, string>>({});
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  if (!isOpen) return null;

  const startSession = async () => {
    setError('');
    setStatus('speaking');
    try {
      const first = await api.voice.getFirstQuestion(documentType);
      currentFieldRef.current = first.field;
      setCurrentQuestion(first.question);
      await playBase64Audio(first.audio_base64);
      setStatus('idle');
    } catch (err) {
      console.error(err);
      setError('Could not start the voice session. Check that the backend is running.');
      setStatus('error');
    }
  };

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await handleAnswer(blob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setStatus('listening');
    } catch (err) {
      console.error(err);
      setError('Microphone access was denied or unavailable.');
      setStatus('error');
    }
  };

  const stopListening = () => {
    mediaRecorderRef.current?.stop();
  };

  const handleAnswer = async (audioBlob: Blob) => {
    setStatus('processing');
    try {
      const result = await api.voice.sendTurn(audioBlob, fieldsRef.current, documentType, currentFieldRef.current);

      setTranscript(result.transcript);
      fieldsRef.current = result.fields;
      onFieldsUpdated(result.fields);

      if (result.audio_base64) {
        setStatus('speaking');
        setCurrentQuestion(result.next_question || '');
        await playBase64Audio(result.audio_base64);
      }

      if (result.done) {
        setStatus('done');
      } else if (result.next_field) {
        currentFieldRef.current = result.next_field;
        setStatus('idle');
      }
    } catch (err) {
      console.error(err);
      setError('Something went wrong processing your answer. Try again.');
      setStatus('error');
    }
  };

  const handleClose = () => {
    mediaRecorderRef.current?.stop();
    setStatus('idle');
    setCurrentQuestion('');
    setTranscript('');
    fieldsRef.current = {};
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 relative">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
          aria-label="Close voice assistant"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-4">
            <Volume2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Voice Assistant</h3>
          <p className="text-sm text-slate-500 mt-1">I'll ask a few questions and write your document as you speak.</p>
        </div>

        {status === 'idle' && !currentQuestion && (
          <button
            onClick={startSession}
            className="w-full py-4 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors"
          >
            Start Talking
          </button>
        )}

        {currentQuestion && status !== 'done' && (
          <div className="mb-6">
            <p className="text-lg text-slate-800 font-medium text-center mb-4" aria-live="polite">
              {currentQuestion}
            </p>

            {transcript && (
              <p className="text-sm text-slate-500 text-center italic mb-4">You said: "{transcript}"</p>
            )}

            <div className="flex justify-center">
              {status === 'speaking' && (
                <div className="flex items-center gap-2 text-purple-600">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Speaking...</span>
                </div>
              )}

              {status === 'idle' && (
                <button
                  onClick={startListening}
                  className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-semibold rounded-full hover:bg-red-700 transition-colors"
                  aria-label="Start recording your answer"
                >
                  <Mic className="w-5 h-5" />
                  Tap to Answer
                </button>
              )}

              {status === 'listening' && (
                <button
                  onClick={stopListening}
                  className="flex items-center gap-2 px-6 py-3 bg-slate-800 text-white font-semibold rounded-full animate-pulse"
                  aria-label="Stop recording"
                >
                  <MicOff className="w-5 h-5" />
                  Listening... Tap to Stop
                </button>
              )}

              {status === 'processing' && (
                <div className="flex items-center gap-2 text-slate-500">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {status === 'done' && (
          <div className="text-center">
            <p className="text-slate-700 font-medium mb-4">{currentQuestion}</p>
            <button
              onClick={handleClose}
              className="w-full py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700"
            >
              Review My Document
            </button>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 text-center mt-4">{error}</p>
        )}
      </div>
    </div>
  );
}
