
import React, { useState, useCallback } from 'react';
import { decryptFile } from '../services/cryptoService';
import { FileInput } from './FileInput';
import { PasswordInput } from './PasswordInput';
import { ActionButton } from './ActionButton';
import { StatusMessage } from './StatusMessage';

export const Decryptor: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<{ type: 'error' | 'success' | 'info'; message: string } | null>({type: 'info', message: 'Select a .op file to decrypt.'});
  const [isLoading, setIsLoading] = useState(false);
  const [decryptedText, setDecryptedText] = useState('');

  const handleFileChange = (selectedFile: File | null) => {
    if (selectedFile && !selectedFile.name.endsWith('.op')) {
        setStatus({ type: 'error', message: 'Invalid file type. Please select a .op file.' });
        setFile(null);
        return;
    }
    setFile(selectedFile);
    setDecryptedText('');
    setStatus(null);
  };

  const handleDecrypt = useCallback(async () => {
    if (!file || !password) {
      setStatus({ type: 'error', message: 'Please select a file and enter a password.' });
      return;
    }

    setIsLoading(true);
    setDecryptedText('');
    setStatus({ type: 'info', message: 'Decrypting file... Please wait.' });

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        if (!event.target?.result) {
            throw new Error("Failed to read file.");
        }
        const content = event.target.result as ArrayBuffer;
        const decryptedContent = await decryptFile(content, password);
        const text = new TextDecoder().decode(decryptedContent);
        setDecryptedText(text);
        setStatus({ type: 'success', message: 'File decrypted successfully!' });
      } catch (error: any) {
        setStatus({ type: 'error', message: error.message || 'Decryption failed.' });
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
        setStatus({type: 'error', message: 'Error reading file.'});
        setIsLoading(false);
    };
    reader.readAsArrayBuffer(file);
  }, [file, password]);

  const handleDownload = () => {
    const blob = new Blob([decryptedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const originalFilename = file?.name.replace(/\.op$/, '');
    a.href = url;
    a.download = `${originalFilename}_decrypted.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };


  return (
    <div className="space-y-6">
      <FileInput
        onFileChange={handleFileChange}
        accept=".op"
        disabled={isLoading}
      />
      <PasswordInput
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter decryption password"
        disabled={isLoading}
      />
      <ActionButton
        onClick={handleDecrypt}
        disabled={!file || !password || isLoading}
        isLoading={isLoading}
      >
        Decrypt File
      </ActionButton>
      {status && <StatusMessage type={status.type} message={status.message} />}

      {decryptedText && (
        <div className="space-y-4">
            <textarea
                readOnly
                value={decryptedText}
                className="w-full h-48 p-3 bg-primary border border-border-color rounded-md text-text-primary focus:ring-2 focus:ring-accent focus:outline-none"
                placeholder="Decrypted content will appear here"
            />
            <ActionButton onClick={handleDownload}>
                Download Decrypted .txt
            </ActionButton>
        </div>
      )}
    </div>
  );
};
