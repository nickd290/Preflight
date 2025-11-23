import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, ScanLine } from 'lucide-react';

const steps = [
  "Uploading document...",
  "Extracting layout geometry...",
  "Analyzing color profiles...",
  "Checking typography...",
  "Verifying bleed & margins...",
  "Generating report..."
];

export const AnalysisStatus: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 1500); // Fake progress for UX
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-md mx-auto mt-12 text-center">
      <div className="relative mb-8">
        <div className="absolute inset-0 flex items-center justify-center">
           <div className="w-24 h-24 bg-cyan-500/20 rounded-full animate-ping"></div>
        </div>
        <div className="relative z-10 bg-slate-900 rounded-full p-6 inline-block shadow-2xl ring-1 ring-white/10">
          <ScanLine className="w-10 h-10 text-cyan-400 animate-pulse" />
        </div>
      </div>

      <h3 className="text-xl font-medium text-white mb-6">
        Analyzing Document
      </h3>

      <div className="space-y-3 text-left max-w-xs mx-auto">
        {steps.map((step, index) => (
          <div 
            key={index} 
            className={`flex items-center space-x-3 transition-all duration-500
              ${index === currentStep ? 'text-cyan-400 scale-105 font-medium' : 
                index < currentStep ? 'text-slate-400' : 'text-slate-600 opacity-50'}
            `}
          >
            {index < currentStep ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : index === currentStep ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <div className="w-5 h-5 rounded-full border-2 border-slate-700" />
            )}
            <span className="text-sm">{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
};