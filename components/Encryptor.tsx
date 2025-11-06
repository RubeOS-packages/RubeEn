
import React, { useState, useCallback } from 'react';
import { encryptFile } from '../services/cryptoService';
import { FileInput } from './FileInput';
import { PasswordInput } from './PasswordInput';
import { ActionButton } from './ActionButton';
import { StatusMessage } from './StatusMessage';

export const Encryptor: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<{ type: 'error' | 'success' | 'info'; message: string } | null>({type: 'info', message: 'Select a .txt file to encrypt into a secure .op file.'});
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (selectedFile: File | null) => {
    if (selectedFile && selectedFile.type !== 'text/plain') {
        setStatus({ type: 'error', message: 'Invalid file type. Please select a .txt file.' });
        setFile(null);
        return;
    }
    setFile(selectedFile);
    setStatus(null);
  };
  
  const handleEncrypt = useCallback(async () => {
    if (!file || !password) {
      setStatus({ type: 'error', message: 'Please select a file and enter a password.' });
      return;
    }

    setIsLoading(true);
    setStatus({ type: 'info', message: 'Encrypting file... Please wait.' });

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        if (!event.target?.result) {
            throw new Error("Failed to read file.");
        }
        const content = event.target.result as ArrayBuffer;
        const encryptedContent = await encryptFile(content, password);
        
        const blob = new Blob([encryptedContent], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const originalFilename = file.name.replace(/\.txt$/, '');
        a.href = url;
        a.download = `${originalFilename}.op`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        setStatus({ type: 'success', message: 'File encrypted and download started successfully!' });
      } catch (error) {
        setStatus({ type: 'error', message: 'Encryption failed. Please try again.' });
        console.error(error);
      } finally {
        setIsLoading(false);
        setPassword('');
      }
    };
    reader.onerror = () => {
        setStatus({type: 'error', message: 'Error reading file.'});
        setIsLoading(false);
    };
    reader.readAsArrayBuffer(file);
  }, [file, password]);

  return (
    <div className="space-y-6">
      <FileInput
        onFileChange={handleFileChange}
        accept=".txt"
        disabled={isLoading}
      />
      <PasswordInput
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter encryption password"
        disabled={isLoading}
      />
      <ActionButton
        onClick={handleEncrypt}
        disabled={!file || !password || isLoading}
        isLoading={isLoading}
      >
        Encrypt & Download
      </ActionButton>
      {status && <StatusMessage type={status.type} message={status.message} />}
    </div>
  );
};
