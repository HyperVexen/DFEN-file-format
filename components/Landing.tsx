import React from 'react';

interface LandingProps {
  onSelectView: (view: 'reader' | 'editor') => void;
}

const ChoiceButton: React.FC<{
  title: string;
  description: string;
  onClick: () => void;
}> = ({ title, description, onClick }) => (
  <button 
    onClick={onClick}
    className="group relative w-full max-w-sm h-64 p-8 text-left bg-white/5 border border-white/10 rounded-2xl backdrop-blur-lg shadow-2xl shadow-black/30 overflow-hidden transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:shadow-brand-accent/20"
  >
    <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-brand-accent/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500"></div>
    <h2 className="text-4xl font-bold text-white mb-2 relative z-10">{title}</h2>
    <p className="text-brand-text-secondary text-lg relative z-10">{description}</p>
  </button>
);

export const Landing: React.FC<LandingProps> = ({ onSelectView }) => {
  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center font-sans p-8">
       <div className="text-center mb-12">
            <h1 className="text-6xl font-extrabold text-white tracking-tight">DreamForge</h1>
            <p className="text-xl text-brand-text-secondary mt-2">Your canvas for digital fiction.</p>
        </div>
      <div className="flex flex-col md:flex-row items-center justify-center gap-8">
        <ChoiceButton 
          title="Read"
          description="Read DFN or DFEN files with the DreamForge Reader."
          onClick={() => onSelectView('reader')}
        />
        <ChoiceButton 
          title="Editor"
          description="Edit DFN or DFEN files here."
          onClick={() => onSelectView('editor')}
        />
      </div>
    </div>
  );
};