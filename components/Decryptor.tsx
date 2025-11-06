
import React, { useState, useCallback } from 'react';
import { importAndDecryptKey, decryptFile } from '../services/cryptoService';
import { FileInput } from './FileInput';
import { PasswordInput } from './PasswordInput';
import { ActionButton } from './ActionButton';
import { StatusMessage } from './StatusMessage';

export const Decryptor: React.FC = () => {
  const [opFile, setOpFile] = useState<File | null>(null);
  const [keyFile, setKeyFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<{ type: 'error' | 'success' | 'info'; message: string } | null>({type: 'info', message: 'Select your .op file and its corresponding .key.json file.'});
  const [isLoading, setIsLoading] = useState(false);
  const [decryptedText, setDecryptedText] = useState('');

  const handleOpFileChange = (selectedFile: File | null) => {
    if (selectedFile && !selectedFile.name.endsWith('.op')) {
        setStatus({ type: 'error', message: 'Invalid file type. Please select a .op file.' });
        setOpFile(null);
        return;
    }
    setOpFile(selectedFile);
    setDecryptedText('');
    setStatus(null);
  };

  const handleKeyFileChange = (selectedFile: File | null) => {
    if (selectedFile && !selectedFile.name.endsWith('.key.json')) {
        setStatus({ type: 'error', message: 'Invalid file type. Please select a .key.json file.' });
        setKeyFile(null);
        return;
    }
    setKeyFile(selectedFile);
    setDecryptedText('');
    setStatus(null);
  };

  const handleDecrypt = useCallback(async () => {
    if (!opFile || !keyFile || !password) {
      setStatus({ type: 'error', message: 'Please select both files and enter the password.' });
      return;
    }

    setIsLoading(true);
    setDecryptedText('');
    setStatus({ type: 'info', message: 'Decrypting key and file... Please wait.' });
    
    try {
        const opFileContent = await opFile.arrayBuffer();
        const keyFileContent = await keyFile.text();

        const fileKey = await importAndDecryptKey(keyFileContent, password);
        const decryptedContent = await decryptFile(opFileContent, fileKey);
        
        const text = new TextDecoder().decode(decryptedContent);
        setDecryptedText(text);
        setStatus({ type: 'success', message: 'File decrypted successfully!' });
      } catch (error: any) {
        setStatus({ type: 'error', message: error.message || 'Decryption failed.' });
        console.error(error);
      } finally {
        setIsLoading(false);
      }
  }, [opFile, keyFile, password]);

  const handleDownload = () => {
    const blob = new Blob([decryptedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const originalFilename = opFile?.name.replace(/\.op$/, '');
    a.href = url;
    a.download = `${originalFilename}_decrypted.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };


  return (
    <div className="space-y-6">
      <div className="space-y-4 p-4 border border-border-color rounded-lg">
        <FileInput
          onFileChange={handleOpFileChange}
          accept=".op"
          disabled={isLoading}
        />
        <FileInput
          onFileChange={handleKeyFileChange}
          accept=".json"
          disabled={isLoading}
        />
      </div>
      <PasswordInput
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter password for key file"
        disabled={isLoading}
      />
      <ActionButton
        onClick={handleDecrypt}
        disabled={!opFile || !keyFile || !password || isLoading}
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
