import { motion } from 'framer-motion';

// Mock data until Sanity is connected
const mockPracticals = [
  {
    _id: '1',
    title: 'React Custom Hooks',
    description: 'Implementation of a custom useFetch hook with TypeScript and Error boundary handling.',
    language: 'typescript',
    code: `function useFetch<T>(url: string) {\n  const [data, setData] = useState<T | null>(null);\n  // implementation...\n  return { data };\n}`,
  }
];

const Practicals = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-5xl mx-auto px-6 py-12"
    >
      <div className="mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">My Practicals</h2>
        <p className="text-slate-400 font-mono">Snippets, exercises, and small projects.</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {mockPracticals.map(prac => (
          <div key={prac._id} className="bg-dark-800 border border-white/5 rounded-xl overflow-hidden hover:border-primary/30 transition-colors">
            <div className="p-6 border-b border-white/5">
              <h3 className="text-xl font-semibold text-white mb-2">{prac.title}</h3>
              <p className="text-slate-400 text-sm">{prac.description}</p>
            </div>
            <div className="p-0 bg-black/40">
              <pre className="p-6 font-mono text-sm text-green-400 overflow-x-auto">
                <code>{prac.code}</code>
              </pre>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-12 p-6 border border-dashed border-white/20 rounded-xl text-center bg-white/5">
        <p className="text-slate-400 font-mono text-sm">
           Note: Practicals will be dynamically fetched from Sanity CMS once setup is complete.
        </p>
      </div>
    </motion.div>
  );
};

export default Practicals;
