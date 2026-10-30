import React, { useState, useEffect, useRef } from 'react';
import { Radio, Mic, Volume2, X, RefreshCw } from 'lucide-react';
import { doc, setDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { db, auth } from '../services/firebase';

export interface AtcStreamingModuleProps {
  onClose: () => void;
}

export const AtcStreamingModule: React.FC<AtcStreamingModuleProps> = ({ onClose }) => {
  const [streams, setStreams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchStreams();
  }, []);

  const fetchStreams = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      const q = query(collection(db, `userStates/${auth.currentUser.uid}/atcStreams`));
      const snapshot = await getDocs(q);
      setStreams(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const addStream = async (type: 'liveatc' | 'icecast' | 'opensky', url: string, name: string) => {
    if (!auth.currentUser) return;
    const streamId = name.replace(/\s+/g, '-').toLowerCase();
    const newStream = {
      userId: auth.currentUser.uid,
      streamId,
      url,
      type,
      enabled: true,
      updatedAt: new Date().toISOString()
    };
    await setDoc(doc(db, `userStates/${auth.currentUser.uid}/atcStreams`, streamId), newStream);
    fetchStreams();
  };

  return (
    <div className="fixed top-14 left-4 z-[120] w-[400px] bg-slate-950/95 border border-cyan-500/50 rounded-2xl shadow-2xl p-4 font-mono text-xs text-slate-200">
      <div className="flex items-center justify-between mb-4 border-b border-cyan-500/30 pb-2">
        <h2 className="font-bold text-white flex items-center gap-2">
          <Radio className="w-4 h-4 text-cyan-400" /> ATC STREAMING HUB
        </h2>
        <button onClick={onClose}><X className="w-4 h-4" /></button>
      </div>

      <div className="space-y-4">
        <button 
          onClick={() => addStream('liveatc', 'https://broadcast.liveatc.net/klit', 'Clinton-National-Control')}
          className="w-full bg-slate-900 border border-slate-700 p-2 rounded hover:bg-slate-800"
        >
          Add Clinton National (KLIT)
        </button>

        <div className="space-y-2">
          {streams.map(s => (
            <div key={s.id} className="flex justify-between items-center bg-black p-2 rounded border border-slate-800">
              <span>{s.streamId}</span>
              <button 
                onClick={() => {
                  if (audioRef.current) {
                    audioRef.current.src = s.url;
                    audioRef.current.play();
                  }
                }}
                className="bg-cyan-900 px-2 py-1 rounded"
              >
                Listen
              </button>
            </div>
          ))}
        </div>
      </div>
      <audio ref={audioRef} />
    </div>
  );
};
