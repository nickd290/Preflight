import React, { useState, useEffect, useRef } from 'react';
import { PreflightReport, CheckStatus, CheckItem } from '../types';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ChevronDown, 
  ChevronRight, 
  ArrowLeft,
  Target,
  Maximize2,
  Eye,
  ExternalLink,
  ChevronLeft,
  Loader2
} from 'lucide-react';
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
// Handle ES module default export inconsistency to fix "Cannot set properties of undefined"
const pdfjs = (pdfjsLib as any).default ?? pdfjsLib;

if (pdfjs.GlobalWorkerOptions) {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;
}

interface ReportDashboardProps {
  report: PreflightReport;
  file: File;
  onReset: () => void;
}

export const ReportDashboard: React.FC<ReportDashboardProps> = ({ report, file, onReset }) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'FAIL': true,
    'WARN': true,
    'PASS': false
  });
  
  // Interaction State
  const [activeZone, setActiveZone] = useState<string | null>(null);
  const [activeItemIndex, setActiveItemIndex] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  
  // PDF Rendering State
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize URL and Load Document
  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPdfUrl(url);

      const loadPdf = async () => {
        setIsRendering(true);
        setRenderError(null);
        try {
          // Use the normalized pdfjs object
          const loadingTask = pdfjs.getDocument(url);
          const doc = await loadingTask.promise;
          setPdfDoc(doc);
          setNumPages(doc.numPages);
          // Set initial page from specs if possible, otherwise default to 1
        } catch (err: any) {
          console.error("Error loading PDF:", err);
          setRenderError("Failed to load PDF preview. The file might be corrupted or password protected.");
        } finally {
          setIsRendering(false);
        }
      };

      loadPdf();

      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [file]);

  // Render Page to Canvas
  useEffect(() => {
    const renderPage = async () => {
      if (!pdfDoc || !canvasRef.current || !containerRef.current) return;

      try {
        const page = await pdfDoc.getPage(pageNum);
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) return;

        // Calculate scale to fit container width, with a max limit
        const containerWidth = containerRef.current.clientWidth - 48; // Padding
        const containerHeight = containerRef.current.clientHeight - 48;
        
        const unscaledViewport = page.getViewport({ scale: 1 });
        const scaleX = containerWidth / unscaledViewport.width;
        const scaleY = containerHeight / unscaledViewport.height;
        // Use the smaller scale to ensure it fits entirely
        const scale = Math.min(scaleX, scaleY, 1.5); // Cap max scale for quality

        const viewport = page.getViewport({ scale });

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport,
        };

        await page.render(renderContext).promise;
      } catch (err) {
        console.error("Page render error:", err);
      }
    };

    renderPage();
  }, [pdfDoc, pageNum]);

  // Window resize handler to re-render
  useEffect(() => {
    const handleResize = () => {
       if(pdfDoc) {
         // Trigger re-render by toggling a dummy state or just calling render logic
         // For simplicity in this demo, we rely on the container constraints
       }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [pdfDoc]);

  const toggleSection = (status: string) => {
    setExpandedSections(prev => ({...prev, [status]: !prev[status]}));
  };

  const checksByStatus = {
    [CheckStatus.FAIL]: report.checks.filter(c => c.status === CheckStatus.FAIL),
    [CheckStatus.WARN]: report.checks.filter(c => c.status === CheckStatus.WARN),
    [CheckStatus.PASS]: report.checks.filter(c => c.status === CheckStatus.PASS),
  };

  // Helper to position the overlay box based on the zone
  const getZoneStyles = (zone: string) => {
    const base = "absolute border-2 border-red-500 bg-red-500/20 transition-all duration-300 z-20 box-border shadow-[0_0_15px_rgba(239,68,68,0.5)]";
    
    switch (zone) {
      case 'TOP_LEFT': return `${base} top-0 left-0 w-1/3 h-1/3 rounded-tl-lg`;
      case 'TOP_CENTER': return `${base} top-0 left-1/3 w-1/3 h-1/3`;
      case 'TOP_RIGHT': return `${base} top-0 right-0 w-1/3 h-1/3 rounded-tr-lg`;
      case 'MIDDLE_LEFT': return `${base} top-1/3 left-0 w-1/3 h-1/3`;
      case 'CENTER': return `${base} top-1/3 left-1/3 w-1/3 h-1/3`;
      case 'MIDDLE_RIGHT': return `${base} top-1/3 right-0 w-1/3 h-1/3`;
      case 'BOTTOM_LEFT': return `${base} bottom-0 left-0 w-1/3 h-1/3 rounded-bl-lg`;
      case 'BOTTOM_CENTER': return `${base} bottom-0 left-1/3 w-1/3 h-1/3`;
      case 'BOTTOM_RIGHT': return `${base} bottom-0 right-0 w-1/3 h-1/3 rounded-br-lg`;
      case 'FULL_PAGE': return `${base} inset-0`;
      default: return 'hidden';
    }
  };

  const getCategoryStyle = (category: string) => {
    switch (category) {
      case 'LAYOUT': return 'text-blue-400 bg-blue-950/30 border-blue-900/50';
      case 'COLOR': return 'text-pink-400 bg-pink-950/30 border-pink-900/50';
      case 'TYPOGRAPHY': return 'text-purple-400 bg-purple-950/30 border-purple-900/50';
      case 'IMAGERY': return 'text-orange-400 bg-orange-950/30 border-orange-900/50';
      case 'CONTENT': return 'text-emerald-400 bg-emerald-950/30 border-emerald-900/50';
      default: return 'text-slate-400 bg-slate-800 border-slate-700';
    }
  };

  const renderCheckItem = (item: CheckItem, index: number, sectionKey: string) => {
    const isFail = item.status === CheckStatus.FAIL;
    const isWarn = item.status === CheckStatus.WARN;
    const uniqueId = `${sectionKey}-${index}`;
    const isActive = activeItemIndex === uniqueId;

    return (
      <div 
        key={uniqueId} 
        className={`group flex items-start gap-3 p-3 transition-all duration-200 cursor-pointer border-l-2
          ${isActive ? 'bg-slate-800 border-cyan-400' : 'hover:bg-slate-800/50 border-transparent'}
        `}
        onMouseEnter={() => {
          setActiveZone(item.visualZone || 'FULL_PAGE');
          setActiveItemIndex(uniqueId);
        }}
        onMouseLeave={() => {
          setActiveZone(null);
          setActiveItemIndex(null);
        }}
      >
        <div className="mt-0.5 flex-shrink-0">
          {isFail && <XCircle className="w-4 h-4 text-red-500" />}
          {isWarn && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
          {!isFail && !isWarn && <CheckCircle2 className="w-4 h-4 text-green-500/50" />}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <h4 className={`text-sm font-medium truncate ${isFail ? 'text-red-200' : isWarn ? 'text-yellow-200' : 'text-slate-400'}`}>
              {item.title}
            </h4>
            <span className={`text-[10px] px-1.5 py-0.5 rounded border uppercase font-bold tracking-wider shrink-0 ${getCategoryStyle(item.category)}`}>
              {item.category}
            </span>
          </div>
          
          <p className={`text-xs text-slate-400 mt-1 leading-relaxed ${isActive ? 'text-slate-300' : 'line-clamp-2'}`}>
            {item.description}
          </p>

          {(item.location || item.visualZone) && (
            <div className={`mt-2 flex items-center gap-2 text-[10px] transition-opacity duration-200 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
              <span className="flex items-center text-cyan-400 bg-cyan-950/50 px-1.5 py-0.5 rounded border border-cyan-900/50">
                <Target className="w-3 h-3 mr-1" />
                {item.location || "General Area"}
              </span>
              {isActive && <span className="text-slate-500 animate-pulse">Highlighting preview...</span>}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSection = (status: CheckStatus, title: string, count: number, colorClass: string) => {
    if (count === 0) return null;
    const isExpanded = expandedSections[status];

    return (
      <div className="border-b border-slate-800 last:border-0">
        <button 
          onClick={() => toggleSection(status)}
          className="w-full flex items-center justify-between p-3 hover:bg-slate-800/30 transition-colors bg-slate-900/50"
        >
          <div className="flex items-center gap-2">
            {isExpanded ? <ChevronDown className="w-3 h-3 text-slate-500" /> : <ChevronRight className="w-3 h-3 text-slate-500" />}
            <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${colorClass}`}>
              {title}
              <span className="bg-slate-800 text-slate-400 px-1.5 rounded-sm text-[10px] border border-slate-700">
                {count}
              </span>
            </span>
          </div>
        </button>
        
        {isExpanded && (
          <div className="bg-slate-900/20 pb-2">
            {checksByStatus[status].map((item, idx) => renderCheckItem(item, idx, status))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 overflow-hidden">
      
      {/* Top Bar */}
      <div className="h-14 bg-slate-900 border-b border-slate-800 flex items-center px-4 justify-between shrink-0 z-30 relative shadow-lg">
        <div className="flex items-center gap-4">
          <button onClick={onReset} className="flex items-center text-slate-400 hover:text-white transition-colors text-sm font-medium">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </button>
          <div className="h-4 w-px bg-slate-700" />
          <div className="flex flex-col">
             <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">Preflight Report</span>
             <span className={`text-sm font-bold ${report.finalVerdict === 'READY_FOR_PRINT' ? 'text-green-400' : report.finalVerdict === 'DO_NOT_PRINT' ? 'text-red-400' : 'text-yellow-400'}`}>
                {report.finalVerdict.replace(/_/g, ' ')}
             </span>
          </div>
        </div>
        
        <div className="flex items-center gap-6 text-xs">
          <div className="flex flex-col items-end hidden md:flex">
             <span className="text-slate-500">Dimensions</span>
             <span className="text-slate-200 font-mono">{report.specs.detectedDimensions}</span>
          </div>
          <div className="flex flex-col items-end hidden md:flex">
             <span className="text-slate-500">Color Profile</span>
             <span className="text-slate-200 font-mono">{report.specs.colorProfileEstimate}</span>
          </div>
          <div className="px-3 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono font-bold">
             Score: {report.overallScore}/100
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        
        {/* LEFT PANEL: PDF Preview Area */}
        <div ref={containerRef} className="flex-1 bg-gray-800 relative flex items-center justify-center overflow-hidden p-6">
           
           {/* Canvas Container */}
           <div className="relative shadow-2xl transition-all duration-300 ease-out">
              {!pdfDoc && !renderError && (
                 <div className="flex flex-col items-center justify-center text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin mb-2" />
                    <span>Rendering Preview...</span>
                 </div>
              )}

              {renderError && (
                 <div className="flex flex-col items-center justify-center text-center p-8 bg-slate-900 rounded-lg border border-slate-700 max-w-md">
                    <AlertTriangle className="w-10 h-10 text-yellow-500 mb-4" />
                    <h3 className="text-white font-medium mb-2">Preview Unavailable</h3>
                    <p className="text-slate-400 text-sm mb-4">{renderError}</p>
                    <a 
                       href={pdfUrl || "#"} 
                       target="_blank" 
                       rel="noreferrer"
                       className="text-cyan-400 hover:text-cyan-300 text-sm flex items-center"
                    >
                       <ExternalLink className="w-4 h-4 mr-1" />
                       Open PDF externally
                    </a>
                 </div>
              )}

              <canvas 
                ref={canvasRef} 
                className={`block bg-white ${pdfDoc ? 'opacity-100' : 'opacity-0'}`}
              />

              {/* Overlay Layer - Perfectly matches canvas size */}
              {pdfDoc && (
                <div className="absolute inset-0 pointer-events-none z-20">
                  {activeZone && (
                    <div className={`${getZoneStyles(activeZone)} animate-pulse`}>
                       <div className="absolute -top-3 -right-1 translate-x-1/2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider shadow-lg flex items-center ring-1 ring-white/20 whitespace-nowrap">
                          <Target className="w-3 h-3 mr-1" />
                          Issue Here
                       </div>
                    </div>
                  )}
                </div>
              )}
           </div>

           {/* Floating Controls */}
           <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-xl z-30">
              <button 
                onClick={() => setPageNum(prev => Math.max(1, prev - 1))}
                disabled={pageNum <= 1}
                className="p-1 hover:bg-slate-700 rounded-full disabled:opacity-30 transition-colors text-white"
              >
                 <ChevronLeft className="w-5 h-5" />
              </button>
              
              <span className="text-xs font-mono text-slate-300 min-w-[60px] text-center">
                 Page {pageNum} / {numPages || '-'}
              </span>

              <button 
                onClick={() => setPageNum(prev => Math.min(numPages, prev + 1))}
                disabled={pageNum >= numPages}
                className="p-1 hover:bg-slate-700 rounded-full disabled:opacity-30 transition-colors text-white"
              >
                 <ChevronRight className="w-5 h-5" />
              </button>

              <div className="w-px h-4 bg-slate-700 mx-2" />

              <a 
                 href={pdfUrl || "#"} 
                 target="_blank" 
                 rel="noreferrer"
                 className="flex items-center gap-2 text-xs text-cyan-400 hover:text-cyan-300 font-medium"
              >
                 <ExternalLink className="w-3 h-3" />
                 Open PDF
              </a>
           </div>

        </div>

        {/* RIGHT PANEL: Sidebar Findings */}
        <div className="w-[400px] bg-slate-950 border-l border-slate-800 flex flex-col shrink-0 z-30 shadow-2xl">
          <div className="p-4 border-b border-slate-800 bg-slate-900/50">
             <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
               <Maximize2 className="w-4 h-4 text-cyan-400" />
               Inspection Results
             </h3>
             <p className="text-xs text-slate-500 mt-1">Hover over items to locate them in the preview.</p>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
            {renderSection(CheckStatus.FAIL, "Critical Errors", checksByStatus[CheckStatus.FAIL].length, "text-red-500")}
            {renderSection(CheckStatus.WARN, "Potential Issues", checksByStatus[CheckStatus.WARN].length, "text-yellow-500")}
            {renderSection(CheckStatus.PASS, "Passed Checks", checksByStatus[CheckStatus.PASS].length, "text-green-500")}
          </div>

          {/* Footer Summary */}
          <div className="p-4 border-t border-slate-800 bg-slate-900 text-xs text-slate-400 leading-relaxed">
            <span className="font-bold text-slate-300 block mb-1">AI Summary:</span>
            {report.summary}
          </div>
        </div>

      </div>
    </div>
  );
};