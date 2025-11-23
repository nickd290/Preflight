import React, { useState, useEffect } from 'react';
import { FileUpload } from './components/FileUpload';
import { AnalysisStatus } from './components/AnalysisStatus';
import { ReportDashboard } from './components/ReportDashboard';
import { ImageGenerator } from './components/ImageGenerator';
import { ImageEditor } from './components/ImageEditor';
import { analyzePdf } from './services/geminiService';
import { PreflightReport, Tab } from './types';
import { Printer, Sparkles, Layers, Image as ImageIcon, Wand2, ArrowRight } from 'lucide-react';

// Declaration for API Key selection
declare global {
  interface AIStudio {
    hasSelectedApiKey(): Promise<boolean>;
    openSelectKey(): Promise<void>;
  }
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('PREFLIGHT');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isCheckingKey, setIsCheckingKey] = useState(true);

  // Preflight State
  const [file, setFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState<PreflightReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    try {
      if (window.aistudio && window.aistudio.hasSelectedApiKey) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      } else {
        // Fallback for dev environments without the wrapper
        setHasApiKey(true); 
      }
    } catch (e) {
      console.error("Failed to check API key status", e);
    } finally {
      setIsCheckingKey(false);
    }
  };

  const handleSelectKey = async () => {
    if (window.aistudio && window.aistudio.openSelectKey) {
      await window.aistudio.openSelectKey();
      // Assume success after dialog interaction per guidelines
      setHasApiKey(true);
    }
  };

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsAnalyzing(true);
    setError(null);
    setReport(null);

    try {
      const base64 = await fileToBase64(selectedFile);
      setFileBase64(base64);
      const result = await analyzePdf(base64);
      setReport(result);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setFile(null); // Reset to allow retry
      setFileBase64(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setFileBase64(null);
    setReport(null);
    setError(null);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix for processing
        const base64Data = result.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = error => reject(error);
    });
  };

  if (isCheckingKey) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">Initializing...</div>;
  }

  // Mandatory API Key Selection Gate
  if (!hasApiKey) {
    return (
      <div className="min-h-screen bg-slate-900 bg-grid-pattern flex flex-col items-center justify-center p-4">
         <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl text-center">
            <div className="w-16 h-16 bg-cyan-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
               <Printer className="w-8 h-8 text-cyan-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Welcome to PrintPerfect AI</h1>
            <p className="text-slate-400 mb-8 leading-relaxed">
              To access professional-grade Gemini models for PDF analysis and image generation, you must connect a paid Google Cloud Project.
            </p>
            <button 
              onClick={handleSelectKey}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-cyan-500/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              Connect API Key <ArrowRight className="w-4 h-4" />
            </button>
            <div className="mt-6 text-xs text-slate-500">
               Please refer to <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-cyan-500 hover:underline">Billing Documentation</a> for more info.
            </div>
         </div>
      </div>
    );
  }

  // Preflight Dashboard View (Fullscreen override)
  if (report && file && !isAnalyzing && activeTab === 'PREFLIGHT') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
        <ReportDashboard report={report} file={file} onReset={handleReset} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 bg-grid-pattern overflow-x-hidden flex flex-col text-slate-200">
      
      {/* Header & Navigation */}
      <header className="w-full border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-to-br from-cyan-400 to-blue-600 p-2 rounded-lg">
              <Printer className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight hidden sm:block">
              PrintPerfect <span className="text-cyan-400">AI</span>
            </h1>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center p-1 bg-slate-800/50 rounded-lg border border-slate-700/50">
             <button 
                onClick={() => setActiveTab('PREFLIGHT')}
                className={`flex items-center space-x-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'PREFLIGHT' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
             >
                <Layers className="w-4 h-4" />
                <span className="hidden sm:inline">Preflight</span>
             </button>
             <button 
                onClick={() => setActiveTab('EDITOR')}
                className={`flex items-center space-x-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'EDITOR' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
             >
                <Wand2 className="w-4 h-4" />
                <span className="hidden sm:inline">Image Editor</span>
             </button>
             <button 
                onClick={() => setActiveTab('GENERATOR')}
                className={`flex items-center space-x-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'GENERATOR' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
             >
                <ImageIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Generator</span>
             </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col pt-8 px-4 w-full max-w-7xl mx-auto">
        
        {/* Preflight Tab */}
        {activeTab === 'PREFLIGHT' && (
           <div className="w-full flex flex-col items-center">
              {!file && !report && (
                <div className="text-center mb-12 animate-fade-in-up mt-8">
                  <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
                    Professional Preflighting <br />
                    <span className="text-cmyk">Reimagined with AI</span>
                  </h2>
                  <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                    Upload your print-ready PDF. Our AI analyzes bleed, resolution, typography, and layout integrity instantly.
                  </p>
                </div>
              )}

              <div className="w-full">
                {!file && !report && (
                   <FileUpload onFileSelect={handleFileSelect} isLoading={false} />
                )}

                {isAnalyzing && (
                  <AnalysisStatus />
                )}

                {error && !isAnalyzing && !report && (
                   <div className="max-w-md mx-auto mt-8 p-6 bg-red-950/30 border border-red-900 rounded-xl text-center">
                      <h3 className="text-red-400 font-semibold mb-2">Analysis Failed</h3>
                      <p className="text-red-200/70 text-sm mb-4">{error}</p>
                      <button 
                        onClick={handleReset}
                        className="text-white bg-red-900 hover:bg-red-800 px-4 py-2 rounded-lg text-sm transition-colors"
                      >
                        Try Again
                      </button>
                   </div>
                )}
              </div>
           </div>
        )}

        {/* Image Generator Tab */}
        {activeTab === 'GENERATOR' && (
           <ImageGenerator />
        )}

        {/* Image Editor Tab */}
        {activeTab === 'EDITOR' && (
           <ImageEditor />
        )}

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-800 mt-auto py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
          <p>© {new Date().getFullYear()} PrintPerfect AI. Powered by Google Gemini.</p>
          <p className="mt-2 text-xs opacity-60">
            Disclaimer: AI analysis is for advisory purposes only. Always request a hard proof for critical jobs.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;