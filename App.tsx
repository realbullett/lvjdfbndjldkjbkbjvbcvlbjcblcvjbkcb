import React, { useState, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { ConditionCard } from './components/ConditionCard';
import { analyzePatientSymptoms, generatePatientSample, generateClinicalReport, analyzeMedication } from './services/assistantDoctorService';
import { DiagnosisState, MedicationState, ViewMode } from './types';
import { Sparkles, AlertOctagon, ArrowRight, FileText, Printer, Stethoscope, Zap, X, Mail, Copy, Check, ExternalLink, Heart, Image as ImageIcon, Upload, Pill, Camera, Calendar, Factory, AlertTriangle, Info, ShieldCheck, Clock, Database } from 'lucide-react';
import { Analytics } from "@vercel/analytics/react";

const App: React.FC = () => {
  // View State
  const [view, setView] = useState<ViewMode>('diagnosis');

  // Inputs
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // Diagnosis State
  const [isGenerating, setIsGenerating] = useState(false);
  const [diagnosisState, setDiagnosisState] = useState<DiagnosisState>({
    results: null,
    loading: false,
    error: null,
  });

  // Medication State
  const [medicationState, setMedicationState] = useState<MedicationState>({
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

  // Camera State
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const resultsRef = useRef<HTMLDivElement>(null);
  const medResultsRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);

  // --- Spotlight Effect Logic ---
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (inputContainerRef.current) {
      const rect = inputContainerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      inputContainerRef.current.style.setProperty('--mouse-x', `${x}px`);
      inputContainerRef.current.style.setProperty('--mouse-y', `${y}px`);
    }
  };

  // --- Switching Logic ---
  const handleViewChange = (newView: ViewMode) => {
    setView(newView);
    handleClear(); // Reset inputs when switching
  };

  // --- Camera Logic ---
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(mediaStream);
      setShowCamera(true);
    } catch (err) {
      alert("Unable to access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  useEffect(() => {
    if (showCamera && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [showCamera, stream]);

  const captureImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        setSelectedImage(dataUrl);
        stopCamera();
      }
    }
  };

  // --- Diagnosis Logic ---
  const handleAnalyzeDiagnosis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !selectedImage) return;

    setDiagnosisState({ ...diagnosisState, loading: true, error: null });
    setReportHtml('');

    try {
      const promptText = input.trim() || "Please analyze the symptoms present in the attached image.";
      const data = await analyzePatientSymptoms(promptText, selectedImage || undefined);
      setDiagnosisState({
        results: data,
        loading: false,
        error: null,
      });
      
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      
    } catch (err: any) {
      setDiagnosisState({
        results: null,
        loading: false,
        error: err.message || "An error occurred during diagnosis.",
      });
    }
  };

  // --- Medication Logic ---
  const handleAnalyzeMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !selectedImage) return;

    setMedicationState({ ...medicationState, loading: true, error: null });

    try {
      const promptText = input.trim() || "Analyze this medication image.";
      const data = await analyzeMedication(promptText, selectedImage || undefined);
      setMedicationState({
        results: data,
        loading: false,
        error: null,
      });

      setTimeout(() => {
        medResultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);

    } catch (err: any) {
      setMedicationState({
        results: null,
        loading: false,
        error: err.message || "An error occurred during medication analysis.",
      });
    }
  };

  const handleGenerateSample = async () => {
    if (diagnosisState.loading || isGenerating) return;
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
    setDiagnosisState({ results: null, loading: false, error: null });
    setMedicationState({ results: null, loading: false, error: null });
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
    if (!diagnosisState.results) return;
    
    setShowReportModal(true);
    
    if (!reportHtml) {
      setGeneratingReport(true);
      try {
        const promptText = input.trim() || (selectedImage ? "Analysis based on provided medical image." : "");
        const html = await generateClinicalReport(diagnosisState.results, promptText);
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

  const isLoading = diagnosisState.loading || medicationState.loading;

  return (
    <div className="min-h-screen font-sans pb-20 selection:bg-brand-accent selection:text-white relative overflow-x-hidden">
      
      {/* Background Glow Elements */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] md:w-[1000px] h-[400px] md:h-[600px] bg-brand-primary opacity-10 blur-[80px] md:blur-[120px] rounded-full pointer-events-none z-0"></div>
      <div className="fixed bottom-0 right-0 w-[400px] md:w-[800px] h-[300px] md:h-[600px] bg-brand-accent opacity-5 blur-[80px] md:blur-[120px] rounded-full pointer-events-none z-0"></div>
      
      <Analytics />

      <Header onContactClick={() => setShowContactModal(true)} currentView={view} onViewChange={handleViewChange} />

      <main className="relative z-10 pt-28 md:pt-32 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Hero Section (Dynamic based on view) */}
        <div className="relative text-center max-w-3xl mx-auto mb-10 md:mb-16 animate-fade-in-up">
          
          {/* 3D Floating Stethoscope (Diagnosis) / Pill (Medication) */}
          <div className="hidden md:block absolute -top-24 -right-16 w-64 h-64 animate-float pointer-events-none select-none z-0 opacity-90 transition-opacity duration-500">
            <img 
              src={view === 'diagnosis' 
                ? "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Stethoscope.png"
                : "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Pill.png"
              }
              alt="3D Icon"
              className="w-full h-full object-contain drop-shadow-[0_0_35px_rgba(124,58,237,0.3)] rotate-12"
            />
          </div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-6 md:mb-8 shadow-lg backdrop-blur-sm hover:scale-105 transition-transform duration-300 cursor-default">
              {view === 'diagnosis' ? (
                <>
                  <Sparkles size={14} className="text-brand-accent animate-pulse" />
                  <span className="text-[10px] md:text-xs font-bold text-gray-300 uppercase tracking-widest">Neural Diagnostic Engine v2.0</span>
                </>
              ) : (
                <>
                  <Pill size={14} className="text-brand-accent animate-pulse" />
                  <span className="text-[10px] md:text-xs font-bold text-gray-300 uppercase tracking-widest">Pharmaceutical Vision AI</span>
                </>
              )}
            </div>
            
            <h2 className="text-4xl sm:text-5xl md:text-7xl font-bold text-white tracking-tight mb-4 md:mb-6 leading-tight">
              {view === 'diagnosis' ? 'Beyond Diagnosis.' : 'Know Your Meds.'}<br />
              <span className="text-gradient">{view === 'diagnosis' ? 'Absolute Clarity.' : 'Verified Purity.'}</span>
            </h2>
            <p className="text-base md:text-xl text-gray-400 leading-relaxed max-w-xl mx-auto font-light px-2">
              {view === 'diagnosis' 
                ? <><span className="text-white font-medium">PhD-Level Accuracy</span> for complex medical analysis. Powered by advanced neural networks.</>
                : <>Instantly analyze pharmaceutical compounds. Extract expiry, origin, and clinical data with <span className="text-white font-medium">100% Precision</span>.</>
              }
            </p>
          </div>
        </div>

        {/* Input Area with Spotlight */}
        <div className="max-w-4xl mx-auto mb-8 md:mb-12">
          <div 
            ref={inputContainerRef}
            onMouseMove={handleMouseMove}
            className="glass-panel rounded-2xl md:rounded-3xl overflow-hidden relative group transition-all duration-500 hover:shadow-[0_0_40px_rgba(124,58,237,0.2)] spotlight-card"
          >
            
            <form onSubmit={view === 'diagnosis' ? handleAnalyzeDiagnosis : handleAnalyzeMedication} className="p-0 relative z-20">
              <div className="relative flex flex-col">
                
                {/* Image Preview Section */}
                {selectedImage && (
                    <div className="px-5 md:px-8 pt-6 pb-2">
                        <div className="relative inline-block group animate-fade-in-up">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <img 
                                src={selectedImage} 
                                alt="Reference" 
                                className="h-24 md:h-32 w-auto rounded-lg border border-white/20 shadow-lg object-cover" 
                            />
                            <button 
                                type="button"
                                onClick={() => setSelectedImage(null)}
                                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-200 shadow-md transform hover:scale-110"
                            >
                                <X size={12} />
                            </button>
                            <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-white uppercase tracking-wide hidden md:block">
                                Attached Image
                            </div>
                        </div>
                    </div>
                )}

                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onPaste={handlePaste}
                  placeholder={view === 'diagnosis' 
                    ? "Describe symptoms in detail or paste a medical image... (e.g., 'Intermittent migraine with visual aura...')"
                    : "Enter medication name or capture an image of the packaging/pill... (e.g., 'Amoxicillin 500mg')"
                  }
                  className="w-full min-h-[150px] md:min-h-[180px] p-5 md:p-8 text-base md:text-xl text-gray-100 placeholder-gray-600 bg-transparent border-none outline-none resize-none focus:ring-0 leading-relaxed font-light"
                  disabled={isLoading}
                />
                
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between px-5 py-4 md:px-8 md:py-6 bg-black/20 border-t border-white/5 gap-4 backdrop-blur-md">
                  <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
                      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-gray-500">
                        <Zap size={12} className="text-yellow-500 animate-pulse" />
                        <span className="hidden sm:inline">AI Active</span>
                        <span className="sm:hidden">AI</span>
                      </div>
                      
                      <div className="h-4 w-px bg-white/10"></div>
                      
                      {/* Upload Button */}
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
                        disabled={isLoading}
                        className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-white transition-colors group"
                      >
                        <ImageIcon size={14} className="group-hover:text-brand-glow transition-colors" />
                        <span className="group-hover:text-gray-300 transition-colors">Upload</span>
                      </button>

                      {/* Camera Button for Medication View */}
                      {view === 'medication' && (
                        <>
                          <div className="h-4 w-px bg-white/10"></div>
                          <button
                            type="button"
                            onClick={startCamera}
                            disabled={isLoading}
                            className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-white transition-colors group"
                          >
                            <Camera size={14} className="group-hover:text-brand-accent transition-colors" />
                            <span className="group-hover:text-gray-300 transition-colors">Capture</span>
                          </button>
                        </>
                      )}

                      {view === 'diagnosis' && (
                         <>
                            <div className="h-4 w-px bg-white/10 md:hidden"></div>
                            <button 
                              type="button"
                              onClick={handleGenerateSample}
                              disabled={isLoading || isGenerating}
                              className="md:hidden flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-brand-accent transition-colors"
                            >
                              <Sparkles size={14} className={isGenerating ? "animate-spin" : ""} />
                              Example
                            </button>
                         </>
                      )}
                  </div>
                  
                  <div className="flex flex-col-reverse sm:flex-row items-center gap-4 w-full md:w-auto justify-end mt-2 md:mt-0">
                    
                    {view === 'diagnosis' && (
                      <button 
                        type="button"
                        onClick={handleGenerateSample}
                        disabled={isLoading || isGenerating}
                        className="hidden md:flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-brand-accent transition-colors px-2 py-2"
                      >
                        <Sparkles size={14} className={isGenerating ? "animate-spin" : ""} />
                        {isGenerating ? "Simulating Case..." : "Generate Case"}
                      </button>
                    )}

                    {(input || selectedImage) && (
                      <button
                        type="button"
                        onClick={handleClear}
                        className="text-sm font-medium text-gray-500 hover:text-white px-4 py-2 transition-colors w-full sm:w-auto"
                        disabled={isLoading}
                      >
                        Reset
                      </button>
                    )}
                    
                    <button
                      type="submit"
                      disabled={isLoading || (!input.trim() && !selectedImage)}
                      className={`
                        group relative w-full sm:w-auto overflow-hidden rounded-xl px-8 py-3 md:py-4 font-bold text-white transition-all duration-300
                        ${isLoading || (!input.trim() && !selectedImage)
                          ? 'bg-gray-800 cursor-not-allowed text-gray-600 opacity-50 shadow-none'
                          : view === 'diagnosis' 
                              ? 'bg-gradient-to-r from-brand-primary to-brand-accent shadow-[0_6px_0_rgb(76,29,149)] hover:shadow-[0_8px_0_rgb(76,29,149)] hover:-translate-y-1 active:shadow-none active:translate-y-[6px]'
                              : 'bg-gradient-to-r from-pink-600 to-purple-600 shadow-[0_6px_0_rgb(157,23,77)] hover:shadow-[0_8px_0_rgb(157,23,77)] hover:-translate-y-1 active:shadow-none active:translate-y-[6px]'
                        }
                      `}
                    >
                      {!isLoading && (input.trim() || selectedImage) && (
                         <div className="absolute inset-0 -translate-x-full group-hover:animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent z-10" />
                      )}

                      <div className="relative z-20 flex items-center justify-center gap-2">
                        {isLoading ? (
                          <>
                            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span className="text-sm tracking-widest uppercase drop-shadow-md">Analyzing Data</span>
                          </>
                        ) : (
                          <>
                            <span className="text-sm tracking-widest uppercase drop-shadow-md group-hover:scale-105 transition-transform">
                                {view === 'diagnosis' ? 'Initialize Diagnosis' : 'Analyze Composition'}
                            </span>
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

        {/* Trust Bar */}
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 mb-16 px-4">
          <div className="flex items-center gap-3 justify-center md:justify-start opacity-60 hover:opacity-100 transition-opacity cursor-default">
            <ShieldCheck size={20} className="text-brand-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-gray-300">Evidence Based</span>
          </div>
          <div className="flex items-center gap-3 justify-center md:justify-start opacity-60 hover:opacity-100 transition-opacity cursor-default">
            <Clock size={20} className="text-brand-accent" />
            <span className="text-xs font-bold uppercase tracking-wider text-gray-300">Real-time Analysis</span>
          </div>
          <div className="flex items-center gap-3 justify-center md:justify-start opacity-60 hover:opacity-100 transition-opacity cursor-default">
            <Database size={20} className="text-blue-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-gray-300">10M+ Records</span>
          </div>
          <div className="flex items-center gap-3 justify-center md:justify-start opacity-60 hover:opacity-100 transition-opacity cursor-default">
            <Sparkles size={20} className="text-yellow-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-gray-300">PhD Accuracy</span>
          </div>
        </div>

        {/* Support Section */}
        {!diagnosisState.results && !medicationState.results && !isLoading && (
          <div className="max-w-2xl mx-auto text-center -mt-8 md:-mt-12 mb-24 px-4 md:px-6 opacity-80 hover:opacity-100 transition-opacity duration-500">
             <div className="inline-flex items-center gap-2 text-brand-primary mb-4 bg-brand-primary/5 px-4 py-1.5 rounded-full border border-brand-primary/10 hover:bg-brand-primary/10 transition-colors cursor-pointer">
                <Heart size={14} className="fill-brand-primary/20" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Support Our Mission</span>
             </div>
             <p className="text-gray-400 text-xs md:text-sm leading-relaxed">
               Help us democratize precision health. If LV Health has empowered you, please consider sharing <span className="text-white font-medium">Assistant Doctor</span> with friends and family.
             </p>
          </div>
        )}

        {/* --- Diagnosis Results --- */}
        {view === 'diagnosis' && (diagnosisState.results || diagnosisState.error) && (
          <div ref={resultsRef} className="animate-fade-in-up space-y-8 md:space-y-10 pb-20">
            {diagnosisState.error ? (
               <div className="max-w-2xl mx-auto bg-red-900/20 border border-red-500/30 rounded-2xl p-6 md:p-8 text-center backdrop-blur-sm animate-pulse-slow">
                 <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                   <AlertOctagon size={24} />
                 </div>
                 <h3 className="text-lg font-bold text-red-200 mb-2">Analysis Interrupted</h3>
                 <p className="text-red-400/80 text-sm">{diagnosisState.error}</p>
               </div>
            ) : diagnosisState.results && (
              <>
                {/* Diagnosis Content */}
                <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8 border-b border-white/10 pb-6">
                  <div className="flex items-center gap-4">
                    <div className="bg-brand-primary/20 p-3 rounded-xl text-brand-glow border border-brand-primary/30 shadow-[0_0_15px_rgba(124,58,237,0.2)]">
                        <Stethoscope size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl md:text-2xl font-bold text-white">Clinical Report</h2>
                        <p className="text-xs md:text-sm text-gray-500">ID: {Math.random().toString(36).substr(2, 9).toUpperCase()} • LV Health AI</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleViewReport}
                    className="ml-auto w-full md:w-auto flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white bg-white/5 border border-white/10 hover:border-white/30 px-5 py-2.5 rounded-lg transition-all group hover:bg-white/10"
                  >
                    <FileText size={14} className="text-brand-accent group-hover:scale-110 transition-transform" />
                    Detailed Report
                  </button>
                </div>

                <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 md:p-8 border border-white/10 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-brand-primary/20 rounded-full blur-[80px] transform translate-x-1/2 -translate-y-1/2 group-hover:bg-brand-primary/25 transition-colors duration-500"></div>
                  <div className="relative z-10 flex flex-col md:grid md:grid-cols-3 gap-6 md:gap-10">
                    <div className="md:col-span-2 space-y-6">
                      <div className="flex items-center gap-2 text-brand-accent text-xs font-bold uppercase tracking-widest">
                        <Sparkles size={14} />
                        Synopsis
                      </div>
                      <p className="text-base md:text-lg text-gray-200 leading-relaxed font-light">
                        {diagnosisState.results.general_advice}
                      </p>
                      <div className="pt-4">
                        <div className="inline-block bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-[11px] text-red-300 uppercase tracking-wider w-full md:w-auto hover:bg-red-500/15 transition-colors">
                           <span className="font-bold text-red-400 mr-2 block md:inline">DISCLAIMER:</span> {diagnosisState.results.disclaimer}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col justify-center border-t md:border-t-0 md:border-l border-white/5 pt-6 md:pt-0 pl-0 md:pl-10">
                      {diagnosisState.results.conditions.some(c => ['High', 'Critical'].includes(c.urgency)) ? (
                        <div className="text-center">
                          <div className="inline-flex p-4 rounded-full bg-red-500/10 text-red-500 mb-4 animate-pulse border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                             <AlertOctagon size={32} />
                          </div>
                          <h4 className="font-bold text-white text-lg mb-1">Immediate Action</h4>
                          <p className="text-xs text-gray-400 leading-relaxed">Symptoms suggest high priority conditions. Please consult a specialist.</p>
                        </div>
                      ) : (
                        <div className="text-center">
                           <div className="inline-flex p-4 rounded-full bg-emerald-500/10 text-emerald-500 mb-4 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                             <FileText size={32} />
                           </div>
                           <h4 className="font-bold text-white text-lg mb-1">Routine Monitor</h4>
                           <p className="text-xs text-gray-400 leading-relaxed">Symptoms appear manageable. Follow standard care protocols.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-8">
                  <div>
                    <div className="flex items-center justify-between mb-6">
                       <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Primary Diagnosis</h3>
                    </div>
                    <ConditionCard condition={diagnosisState.results.conditions[0]} rank={1} />
                  </div>

                  {diagnosisState.results.conditions.length > 1 && (
                    <div>
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Differential Diagnoses</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {diagnosisState.results.conditions.slice(1).map((condition, idx) => (
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

        {/* --- Medication Results --- */}
        {view === 'medication' && (medicationState.results || medicationState.error) && (
           <div ref={medResultsRef} className="animate-slide-up-fade space-y-8 pb-20">
             {medicationState.error ? (
               <div className="max-w-2xl mx-auto bg-red-900/20 border border-red-500/30 rounded-2xl p-6 text-center">
                 <p className="text-red-400">{medicationState.error}</p>
               </div>
             ) : medicationState.results && (
               <>
                  {/* Monograph Header */}
                  <div className="glass-panel rounded-3xl p-8 relative overflow-hidden border-l-4 border-l-brand-accent group">
                    <div className="absolute top-0 right-0 p-6 opacity-10 transition-opacity group-hover:opacity-20 duration-500">
                      <Factory size={120} className="text-white" />
                    </div>
                    
                    <div className="relative z-10">
                      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
                         <div>
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-1">{medicationState.results.medication.name}</h2>
                            <p className="text-xl text-brand-accent font-light">{medicationState.results.medication.generic_name}</p>
                         </div>
                         <div className="bg-white/5 px-4 py-2 rounded-lg border border-white/10 hover:border-white/20 transition-colors">
                            <span className="text-xs text-gray-400 block uppercase tracking-wider mb-1">Analysis Confidence</span>
                            <div className="flex items-center gap-2">
                               <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                                  <div style={{width: `${medicationState.results.analysis_confidence}%`}} className="h-full bg-brand-accent rounded-full shadow-[0_0_10px_rgba(217,70,239,0.5)]" />
                                </div>
                                <span className="text-white font-bold">{medicationState.results.analysis_confidence}%</span>
                            </div>
                         </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                        {/* Manufacturer */}
                        <div className="bg-black/20 p-4 rounded-xl border border-white/5 hover:border-white/20 transition-colors">
                           <div className="flex items-center gap-2 text-gray-400 mb-2">
                              <Factory size={14} />
                              <span className="text-xs font-bold uppercase tracking-wider">Manufacturer</span>
                           </div>
                           <p className="text-white font-medium">{medicationState.results.medication.manufacturer.name}</p>
                           <div className="flex gap-2 mt-2 text-xs text-gray-500">
                              <span>Origin: {medicationState.results.medication.manufacturer.country_of_origin}</span>
                           </div>
                        </div>

                        {/* Dates */}
                        <div className="bg-black/20 p-4 rounded-xl border border-white/5 hover:border-white/20 transition-colors">
                           <div className="flex items-center gap-2 text-gray-400 mb-2">
                              <Calendar size={14} />
                              <span className="text-xs font-bold uppercase tracking-wider">Dates (From Image)</span>
                           </div>
                           <div className="space-y-1">
                             <div className="flex justify-between text-sm">
                               <span className="text-gray-500">Mfg Date:</span>
                               <span className="text-white">{medicationState.results.medication.dates.production_date}</span>
                             </div>
                             <div className="flex justify-between text-sm">
                               <span className="text-gray-500">Exp Date:</span>
                               <span className={`font-bold ${medicationState.results.medication.dates.expiry_date.includes('Not') ? 'text-gray-400' : 'text-brand-accent'}`}>
                                 {medicationState.results.medication.dates.expiry_date}
                               </span>
                             </div>
                           </div>
                        </div>
                        
                        {/* Specs */}
                         <div className="bg-black/20 p-4 rounded-xl border border-white/5 hover:border-white/20 transition-colors">
                           <div className="flex items-center gap-2 text-gray-400 mb-2">
                              <Info size={14} />
                              <span className="text-xs font-bold uppercase tracking-wider">Specifications</span>
                           </div>
                           <p className="text-white text-sm"><span className="text-gray-500">Type:</span> {medicationState.results.medication.specifications.type}</p>
                           <p className="text-white text-sm"><span className="text-gray-500">Dosage:</span> {medicationState.results.medication.specifications.dosage}</p>
                           <p className="text-white text-sm truncate" title={medicationState.results.medication.specifications.composition}><span className="text-gray-500">Active:</span> {medicationState.results.medication.specifications.composition}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Clinical Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {/* Uses */}
                     <div className="glass-panel p-6 rounded-2xl border-t border-t-brand-primary/50 hover:bg-white/5 transition-colors">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                          <Check size={18} className="text-brand-primary" /> Official Indications
                        </h3>
                        <ul className="space-y-2">
                          {medicationState.results.medication.clinical_info.uses.map((use, i) => (
                            <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-brand-primary mt-1.5 shrink-0" />
                              {use}
                            </li>
                          ))}
                        </ul>
                     </div>

                     {/* Administration */}
                     <div className="glass-panel p-6 rounded-2xl hover:bg-white/5 transition-colors">
                        <h3 className="text-lg font-bold text-white mb-4">Administration Guide</h3>
                        <p className="text-gray-300 text-sm leading-relaxed">
                          {medicationState.results.medication.clinical_info.administration_guide}
                        </p>
                     </div>

                     {/* Warnings */}
                     <div className="glass-panel p-6 rounded-2xl border border-red-500/20 bg-red-900/5 hover:bg-red-900/10 transition-colors">
                        <h3 className="text-lg font-bold text-red-200 mb-4 flex items-center gap-2">
                          <AlertTriangle size={18} className="text-red-400" /> Critical Warnings
                        </h3>
                         <p className="text-gray-300 text-sm leading-relaxed">
                          {medicationState.results.medication.clinical_info.warnings}
                        </p>
                     </div>

                      {/* Side Effects */}
                     <div className="glass-panel p-6 rounded-2xl hover:bg-white/5 transition-colors">
                        <h3 className="text-lg font-bold text-white mb-4">Potential Side Effects</h3>
                        <div className="flex flex-wrap gap-2">
                           {medicationState.results.medication.clinical_info.side_effects.map((effect, i) => (
                             <span key={i} className="text-xs bg-white/5 text-gray-400 px-3 py-1 rounded-full border border-white/10">
                               {effect}
                             </span>
                           ))}
                        </div>
                     </div>
                  </div>
                  
                  <div className="text-center text-xs text-gray-500 mt-8 max-w-2xl mx-auto">
                    {medicationState.results.disclaimer}
                  </div>
               </>
             )}
           </div>
        )}

        {/* Report Modal (Diagnosis Only) */}
        {showReportModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-white rounded-xl w-[95%] md:w-full max-w-3xl h-[85vh] flex flex-col shadow-2xl animate-slide-up-fade relative">
              <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 bg-brand-primary flex items-center justify-center rounded-lg shrink-0">
                      <FileText size={18} className="text-white" />
                   </div>
                   <div>
                     <h3 className="text-base md:text-lg font-bold text-gray-900">Consultation Report</h3>
                     <p className="text-[10px] md:text-xs text-gray-500">Generated by LV Assistant Doctor</p>
                   </div>
                </div>
                <button onClick={() => setShowReportModal(false)} className="text-gray-400 hover:text-gray-700 transition-colors p-2">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-white">
                {generatingReport ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <div className="w-10 h-10 border-4 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin mb-4" />
                    <p className="text-sm animate-pulse">Compiling clinical data...</p>
                  </div>
                ) : (
                  <div 
                    className="prose prose-slate max-w-none prose-sm md:prose-base"
                    dangerouslySetInnerHTML={{ __html: reportHtml }}
                  />
                )}
              </div>
              <div className="px-4 md:px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-end gap-3">
                 <button 
                   onClick={() => setShowReportModal(false)}
                   className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
                 >
                   Close
                 </button>
                 <button 
                   onClick={printReport}
                   disabled={generatingReport}
                   className="flex items-center gap-2 px-4 md:px-6 py-2 bg-brand-primary hover:bg-purple-700 text-white text-sm font-bold rounded-lg transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   <Printer size={16} />
                   <span className="hidden sm:inline">Print Document</span>
                   <span className="sm:hidden">Print</span>
                 </button>
              </div>
            </div>
          </div>
        )}

        {/* Contact Modal */}
        {showContactModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#0F0A1F] border border-brand-primary/20 rounded-2xl w-full max-w-md shadow-[0_0_50px_rgba(124,58,237,0.2)] relative overflow-hidden animate-slide-up-fade">
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
                        <div className="p-4 bg-white/5 rounded-xl border border-white/10 flex flex-col sm:flex-row items-center justify-between group hover:border-brand-primary/30 transition-colors gap-2 sm:gap-0">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0">
                                    <Mail size={14} />
                                </div>
                                <span className="text-gray-300 text-sm font-medium break-all">lvhealthanalysis@gmail.com</span>
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
        
        {/* Camera Modal */}
        {showCamera && (
          <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center animate-fade-in">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <div className="absolute bottom-10 flex gap-6 items-center">
               <button 
                 onClick={stopCamera} 
                 className="bg-gray-800 text-white p-4 rounded-full hover:bg-gray-700 transition-colors border border-white/10"
               >
                 <X size={24} />
               </button>
               <button 
                 onClick={captureImage} 
                 className="bg-white border-4 border-gray-300 w-20 h-20 rounded-full hover:scale-105 transition-transform shadow-lg"
               />
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default App;