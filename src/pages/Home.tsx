import { motion } from 'framer-motion';
import { Github, Linkedin, Mail, Terminal, Code2 } from 'lucide-react';

const Home = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, y: 0,
      transition: { duration: 0.5, ease: 'easeOut' }
    }
  };

  return (
    <motion.div 
      className="max-w-5xl mx-auto px-4 sm:px-6 py-16 md:py-24"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="flex flex-col md:flex-row gap-10 md:gap-12 items-center md:items-start mt-6 md:mt-10">
        
        <motion.div variants={itemVariants} className="flex-1 space-y-6 w-full">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs sm:text-sm font-mono text-primary select-none">
            <Terminal size={14} />
            <span>Developer Portfolio</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-white tracking-tight leading-tight">
            Hi, I'm <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Aakanksha</span>
          </h1>
          
          <p className="text-base sm:text-lg md:text-xl text-slate-400 max-w-2xl font-mono leading-relaxed">
            I build lightning-fast, beautiful web applications. Welcome to my digital workspace where I share my projects, practicals, and code.
          </p>
 
          <div className="flex gap-4 pt-2">
            <a href="https://github.com/AakankshaWagh" target="_blank" rel="noreferrer" className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all hover:scale-105 hover:text-white">
              <Github size={24} />
            </a>
            <a href="https://www.linkedin.com/in/aakanksha-bhaiyyasaheb-wagh-93681732b" target="_blank" rel="noreferrer" className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all hover:scale-105 hover:text-blue-400">
              <Linkedin size={24} />
            </a>
            <a href="mailto:waghaakanksha0713@gmail.com" className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all hover:scale-105 hover:text-red-400">
              <Mail size={24} />
            </a>
          </div>
        </motion.div>
        
        {/* Decorative mock code editor - now fully visible on mobile */}
        <motion.div variants={itemVariants} className="flex flex-1 justify-center md:justify-end w-full mt-6 md:mt-0">
          <div className="w-full max-w-[340px] sm:max-w-md h-72 sm:h-80 rounded-2xl bg-gradient-to-br from-dark-800 to-dark-900 border border-white/10 shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 w-full h-8 bg-dark-800/80 border-b border-white/10 flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
            </div>
            <div className="p-5 pt-10 sm:p-6 sm:pt-12 font-mono text-xs sm:text-sm text-slate-400 leading-relaxed sm:leading-loose">
              <p><span className="text-pink-400">const</span> <span className="text-blue-400">developer</span> = {'{'}</p>
              <p className="ml-4">name: <span className="text-green-400">'Aakanksha Wagh'</span>,</p>
              <p className="ml-4">passion: <span className="text-green-400">'Web Development'</span>,</p>
              <p className="ml-4">skills: [<span className="text-green-400">'React'</span>, <span className="text-green-400">'TypeScript'</span>, <span className="text-green-400">'Tailwind'</span>]</p>
              <p>{'}'};</p>
              <br/>
              <p><span className="text-blue-400">developer</span>.<span className="text-yellow-200">build</span>();</p>
            </div>
            <div className="absolute -bottom-10 -right-10 text-white/5 pointer-events-none select-none">
              <Code2 size={200} />
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Home;
