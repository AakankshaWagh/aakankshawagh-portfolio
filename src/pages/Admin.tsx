import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash, LogOut, Edit, Save, Upload, X, 
  FileCode, Image as ImageIcon, Loader2, Calendar, BookOpen
} from 'lucide-react';

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

const SUPPORTED_LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'css', label: 'CSS' },
  { value: 'html', label: 'HTML' },
  { value: 'sql', label: 'SQL' },
  { value: 'bash', label: 'Bash/Shell' },
  { value: 'json', label: 'JSON' },
  { value: 'markdown', label: 'Markdown' }
];

const Admin = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Auth state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Practicals list state
  const [practicals, setPracticals] = useState<Practical[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [activePractical, setActivePractical] = useState<Partial<Practical> | null>(null);
  
  // Form input states
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formSubject, setFormSubject] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formCodeFiles, setFormCodeFiles] = useState<CodeFile[]>([]);
  const [formImageUrls, setFormImageUrls] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (session) fetchPracticals();
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchPracticals();
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchPracticals = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('practicals')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setPracticals(data || []);
    } catch (err: any) {
      console.error('Error fetching practicals:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (err: any) {
      setAuthError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setPracticals([]);
  };

  // Open Form for Create
  const handleAddNew = () => {
    setActivePractical(null);
    setFormTitle('');
    setFormDesc('');
    setFormSubject('Web Development');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormCodeFiles([{ filename: 'index.js', content: '// Write your code here', language: 'javascript' }]);
    setFormImageUrls([]);
    setIsEditing(true);
  };

  // Open Form for Edit
  const handleEdit = (prac: Practical) => {
    setActivePractical(prac);
    setFormTitle(prac.title);
    setFormDesc(prac.description);
    setFormSubject(prac.subject || '');
    setFormDate(prac.date);
    setFormCodeFiles(prac.code_files || []);
    setFormImageUrls(prac.image_urls || []);
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this practical?')) return;
    try {
      const { error } = await supabase.from('practicals').delete().eq('id', id);
      if (error) throw error;
      fetchPracticals();
    } catch (err: any) {
      alert('Delete failed: ' + err.message);
    }
  };

  // Dynamic code file actions
  const handleAddCodeFile = () => {
    setFormCodeFiles([
      ...formCodeFiles,
      { filename: 'file.js', content: '', language: 'javascript' }
    ]);
  };

  const handleRemoveCodeFile = (index: number) => {
    setFormCodeFiles(formCodeFiles.filter((_, i) => i !== index));
  };

  const handleCodeFileChange = (index: number, key: keyof CodeFile, value: string) => {
    const updated = [...formCodeFiles];
    updated[index] = { ...updated[index], [key]: value };
    setFormCodeFiles(updated);
  };

  // Image Upload Action
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('practical-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('practical-images')
          .getPublicUrl(filePath);

        setFormImageUrls(prev => [...prev, publicUrl]);
      }
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImageUrl = (index: number) => {
    setFormImageUrls(formImageUrls.filter((_, i) => i !== index));
  };

  // Save/Submit Form
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formDesc) {
      alert('Please fill out Title and Description.');
      return;
    }

    setSaveLoading(true);
    const practicalData = {
      title: formTitle,
      description: formDesc,
      subject: formSubject,
      date: formDate || new Date().toISOString().split('T')[0],
      code_files: formCodeFiles,
      image_urls: formImageUrls
    };

    try {
      if (activePractical?.id) {
        // Update
        const { error } = await supabase
          .from('practicals')
          .update(practicalData)
          .eq('id', activePractical.id);
        if (error) throw error;
      } else {
        // Create
        const { error } = await supabase
          .from('practicals')
          .insert([practicalData]);
        if (error) throw error;
      }

      setIsEditing(false);
      setActivePractical(null);
      fetchPracticals();
    } catch (err: any) {
      alert('Save failed: ' + err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  // Render Login Form
  if (!session && !loading) {
    return (
      <div className="max-w-md mx-auto px-6 py-20 flex flex-col justify-center min-h-[calc(100vh-80px)]">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-dark-800/50 backdrop-blur-md border border-white/5 p-8 rounded-2xl shadow-xl shadow-black/30"
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Admin Area</h2>
            <p className="text-slate-400 text-sm mt-2">Log in to add or update your daily practicals.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">Email Address</label>
              <input 
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-black/40 border border-white/10 focus:border-primary/50 text-white rounded-lg p-3 outline-none transition-colors text-sm font-mono"
                placeholder="your.email@domain.com"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">Password</label>
              <input 
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-black/40 border border-white/10 focus:border-primary/50 text-white rounded-lg p-3 outline-none transition-colors text-sm font-mono"
                placeholder="••••••••••••"
              />
            </div>

            {authError && (
              <div className="p-3 bg-red-950/40 border border-red-500/20 text-red-400 text-xs font-mono rounded-lg">
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-95 text-dark-900 font-bold font-mono text-sm uppercase py-3 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Authenticate'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // Render main dashboard or editor
  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-8 mb-12">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Practicals Management</h2>
          <p className="text-slate-400 font-mono text-sm">Create, update, and manage student learning materials.</p>
        </div>
        {session && (
          <div className="flex gap-4 items-center">
            <span className="text-slate-400 text-xs font-mono bg-white/5 border border-white/5 px-3 py-1.5 rounded-lg">
              {session.user.email}
            </span>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-950/20 border border-red-500/20 text-red-400 hover:bg-red-900/20 hover:border-red-500/40 px-4 py-2 rounded-lg font-mono text-xs transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
      )}

      {/* Editor Screen */}
      <AnimatePresence>
        {!loading && isEditing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-dark-800/50 backdrop-blur-md border border-white/5 p-8 rounded-2xl shadow-xl shadow-black/20 mb-8"
          >
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 border-b border-white/5 pb-4">
              {activePractical ? <Edit className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5 text-primary" />}
              {activePractical ? 'Edit Practical' : 'Add New Daily Practical'}
            </h3>

            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">Title</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={e => setFormTitle(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 focus:border-primary/50 text-white rounded-lg p-3 outline-none transition-colors text-sm"
                    placeholder="e.g., Build a Custom Custom React Hooks"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">Subject / Category</label>
                  <input
                    type="text"
                    required
                    value={formSubject}
                    onChange={e => setFormSubject(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 focus:border-primary/50 text-white rounded-lg p-3 outline-none transition-colors text-sm"
                    placeholder="e.g., Web Development"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">Description</label>
                  <textarea
                    required
                    value={formDesc}
                    onChange={e => setFormDesc(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 focus:border-primary/50 text-white rounded-lg p-3 outline-none transition-colors text-sm h-24"
                    placeholder="A descriptive overview of this exercise, instructions, learning objectives..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">Date</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 focus:border-primary/50 text-white rounded-lg p-3 outline-none transition-colors text-sm font-mono"
                  />
                </div>
              </div>

              {/* Code Files List */}
              <div className="border-t border-white/5 pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-md font-bold text-white flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-primary" />
                    Code Files ({formCodeFiles.length})
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddCodeFile}
                    className="flex items-center gap-1.5 bg-white/5 border border-white/10 hover:border-primary/30 hover:text-white px-3 py-1.5 rounded-lg text-xs font-mono transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add File
                  </button>
                </div>

                <div className="space-y-4">
                  {formCodeFiles.map((file, index) => (
                    <div key={index} className="bg-black/30 border border-white/5 p-4 rounded-xl relative space-y-4">
                      <button
                        type="button"
                        onClick={() => handleRemoveCodeFile(index)}
                        className="absolute top-4 right-4 text-slate-500 hover:text-red-400 transition-colors p-1"
                        title="Remove file"
                      >
                        <Trash className="w-4 h-4" />
                      </button>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-[calc(100%-40px)]">
                        <div>
                          <label className="block text-xs font-mono uppercase text-slate-500 mb-1">Filename</label>
                          <input
                            type="text"
                            required
                            value={file.filename}
                            onChange={e => handleCodeFileChange(index, 'filename', e.target.value)}
                            className="w-full bg-black/40 border border-white/10 focus:border-primary/30 text-white rounded-lg p-2 outline-none text-xs font-mono"
                            placeholder="e.g. index.html"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-mono uppercase text-slate-500 mb-1">Language</label>
                          <select
                            value={file.language}
                            onChange={e => handleCodeFileChange(index, 'language', e.target.value)}
                            className="w-full bg-black/40 border border-white/10 focus:border-primary/30 text-white rounded-lg p-2 outline-none text-xs font-mono h-[34px]"
                          >
                            {SUPPORTED_LANGUAGES.map(lang => (
                              <option key={lang.value} value={lang.value} className="bg-dark-800 text-white">{lang.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-mono uppercase text-slate-500 mb-1">Code Content</label>
                        <textarea
                          required
                          value={file.content}
                          onChange={e => handleCodeFileChange(index, 'content', e.target.value)}
                          className="w-full bg-black/40 border border-white/10 focus:border-primary/30 text-green-400 rounded-lg p-3 outline-none text-xs font-mono h-40 resize-y"
                          placeholder="// paste or write source code here"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Output Image Section */}
              <div className="border-t border-white/5 pt-6">
                <h4 className="text-md font-bold text-white flex items-center gap-2 mb-4">
                  <ImageIcon className="w-4 h-4 text-primary" />
                  Output Screenshots / Images
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                  {formImageUrls.map((url, index) => (
                    <div key={index} className="bg-black/30 border border-white/5 rounded-lg overflow-hidden relative group aspect-video">
                      <img src={url} alt="Output Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImageUrl(index)}
                        className="absolute top-2 right-2 bg-black/80 text-slate-400 hover:text-red-400 p-1.5 rounded-full opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  
                  <label className="border border-dashed border-white/10 hover:border-primary/30 rounded-lg flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-white/5 transition-all aspect-video">
                    {uploadingImage ? (
                      <Loader2 className="w-6 h-6 text-primary animate-spin" />
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-slate-500 mb-1" />
                        <span className="text-xs text-slate-400 font-mono">Upload Screenshots</span>
                      </>
                    )}
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex gap-4 border-t border-white/5 pt-6">
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="flex items-center gap-2 bg-primary text-dark-900 hover:opacity-90 font-bold px-6 py-2.5 rounded-lg text-sm transition-all disabled:opacity-50"
                >
                  {saveLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Publish Practical
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setActivePractical(null);
                  }}
                  className="bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white px-6 py-2.5 rounded-lg text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main List Screen */}
      {!loading && !isEditing && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-white font-mono uppercase tracking-wider text-slate-400">
              Practicals List ({practicals.length})
            </h3>
            <button
              onClick={handleAddNew}
              className="flex items-center gap-2 bg-gradient-to-r from-primary to-accent text-dark-900 font-bold px-5 py-2.5 rounded-lg text-sm hover:opacity-95 transition-all shadow-lg shadow-primary/10"
            >
              <Plus className="w-4 h-4" />
              Add Practical
            </button>
          </div>

          {practicals.length === 0 ? (
            <div className="border border-dashed border-white/10 rounded-xl p-12 text-center text-slate-400 bg-white/5">
              <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="font-mono text-sm mb-2">No practicals found in your database.</p>
              <p className="text-xs text-slate-500">Create your first practical to display it to visitors.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {practicals.map((prac) => (
                <div 
                  key={prac.id}
                  className="bg-dark-800/40 border border-white/5 p-6 rounded-xl hover:border-white/10 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
                >
                  <div className="space-y-2 flex-grow">
                    <div className="flex flex-wrap items-center gap-3">
                      <h4 className="text-lg font-bold text-white leading-tight">{prac.title}</h4>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded border border-primary/20 text-primary bg-primary/5">
                        {prac.subject}
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm max-w-2xl line-clamp-2">{prac.description}</p>
                    <div className="flex items-center gap-4 text-slate-500 text-xs font-mono">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {prac.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileCode className="w-3.5 h-3.5" />
                        {prac.code_files?.length || 0} code files
                      </span>
                      <span className="flex items-center gap-1">
                        <ImageIcon className="w-3.5 h-3.5" />
                        {prac.image_urls?.length || 0} images
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3 w-full md:w-auto">
                    <button
                      onClick={() => handleEdit(prac)}
                      className="flex-grow md:flex-grow-0 flex items-center justify-center gap-1.5 bg-white/5 border border-white/10 hover:border-primary/30 hover:text-white px-4 py-2 rounded-lg text-xs font-mono transition-all"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(prac.id)}
                      className="flex-grow md:flex-grow-0 flex items-center justify-center gap-1.5 bg-red-950/20 border border-red-500/10 hover:bg-red-950/40 hover:border-red-500/30 text-red-400 px-4 py-2 rounded-lg text-xs font-mono transition-all"
                    >
                      <Trash className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Admin;
