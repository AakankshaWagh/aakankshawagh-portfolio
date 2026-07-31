import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { 
  Download, Copy, Check, Search, Calendar, 
  FileCode, Image as ImageIcon, BookOpen, Loader2, RefreshCw 
} from 'lucide-react';
import JSZip from 'jszip';

interface CodeFile {
  filename: string;
  content: string;
  language: string;
}

interface Practical {
  id: string;
  created_at: string;
  date: string;
  title: string;
  description: string;
  subject: string;
  code_files: CodeFile[];
  image_urls: string[];
}

const Practicals = () => {
  const [practicals, setPracticals] = useState<Practical[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  
  // UI helper state: track copy notifications & active tabs per practical card
  // key: practicalId, value: activeFileIndex
  const [activeTabMap, setActiveTabMap] = useState<Record<string, number>>({});
  // key: practicalId + '_' + fileIndex, value: boolean
  const [copiedMap, setCopiedMap] = useState<Record<string, boolean>>({});
  // key: practicalId, value: boolean (loading state for zip downloads)
  const [downloadingZipMap, setDownloadingZipMap] = useState<Record<string, boolean>>({});

  const handleDownloadZip = async (prac: Practical) => {
    setDownloadingZipMap(prev => ({ ...prev, [prac.id]: true }));
    try {
      const zip = new JSZip();

      // 1. Add code files
      if (prac.code_files && prac.code_files.length > 0) {
        const codeFolder = zip.folder("code");
        prac.code_files.forEach(file => {
          if (codeFolder) {
            codeFolder.file(file.filename, file.content);
          }
        });
      }

      // 2. Fetch and add output screenshots
      if (prac.image_urls && prac.image_urls.length > 0) {
        const imagesFolder = zip.folder("output_images");
        for (let i = 0; i < prac.image_urls.length; i++) {
          const url = prac.image_urls[i];
          try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Fetch failed');
            const blob = await response.blob();
            
            // Get proper file extension
            const ext = url.split('.').pop()?.split('?')[0] || 'png';
            if (imagesFolder) {
              imagesFolder.file(`screenshot_${i + 1}.${ext}`, blob);
            }
          } catch (err) {
            console.error(`Failed to pack image in zip: ${url}`, err);
          }
        }
      }

      // 3. Generate ZIP blob with explicit MIME type
      const zipBlob = await zip.generateAsync({ 
        type: 'blob',
        mimeType: 'application/zip'
      });
      
      // 4. Download in browser with delay to ensure Chrome respects the download attribute
      const element = document.createElement("a");
      const file = new Blob([zipBlob], { type: 'application/zip' });
      const objectUrl = URL.createObjectURL(file);
      
      element.href = objectUrl;
      const sanitizedTitle = (prac.title || 'practical').toLowerCase().replace(/[^a-z0-9]/g, '-');
      element.download = `${sanitizedTitle}.zip`;
      
      document.body.appendChild(element);
      
      setTimeout(() => {
        element.click();
        document.body.removeChild(element);
        // Clean up the URL resource after the download has started
        setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
      }, 100);

    } catch (err: any) {
      alert("Failed to build ZIP file: " + err.message);
    } finally {
      setDownloadingZipMap(prev => ({ ...prev, [prac.id]: false }));
    }
  };

  useEffect(() => {
    fetchPracticals();
  }, []);

  const fetchPracticals = async () => {
    try {
      setLoading(true);
      setError('');
      const { data, error } = await supabase
        .from('practicals')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setPracticals(data || []);

      // Initialize default active tabs
      const initialTabs: Record<string, number> = {};
      (data || []).forEach(p => {
        initialTabs[p.id] = 0;
      });
      setActiveTabMap(initialTabs);
    } catch (err: any) {
      console.error('Error fetching practicals:', err.message);
      setError('Could not retrieve practicals. Please make sure the Supabase database is set up.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (practicalId: string, fileIndex: number, text: string) => {
    navigator.clipboard.writeText(text);
    const key = `${practicalId}_${fileIndex}`;
    setCopiedMap(prev => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopiedMap(prev => ({ ...prev, [key]: false }));
    }, 2000);
  };

  const handleDownloadFile = (filename: string, content: string) => {
    const element = document.createElement("a");
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDownloadImage = async (url: string, index: number, title: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const element = document.createElement("a");
      element.href = URL.createObjectURL(blob);
      const ext = url.split('.').pop()?.split('?')[0] || 'png';
      element.download = `${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-screenshot-${index + 1}.${ext}`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (err) {
      // Fallback in case of CORS restriction
      window.open(url, '_blank');
    }
  };

  // Get unique subjects for filter dropdown
  const subjects = ['All', ...Array.from(new Set(practicals.map(p => p.subject).filter(Boolean)))];

  // Filtering Logic
  const filteredPracticals = practicals.filter(p => {
    const matchesSearch = 
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = selectedSubject === 'All' || p.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-5xl mx-auto px-6 py-12"
    >
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12 border-b border-white/5 pb-8">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Daily Practicals</h2>
          <p className="text-slate-400 font-mono text-sm">Downloadable code snippets, labs, and outputs updated daily.</p>
        </div>
        <button 
          onClick={fetchPracticals}
          className="flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-primary transition-colors bg-white/5 border border-white/5 hover:border-primary/20 px-3 py-2 rounded-lg"
          title="Refresh entries"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="relative md:col-span-2">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search practicals by title or description..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-dark-800/40 border border-white/5 focus:border-primary/30 rounded-xl py-3 pl-11 pr-4 text-sm text-white outline-none transition-colors"
          />
        </div>
        <div>
          <select
            value={selectedSubject}
            onChange={e => setSelectedSubject(e.target.value)}
            className="w-full bg-dark-800/40 border border-white/5 focus:border-primary/30 rounded-xl py-3 px-4 text-sm text-slate-300 outline-none transition-colors cursor-pointer"
          >
            {subjects.map(sub => (
              <option key={sub} value={sub} className="bg-dark-800 text-white">
                {sub}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <span className="text-slate-400 font-mono text-xs">Fetching learning resources...</span>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="border border-dashed border-red-500/20 bg-red-950/10 p-8 rounded-xl text-center max-w-xl mx-auto space-y-4">
          <p className="text-red-400 font-mono text-sm">{error}</p>
          <p className="text-xs text-slate-500">
            Ensure that you have run the database creation SQL scripts inside your Supabase project editor.
          </p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredPracticals.length === 0 && (
        <div className="border border-dashed border-white/10 rounded-2xl p-16 text-center bg-white/5">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="font-mono text-sm text-slate-400 mb-2">No practical exercises found.</p>
          <p className="text-xs text-slate-500">
            {searchTerm || selectedSubject !== 'All' ? 'Try adjusting your search filters.' : 'Check back later for updates.'}
          </p>
        </div>
      )}

      {/* Practicals Cards Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 gap-12">
          {filteredPracticals.map((prac) => {
            const activeFileIndex = activeTabMap[prac.id] ?? 0;
            const activeFile = prac.code_files?.[activeFileIndex] as CodeFile | undefined;
            const hasFiles = prac.code_files && prac.code_files.length > 0;
            const hasImages = prac.image_urls && prac.image_urls.length > 0;

            return (
              <motion.article 
                key={prac.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-dark-800/40 border border-white/5 rounded-2xl overflow-hidden hover:border-primary/20 transition-all shadow-xl shadow-black/10"
              >
                {/* Header Information */}
                <div className="p-6 md:p-8 border-b border-white/5">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono uppercase tracking-wider px-3 py-1 rounded bg-primary/10 border border-primary/20 text-primary">
                        {prac.subject}
                      </span>
                      <div className="flex items-center gap-1.5 text-slate-500 text-xs font-mono">
                        <Calendar className="w-4 h-4" />
                        {prac.date}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDownloadZip(prac)}
                      disabled={downloadingZipMap[prac.id]}
                      className="flex items-center gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-dark-900 font-bold font-mono text-xs px-4 py-2 rounded-lg transition-all disabled:opacity-50 shadow-md shadow-primary/5"
                    >
                      {downloadingZipMap[prac.id] ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                      Download ZIP Pack
                    </button>
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-3">{prac.title}</h3>
                  <p className="text-slate-400 text-sm md:text-base leading-relaxed">{prac.description}</p>
                </div>

                {/* Main Content Area (Code + Images) */}
                <div className="grid grid-cols-1 lg:grid-cols-12">
                  
                  {/* Code Viewer Panel */}
                  <div className={`p-0 bg-black/35 ${hasImages ? 'lg:col-span-8' : 'lg:col-span-12'} border-r border-white/5`}>
                    {hasFiles ? (
                      <div>
                        {/* File Tabs Navigation */}
                        <div className="flex items-center justify-between border-b border-white/5 bg-black/20 px-4">
                          <div className="flex overflow-x-auto gap-1 py-2">
                            {prac.code_files.map((file, fIdx) => (
                              <button
                                key={fIdx}
                                onClick={() => setActiveTabMap(prev => ({ ...prev, [prac.id]: fIdx }))}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all border whitespace-nowrap ${
                                  activeFileIndex === fIdx 
                                    ? 'bg-primary/10 border-primary/20 text-white' 
                                    : 'border-transparent text-slate-500 hover:text-slate-300'
                                }`}
                              >
                                <FileCode className="w-3.5 h-3.5" />
                                {file.filename}
                              </button>
                            ))}
                          </div>

                          {/* Tab Controls (Copy / Download) */}
                          {activeFile && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleCopyCode(prac.id, activeFileIndex, activeFile.content)}
                                className="p-2 text-slate-400 hover:text-white transition-colors"
                                title="Copy code"
                              >
                                {copiedMap[`${prac.id}_${activeFileIndex}`] ? (
                                  <Check className="w-4 h-4 text-green-400" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={() => handleDownloadFile(activeFile.filename, activeFile.content)}
                                className="p-2 text-slate-400 hover:text-white transition-colors"
                                title="Download code file"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Syntax Highlighted Area */}
                        {activeFile && (
                          <div className="max-h-[35rem] overflow-y-auto text-xs sm:text-sm">
                            <SyntaxHighlighter 
                              language={activeFile.language || 'javascript'} 
                              style={atomDark}
                              customStyle={{
                                margin: 0,
                                background: 'transparent',
                                padding: '1.5rem',
                                border: 'none',
                                fontFamily: '"Fira Code", "JetBrains Mono", monospace'
                              }}
                            >
                              {activeFile.content}
                            </SyntaxHighlighter>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-slate-600 font-mono text-xs">
                        No code files attached to this practical.
                      </div>
                    )}
                  </div>

                  {/* Output Image Screen Panel */}
                  {hasImages && (
                    <div className="lg:col-span-4 p-6 bg-black/20 flex flex-col justify-start gap-4">
                      <h4 className="text-xs font-mono uppercase tracking-wider text-slate-500 flex items-center gap-1.5 border-b border-white/5 pb-2">
                        <ImageIcon className="w-4 h-4" />
                        Output Screen
                      </h4>

                      <div className="space-y-4 max-h-[32rem] overflow-y-auto pr-1">
                        {prac.image_urls.map((url, imgIdx) => (
                          <div key={imgIdx} className="group relative rounded-xl border border-white/5 overflow-hidden bg-black/40 aspect-video shadow-md">
                            <img 
                              src={url} 
                              alt={`${prac.title} output screenshot`} 
                              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                              loading="lazy"
                            />
                            
                            {/* Download overlay */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity">
                              <button
                                onClick={() => handleDownloadImage(url, imgIdx, prac.title)}
                                className="flex items-center gap-1.5 bg-white text-dark-900 font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-slate-200 transition-colors shadow-lg"
                              >
                                <Download className="w-3.5 h-3.5" />
                                Download Output
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </motion.article>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default Practicals;
