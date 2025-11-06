
import React, { useState, useCallback } from 'react';
import { generateFileKey, encryptFile, exportEncryptedKey } from '../services/cryptoService';
import { FileInput } from './FileInput';
import { PasswordInput } from './PasswordInput';
import { ActionButton } from './ActionButton';
import { StatusMessage } from './StatusMessage';

export const Encryptor: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<{ type: 'error' | 'success' | 'info'; message: string } | null>({type: 'info', message: 'Select a .txt file and set a password to protect its encryption key.'});
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
      setStatus({ type: 'error', message: 'Please select a file and enter a password to protect the key.' });
      return;
    }

    setIsLoading(true);
    setStatus({ type: 'info', message: 'Generating key and encrypting file... Please wait.' });

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        if (!event.target?.result) {
            throw new Error("Failed to read file.");
        }
        const content = event.target.result as ArrayBuffer;

        const fileKey = await generateFileKey();
        const encryptedContent = await encryptFile(content, fileKey);
        const encryptedKeyJson = await exportEncryptedKey(fileKey, password);
        
        const originalFilename = file.name.replace(/\.txt$/, '');

        // Create blob for encrypted file
        const fileBlob = new Blob([encryptedContent], { type: 'application/octet-stream' });
        const fileUrl = URL.createObjectURL(fileBlob);
        const fileLink = document.createElement('a');
        fileLink.href = fileUrl;
        fileLink.download = `${originalFilename}.op`;
        
        // Create blob for key file
        const keyBlob = new Blob([encryptedKeyJson], { type: 'application/json' });
        const keyUrl = URL.createObjectURL(keyBlob);
        const keyLink = document.createElement('a');
        keyLink.href = keyUrl;
        keyLink.download = `${originalFilename}.key.json`;

        // Trigger downloads
        document.body.appendChild(fileLink);
        fileLink.click();
        document.body.removeChild(fileLink);
        URL.revokeObjectURL(fileUrl);
        
        await new Promise(res => setTimeout(res, 100)); // Brief delay for browser stability

        document.body.appendChild(keyLink);
        keyLink.click();
        document.body.removeChild(keyLink);
        URL.revokeObjectURL(keyUrl);

        setStatus({ type: 'success', message: 'Success! Your encrypted file and key file are downloading. Keep both files safe!' });
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
        placeholder="Enter password to protect key file"
        disabled={isLoading}
      />
      <ActionButton
        onClick={handleEncrypt}
        disabled={!file || !password || isLoading}
        isLoading={isLoading}
      >
        Encrypt & Download Files
      </ActionButton>
      {status && <StatusMessage type={status.type} message={status.message} />}
    </div>
  );
};
