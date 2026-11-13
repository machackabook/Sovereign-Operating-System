import React, { useState, useRef } from 'react';
import { transcriptionService } from '../services/transcriptionService';
import { Mic, Upload, Loader2, FileText, X, AlertCircle, CheckCircle2 } from 'lucide-react';

export const AudioTranscriptionTool: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const mimeType = mediaRecorder.mimeType || audioChunksRef.current[0]?.type || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        await processAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setError(null);
    } catch (err: any) {
      setError('Microphone access denied or unavailable.');
      console.error(err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('File size exceeds 10MB limit.');
        return;
      }
      await processAudio(file);
    }
  };

  const processAudio = async (blob: Blob) => {
    setIsProcessing(true);
    setError(null);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Audio file could not be read.'));
        reader.onload = () => {
          if (typeof reader.result !== 'string') {
            reject(new Error('Audio file did not produce a readable data URL.'));
            return;
          }
          resolve(reader.result);
        };
        reader.readAsDataURL(blob);
      });
      const separator = dataUrl.indexOf(',');
      if (separator < 0) throw new Error('Audio data URL is malformed.');
      const base64data = dataUrl.slice(separator + 1);
      const response = await transcriptionService.transcribe(base64data, blob.type || 'audio/webm');
      if (response.error) {
        setError(response.error);
      } else {
        setTranscript(response.transcript);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to process audio for transcription.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117] border border-cyan-500/20 rounded-2xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-black/40">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wider">Audio Transcription</h3>
            <p className="text-[10px] text-slate-500 uppercase tracking-tight">Gemini 3.5 Transcribe Enclave</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto space-y-6">
        {/* Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`flex flex-col items-center justify-center p-6 rounded-2xl border transition-all duration-300 ${
              isRecording 
                ? 'bg-rose-500/10 border-rose-500/40 text-rose-400' 
                : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-cyan-500/40 hover:text-cyan-400'
            }`}
          >
            <div className={`p-3 rounded-full mb-3 ${isRecording ? 'bg-rose-500 animate-pulse' : 'bg-slate-800'}`}>
              <Mic className={`w-6 h-6 ${isRecording ? 'text-white' : 'text-slate-400'}`} />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {isRecording ? 'Stop Capturing' : 'Record Audio'}
            </span>
          </button>

          <label className="flex flex-col items-center justify-center p-6 rounded-2xl border bg-slate-900/50 border-slate-800 text-slate-400 hover:border-cyan-500/40 hover:text-cyan-400 cursor-pointer transition-all duration-300">
            <input type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />
            <div className="p-3 rounded-full bg-slate-800 mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider">Upload File</span>
          </label>
        </div>

        {/* Results Area */}
        <div className="space-y-4">
          {isProcessing && (
            <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 animate-in fade-in">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-white uppercase tracking-widest">Processing Audio</p>
                <p className="text-[10px] text-slate-500">Synthesizing transcript via neural substrate...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 animate-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-rose-400 uppercase tracking-wider">System Error</p>
                <p className="text-[11px] text-rose-300/80 leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          {transcript && (
            <div className="space-y-3 animate-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Transcript Ready</span>
                </div>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(transcript);
                  }}
                  className="text-[10px] text-cyan-400 hover:underline font-bold"
                >
                  Copy to Clipboard
                </button>
              </div>
              <div className="p-4 rounded-xl bg-black/40 border border-white/5 min-h-[120px]">
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{transcript}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
