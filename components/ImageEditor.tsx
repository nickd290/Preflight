import React, { useRef, useState } from 'react';
import { Upload, Sparkles, Loader2, ArrowRight, Image as ImageIcon, Download, RefreshCw } from 'lucide-react';
import { editImage } from '../services/geminiService';

export const ImageEditor: React.FC = () => {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        setError("Please upload an image file (PNG, JPG).");
        return;
      }
      setOriginalFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setEditedImage(null);
      setError(null);
    }
  };

  const handleEdit = async () => {
    if (!originalFile || !prompt.trim()) return;

    setIsProcessing(true);
    setError(null);

    try {
      const base64 = await fileToBase64(originalFile);
      // Remove header for API, but keep for display
      const dataOnly = base64.split(',')[1];
      const result = await editImage(dataOnly, originalFile.type, prompt);
      setEditedImage(result);
    } catch (err: any) {
      setError(err.message || "Failed to edit image");
    } finally {
      setIsProcessing(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const reset = () => {
    setOriginalFile(null);
    setPreviewUrl(null);
    setEditedImage(null);
    setPrompt('');
    setError(null);
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-6 animate-fade-in-up">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-white mb-2">
          AI Image Editor
        </h2>
        <p className="text-slate-400">
          Modify and fix print assets using Gemini 2.5 Flash Image.
        </p>
      </div>

      {!originalFile ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="max-w-xl mx-auto border-2 border-dashed border-slate-700 bg-slate-800/30 hover:bg-slate-800/50 hover:border-cyan-500/50 rounded-xl p-12 text-center cursor-pointer transition-all"
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*"
            onChange={handleFileSelect}
          />
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 ring-1 ring-white/10">
            <Upload className="w-8 h-8 text-cyan-400" />
          </div>
          <h3 className="text-lg font-medium text-white mb-1">Upload Source Image</h3>
          <p className="text-slate-400 text-sm">PNG, JPG up to 10MB</p>
        </div>
      ) : (
        <div className="space-y-6">
           {/* Editor Toolbar */}
           <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1 w-full">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your edit (e.g. 'Remove the background', 'Add a retro filter')..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none placeholder:text-slate-500"
                />
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <button
                  onClick={handleEdit}
                  disabled={isProcessing || !prompt.trim()}
                  className={`flex-1 md:flex-none px-6 py-3 rounded-lg font-bold flex items-center justify-center space-x-2 transition-all min-w-[140px]
                    ${isProcessing || !prompt.trim()
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:shadow-lg hover:shadow-purple-500/20 active:scale-[0.98]'
                    }`}
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Apply Edit</span>
                    </>
                  )}
                </button>
                <button 
                  onClick={reset}
                  className="px-4 py-3 bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
                  title="Reset"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
           </div>

           {error && (
              <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-200 text-sm">
                {error}
              </div>
            )}

           {/* Comparison View */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[400px]">
              {/* Original */}
              <div className="relative bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center">
                 <div className="absolute top-3 left-3 bg-black/50 backdrop-blur px-2 py-1 rounded text-xs font-medium text-white/80">Original</div>
                 <img src={previewUrl!} alt="Original" className="max-w-full max-h-full object-contain" />
              </div>

              {/* Result */}
              <div className="relative bg-slate-900 rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center group">
                 {editedImage ? (
                    <>
                      <div className="absolute top-3 right-3 bg-purple-500/80 backdrop-blur px-2 py-1 rounded text-xs font-medium text-white shadow-lg z-10">Edited</div>
                      <img src={editedImage} alt="Edited" className="max-w-full max-h-full object-contain" />
                      <a 
                        href={editedImage} 
                        download={`edited-${Date.now()}.png`}
                        className="absolute bottom-4 right-4 bg-slate-900/90 text-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-800 border border-slate-700"
                      >
                        <Download className="w-5 h-5" />
                      </a>
                    </>
                 ) : (
                    <div className="text-center text-slate-600">
                      {isProcessing ? (
                        <div className="flex flex-col items-center animate-pulse">
                          <Loader2 className="w-10 h-10 mb-3 animate-spin text-purple-500" />
                          <p>Applying magic...</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <ArrowRight className="w-10 h-10 mb-3 opacity-20" />
                          <p className="text-sm">Edited version will appear here</p>
                        </div>
                      )}
                    </div>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};