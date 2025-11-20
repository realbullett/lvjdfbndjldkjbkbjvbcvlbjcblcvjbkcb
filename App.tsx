import React, { useState, useRef } from 'react';
import { Header } from './components/Header';
import { ConditionCard } from './components/ConditionCard';
import { analyzePatientSymptoms, generatePatientSample, generateClinicalReport } from './services/assistantDoctorService';
import { DiagnosisState } from './types';
import { Sparkles, AlertOctagon, ArrowRight, FileText, Printer, Stethoscope, Zap, X, Mail, Copy, Check, ExternalLink, Heart, Image as ImageIcon, Upload } from 'lucide-react';

const App: React.FC = () => {
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [state, setState] = useState<DiagnosisState>({
    results: null,
    loading: false,
    error: null,
  });
  
  // Report State
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportHtml, setReportHtml] = useState('');
  const [generatingReport, setGeneratingReport] = useState(false);

  // Contact Modal State
  const [showContactModal, setShowContactModal] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const resultsRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !selectedImage) return;

    setState({ ...state, loading: true, error: null });
    setReportHtml(''); // Reset report

    try {
      // Provide default text if only image is provided
      const promptText = input.trim() || "Please analyze the symptoms present in the attached image.";
      const data = await analyzePatientSymptoms(promptText, selectedImage || undefined);
      setState({
        results: data,
        loading: false,
        error: null,
      });
      
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      
    } catch (err: any) {
      setState({
        results: null,
        loading: false,
        error: err.message || "An error occurred during diagnosis.",
      });
    }
  };

  const handleGenerateSample = async () => {
    if (state.loading || isGenerating) return;
    setIsGenerating(true);
    try {
      const sample = await generatePatientSample();
      setInput(sample);
    } catch (err) {
      console.error("Failed to generate sample");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClear = () => {
    setInput('');
    setSelectedImage(null);
    setState({ results: null, loading: false, error: null });
    setReportHtml('');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    // Reset input so same file can be selected again if needed
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const blob = items[i].getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onload = (event) => {
            setSelectedImage(event.target?.result as string);
          };
          reader.readAsDataURL(blob);
        }
        return;
      }
    }
  };

  const handleViewReport = async () => {
    if (!state.results) return;
    
    setShowReportModal(true);
    
    if (!reportHtml) {
      setGeneratingReport(true);
      try {
        const promptText = input.trim() || (selectedImage ? "Analysis based on provided medical image." : "");
        const html = await generateClinicalReport(state.results, promptText);
        setReportHtml(html);
      } catch (e) {
        setReportHtml('<p>Error loading report.</p>');
      } finally {
        setGeneratingReport(false);
      }
    }
  };

  const printReport = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Clinical Report - LV Health</title>
            <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600&display=swap" rel="stylesheet">
            <style>
              body { font-family: 'Outfit', sans-serif; padding: 40px; color: #1e293b; }
              .report-content h1 { font-size: 24px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
              .report-content h2 { font-size: 18px; font-weight: 600; color: #334155; margin-top: 24px; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em; }
              .report-content p { margin-bottom: 12px; font-size: 14px; line-height: 1.6; }
              .report-content ul { list-style-type: disc; padding-left: 20px; margin-bottom: 16px; font-size: 14px; }
              .report-content li { margin-bottom: 6px; }
            </style>
          </head>
          <body>
            ${reportHtml}
            <script>
              window.onload = function() { window.print(); }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('lvhealthanalysis@gmail.com');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen font-sans pb-20 selection:bg-brand-accent selection:text-white relative overflow-x-hidden">
      
      {/* Background Glow Elements */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-brand-primary opacity-10 blur-[120px] rounded-full pointer-events-none z-0"></div>
      <div className="fixed bottom-0 right-0 w-[800px] h-[600px] bg-brand-accent opacity-5 blur-[120px] rounded-full pointer-events-none z-0"></div>
      
      <Header onContactClick={() => setShowContactModal(true)} />

      <main className="relative z-10 pt-32 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Hero Section */}
        <div className="relative text-center max-w-3xl mx-auto mb-16">
          
          {/* 3D Floating Stethoscope */}
          <div className="hidden md:block absolute -top-24 -right-16 w-64 h-64 animate-float pointer-events-none select-none z-0 opacity-90">
            <img 
              src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Stethoscope.png"
              alt="3D Stethoscope"
              className="w-full h-full object-contain drop-shadow-[0_0_35px_rgba(124,58,237,0.3)] rotate-12"
            />
          </div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-8 shadow-lg backdrop-blur-sm">
              <Sparkles size={14} className="text-brand-accent" />
              <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">Next Gen AI Diagnostics</span>
            </div>
            
            <h2 className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-6 leading-tight">
              Precision Care.<br />
              <span className="text-gradient">Elevated.</span>
            </h2>
            <p className="text-lg md:text-xl text-gray-400 leading-relaxed max-w-xl mx-auto font-light">
              Experience the future of personal health with <span className="text-white font-medium">LV Assistant Doctor</span>. Clinical-grade analysis at the speed of thought.
            </p>
          </div>
        </div>

        {/* Input Area */}
        <div className="max-w-4xl mx-auto mb-24">
          <div className="glass-panel rounded-3xl overflow-hidden relative group transition-all duration-500 hover:shadow-[0_0_40px_rgba(124,58,237,0.15)]">
            
            <form onSubmit={handleAnalyze} className="p-1">
              <div className="relative flex flex-col">
                
                {/* Image Preview Section - Inside Input */}
                {selectedImage && (
                    <div className="px-8 pt-6 pb-2">
                        <div className="relative inline-block group animate-fade-in-up">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <img 
                                src={selectedImage} 
                                alt="Medical Reference" 
                                className="h-32 w-auto rounded-lg border border-white/20 shadow-lg object-cover" 
                            />
                            <button 
                                type="button"
                                onClick={() => setSelectedImage(null)}
                                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-md transform hover:scale-110"
                            >
                                <X size={12} />
                            </button>
                            <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-white uppercase tracking-wide">
                                Attached Image
                            </div>
                        </div>
                    </div>
                )}

                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onPaste={handlePaste}
                  placeholder="Describe your symptoms in detail or paste a medical image... (e.g., 'Intermittent migraine with visual aura...')"
                  className="w-full min-h-[180px] p-8 text-lg md:text-xl text-gray-100 placeholder-gray-600 bg-transparent border-none outline-none resize-none focus:ring-0 leading-relaxed font-light"
                  disabled={state.loading}
                />
                
                <div className="flex flex-col sm:flex-row items-center justify-between px-8 py-6 bg-black/20 border-t border-white/5 gap-4 backdrop-blur-md">
                  <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-gray-500">
                        <Zap size={12} className="text-yellow-500" />
                        <span className="hidden sm:inline">AI Analysis</span>
                      </div>
                      
                      {/* Image Upload Button */}
                      <div className="h-4 w-px bg-white/10 hidden sm:block"></div>
                      
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleImageUpload} 
                        accept="image/*" 
                        className="hidden" 
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={state.loading}
                        className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-white transition-colors group"
                      >
                        <ImageIcon size={14} className="group-hover:text-brand-glow transition-colors" />
                        <span className="group-hover:text-gray-300 transition-colors">Add Image</span>
                      </button>
                  </div>
                  
                  <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
                    
                    {/* Example Case Button */}
                    <button 
                      type="button"
                      onClick={handleGenerateSample}
                      disabled={state.loading || isGenerating}
                      className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-brand-accent transition-colors px-2 py-2"
                    >
                      <Sparkles size={14} className={isGenerating ? "animate-spin" : ""} />
                      {isGenerating ? "Generating..." : "Example Case"}
                    </button>

                    {(input || selectedImage) && (
                      <button
                        type="button"
                        onClick={handleClear}
                        className="text-sm font-medium text-gray-500 hover:text-white px-4 py-2 transition-colors"
                        disabled={state.loading}
                      >
                        Reset
                      </button>
                    )}
                    
                    <button
                      type="submit"
                      disabled={state.loading || (!input.trim() && !selectedImage)}
                      className={`
                        group relative w-full sm:w-auto overflow-hidden rounded-xl px-8 py-4 font-bold text-white transition-all duration-200
                        ${state.loading || (!input.trim() && !selectedImage)
                          ? 'bg-gray-800 cursor-not-allowed text-gray-600 opacity-50 shadow-none'
                          : 'bg-gradient-to-r from-brand-primary to-brand-accent shadow-[0_6px_0_rgb(76,29,149)] hover:shadow-[0_8px_0_rgb(76,29,149)] hover:-translate-y-1 active:shadow-none active:translate-y-[6px]'
                        }
                      `}
                    >
                      {/* 3D Shimmer Effect */}
                      {!state.loading && (input.trim() || selectedImage) && (
                         <div className="absolute inset-0 -translate-x-full group-hover:animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent z-10" />
                      )}

                      <div className="relative z-20 flex items-center justify-center gap-2">
                        {state.loading ? (
                          <>
                            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span className="text-sm tracking-widest uppercase drop-shadow-md">Processing</span>
                          </>
                        ) : (
                          <>
                            <span className="text-sm tracking-widest uppercase drop-shadow-md group-hover:scale-105 transition-transform">Run Diagnosis</span>
                            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                          </>
                        )}
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Support Section - Only visible when no results to keep diagnosis clean */}
        {!state.results && !state.loading && (
          <div className="max-w-2xl mx-auto text-center -mt-12 mb-24 px-6 opacity-80 hover:opacity-100 transition-opacity duration-500">
             <div className="inline-flex items-center gap-2 text-brand-primary mb-4 bg-brand-primary/5 px-4 py-1.5 rounded-full border border-brand-primary/10">
                <Heart size={14} className="fill-brand-primary/20" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Support Our Growth</span>
             </div>
             <p className="text-gray-400 text-sm leading-relaxed">
               Help us democratize precision health. If LV Health has empowered you, please consider sharing <span className="text-white font-medium">Assistant Doctor</span> with friends and family 
               to help them better understand their daily health.
             </p>
          </div>
        )}

        {/* Results Section */}
        {(state.results || state.error) && (
          <div ref={resultsRef} className="animate-fade-in-up space-y-10 pb-20">
            
            {state.error ? (
               <div className="max-w-2xl mx-auto bg-red-900/20 border border-red-500/30 rounded-2xl p-8 text-center backdrop-blur-sm">
                 <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                   <AlertOctagon size={24} />
                 </div>
                 <h3 className="text-lg font-bold text-red-200 mb-2">Analysis Interrupted</h3>
                 <p className="text-red-400/80 text-sm">{state.error}</p>
               </div>
            ) : state.results && (
              <>
                {/* Report Header */}
                <div className="flex items-center gap-4 mb-8 border-b border-white/10 pb-6">
                  <div className="bg-brand-primary/20 p-3 rounded-xl text-brand-glow border border-brand-primary/30">
                    <Stethoscope size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Clinical Report</h2>
                    <p className="text-sm text-gray-500">ID: {Math.random().toString(36).substr(2, 9).toUpperCase()} • LV Health AI</p>
                  </div>
                  
                  {/* Detailed Report Button */}
                  <button 
                    onClick={handleViewReport}
                    className="ml-auto hidden md:flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white bg-white/5 border border-white/10 hover:border-white/30 px-5 py-2.5 rounded-lg transition-all group"
                  >
                    <FileText size={14} className="text-brand-accent group-hover:scale-110 transition-transform" />
                    Detailed Report
                  </button>
                </div>

                {/* AI Insight Box */}
                <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-8 border border-white/10 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-brand-primary/20 rounded-full blur-[80px] transform translate-x-1/2 -translate-y-1/2"></div>
                  
                  <div className="relative z-10 grid md:grid-cols-3 gap-10">
                    <div className="md:col-span-2 space-y-6">
                      <div className="flex items-center gap-2 text-brand-accent text-xs font-bold uppercase tracking-widest">
                        <Sparkles size={14} />
                        Synopsis
                      </div>
                      <p className="text-lg text-gray-200 leading-relaxed font-light">
                        {state.results.general_advice}
                      </p>
                      <div className="pt-4">
                        <div className="inline-block bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-[11px] text-red-300 uppercase tracking-wider">
                           <span className="font-bold text-red-400 mr-2">DISCLAIMER:</span> {state.results.disclaimer}
                        </div>
                      </div>
                    </div>

                    {/* Urgency Indicator */}
                    <div className="flex flex-col justify-center border-l border-white/5 pl-0 md:pl-10">
                      {state.results.conditions.some(c => ['High', 'Critical'].includes(c.urgency)) ? (
                        <div className="text-center">
                          <div className="inline-flex p-4 rounded-full bg-red-500/10 text-red-500 mb-4 animate-pulse border border-red-500/20">
                             <AlertOctagon size={32} />
                          </div>
                          <h4 className="font-bold text-white text-lg mb-1">Immediate Action</h4>
                          <p className="text-xs text-gray-400 leading-relaxed">Symptoms suggest high priority conditions. Please consult a specialist.</p>
                        </div>
                      ) : (
                        <div className="text-center">
                           <div className="inline-flex p-4 rounded-full bg-emerald-500/10 text-emerald-500 mb-4 border border-emerald-500/20">
                             <FileText size={32} />
                           </div>
                           <h4 className="font-bold text-white text-lg mb-1">Routine Monitor</h4>
                           <p className="text-xs text-gray-400 leading-relaxed">Symptoms appear manageable. Follow standard care protocols.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Results Grid */}
                <div className="grid grid-cols-1 gap-8">
                  <div>
                    <div className="flex items-center justify-between mb-6">
                       <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Primary Diagnosis</h3>
                    </div>
                    <ConditionCard condition={state.results.conditions[0]} rank={1} />
                  </div>

                  {state.results.conditions.length > 1 && (
                    <div>
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Differential Diagnoses</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {state.results.conditions.slice(1).map((condition, idx) => (
                          <ConditionCard key={idx} condition={condition} rank={idx + 2} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Report Modal */}
        {showReportModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-white rounded-xl w-full max-w-3xl h-[85vh] flex flex-col shadow-2xl animate-fade-in-up relative">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 bg-brand-primary flex items-center justify-center rounded-lg">
                      <FileText size={18} className="text-white" />
                   </div>
                   <div>
                     <h3 className="text-lg font-bold text-gray-900">Consultation Report</h3>
                     <p className="text-xs text-gray-500">Generated by LV Assistant Doctor</p>
                   </div>
                </div>
                <button onClick={() => setShowReportModal(false)} className="text-gray-400 hover:text-gray-700 transition-colors p-2">
                  <X size={20} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-8 bg-white">
                {generatingReport ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <div className="w-10 h-10 border-4 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin mb-4" />
                    <p className="text-sm animate-pulse">Compiling clinical data...</p>
                  </div>
                ) : (
                  <div 
                    className="prose prose-slate max-w-none"
                    dangerouslySetInnerHTML={{ __html: reportHtml }}
                  />
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-end gap-3">
                 <button 
                   onClick={() => setShowReportModal(false)}
                   className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
                 >
                   Close
                 </button>
                 <button 
                   onClick={printReport}
                   disabled={generatingReport}
                   className="flex items-center gap-2 px-6 py-2 bg-brand-primary hover:bg-purple-700 text-white text-sm font-bold rounded-lg transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   <Printer size={16} />
                   Print Document
                 </button>
              </div>
            </div>
          </div>
        )}

        {/* Contact Modal */}
        {showContactModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#0F0A1F] border border-brand-primary/20 rounded-2xl w-full max-w-md shadow-[0_0_50px_rgba(124,58,237,0.2)] relative overflow-hidden">
                {/* Background Effects */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-primary to-brand-accent"></div>
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-brand-primary/20 blur-[50px] rounded-full pointer-events-none"></div>
                
                <button 
                    onClick={() => setShowContactModal(false)}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10">
                        <Mail size={32} className="text-brand-accent" />
                    </div>
                    
                    <h3 className="text-2xl font-bold text-white mb-2">Contact Support</h3>
                    <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                        Have questions about your diagnosis or need technical assistance? Our LV Health specialists are ready to help.
                    </p>
                    
                    <div className="space-y-4">
                        <div className="p-4 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between group hover:border-brand-primary/30 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                                    <Mail size={14} />
                                </div>
                                <span className="text-gray-300 text-sm font-medium">lvhealthanalysis@gmail.com</span>
                            </div>
                            <button 
                                onClick={handleCopyEmail}
                                className="p-2 text-gray-500 hover:text-white transition-colors relative"
                                title="Copy to clipboard"
                            >
                                {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                            </button>
                        </div>
                        
                        <a 
                            href="mailto:lvhealthanalysis@gmail.com"
                            className="flex items-center justify-center gap-2 w-full py-3.5 bg-brand-primary hover:bg-purple-600 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/40 hover:-translate-y-0.5"
                        >
                            <ExternalLink size={16} />
                            Open Mail App
                        </a>
                    </div>
                    
                    <div className="mt-8 pt-6 border-t border-white/5">
                        <p className="text-[10px] text-gray-600 uppercase tracking-widest">
                            Average Response Time: &lt; 2 Hours
                        </p>
                    </div>
                </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default App;