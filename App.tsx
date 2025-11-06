import React, { useState } from 'react';
import { Encryptor } from './components/Encryptor.tsx';
import { Decryptor } from './components/Decryptor.tsx';
import { LockIcon, UnlockIcon } from './components/Icons.tsx';
import { OperationMode } from './types.ts';

const App = () => {
  const [mode, setMode] = useState(OperationMode.ENCRYPT);

  const headerText = "RubeEn Fire Security";
  const tagline = "Secure your text files with a password-protected key file.";

  return (
    <div className="min-h-screen bg-primary flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-2xl bg-secondary border border-border-color rounded-lg shadow-xl overflow-hidden">
        <header className="p-6 border-b border-border-color text-center">
          <h1 className="text-3xl font-bold text-accent tracking-wider">{headerText}</h1>
          <p className="text-text-secondary mt-1">{tagline}</p>
        </header>

        <main>
          <div className="flex">
            <TabButton
              label="Encrypt"
              icon={<LockIcon />}
              isActive={mode === OperationMode.ENCRYPT}
              onClick={() => setMode(OperationMode.ENCRYPT)}
            />
            <TabButton
              label="Decrypt"
              icon={<UnlockIcon />}
              isActive={mode === OperationMode.DECRYPT}
              onClick={() => setMode(OperationMode.DECRYPT)}
            />
          </div>
          <div className="p-6 md:p-8">
            {mode === OperationMode.ENCRYPT ? <Encryptor /> : <Decryptor />}
          </div>
        </main>
         <footer className="p-4 bg-primary text-center text-xs text-text-secondary border-t border-border-color">
            <p>&copy; {new Date().getFullYear()} RubeEn Fire Security. All operations are performed client-side. No data is ever sent to a server.</p>
        </footer>
      </div>
    </div>
  );
};

const TabButton = ({ label, icon, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`w-1/2 flex items-center justify-center gap-2 p-4 font-semibold text-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-secondary focus:ring-accent ${
      isActive
        ? 'bg-secondary text-accent border-b-2 border-accent'
        : 'bg-primary text-text-secondary hover:bg-border-color'
    }`}
  >
    {icon}
    {label}
  </button>
);

export default App;