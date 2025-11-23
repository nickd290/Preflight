import React, { useState } from 'react';
import { Sparkles, Loader2, Image as ImageIcon, Download } from 'lucide-react';
import { generateImage } from '../services/geminiService';

export const ImageGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const result = await generateImage(prompt, size);
      setGeneratedImage(result);
    } catch (err: any) {
      setError(err.message || "Failed to generate image");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 animate-fade-in-up">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-white mb-2">
          AI Image Generator
        </h2>
        <p className="text-slate-400">
          Create high-quality print assets using Gemini 3 Pro (Nano Banana Pro).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Controls */}
        <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 h-fit">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Image Description
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A futuristic printing press in a neon-lit cyber city..."
                className="w-full h-32 bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-200 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none resize-none placeholder:text-slate-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Resolution
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['1K', '2K', '4K'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors border
                      ${size === s 
                        ? 'bg-cyan-900/30 border-cyan-500 text-cyan-400' 
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className={`w-full py-3 rounded-lg font-bold flex items-center justify-center space-x-2 transition-all
                ${isGenerating || !prompt.trim()
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-lg hover:shadow-cyan-500/20 active:scale-[0.98]'
                }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Generate Image</span>
                </>
              )}
            </button>

            {error && (
              <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-200 text-sm">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Preview */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-center min-h-[400px] relative overflow-hidden group">
          {generatedImage ? (
            <>
              <img 
                src={generatedImage} 
                alt="Generated" 
                className="w-full h-full object-contain"
              />
              <a 
                href={generatedImage} 
                download={`generated-${Date.now()}.png`}
                className="absolute bottom-4 right-4 bg-slate-900/90 text-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-800 border border-slate-700"
                title="Download"
              >
                <Download className="w-5 h-5" />
              </a>
            </>
          ) : (
            <div className="text-center text-slate-600">
              {isGenerating ? (
                <div className="flex flex-col items-center animate-pulse">
                  <ImageIcon className="w-12 h-12 mb-4 opacity-50" />
                  <p>Dreaming up your image...</p>
                </div>
              ) : (
                <>
                  <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p className="text-sm">Your generated image will appear here</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};