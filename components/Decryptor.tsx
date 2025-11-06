import React, { useState, useCallback } from 'react';
import { importAndDecryptKey, decryptFile, DecryptionResult } from '../services/cryptoService';
import { FileInput } from './FileInput';
import { PasswordInput } from './PasswordInput';
import { ActionButton } from './ActionButton';
import { StatusMessage } from './StatusMessage';
import { ClipboardIcon, CheckIcon } from './Icons';

interface DecryptionInfo {
    metadata: DecryptionResult['metadata'];
    decryptedAt: number;
    decryptedBy: string;
}

const isTextFile = (filename: string): boolean => {
    const textExtensions = ['.txt', '.md', '.json', '.xml', '.html', '.css', '.js', '.ts', '.py', '.rb', '.java', '.go', '.rs', '.c', '.cpp', '.h', '.hpp', '.sh', '.log'];
    const lowercasedFilename = filename.toLowerCase();
    return textExtensions.some(ext => lowercasedFilename.endsWith(ext));
};

export const Decryptor: React.FC = () => {
  const [opFile, setOpFile] = useState<File | null>(null);
  const [keyFile, setKeyFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<{ type: 'error' | 'success' | 'info'; message: string } | null>({type: 'info', message: 'Select your .op file and its corresponding .key.json file.'});
  const [isLoading, setIsLoading] = useState(false);
  const [decryptedContent, setDecryptedContent] = useState<ArrayBuffer | null>(null);
  const [decryptionInfo, setDecryptionInfo] = useState<DecryptionInfo | null>(null);
  const [decryptedText, setDecryptedText] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const resetState = () => {
    setDecryptedContent(null);
    setDecryptionInfo(null);
    setDecryptedText('');
    setStatus(null);
    setIsCopied(false);
  }

  const handleOpFileChange = (selectedFile: File | null) => {
    if (selectedFile && !selectedFile.name.endsWith('.op')) {
        setStatus({ type: 'error', message: 'Invalid file type. Please select a .op file.' });
        setOpFile(null);
        return;
    }
    setOpFile(selectedFile);
    resetState();
  };

  const handleKeyFileChange = (selectedFile: File | null) => {
    if (selectedFile && !selectedFile.name.endsWith('.key.json')) {
        setStatus({ type: 'error', message: 'Invalid file type. Please select a .key.json file.' });
        setKeyFile(null);
        return;
    }
    setKeyFile(selectedFile);
    resetState();
  };

  const handleDecrypt = useCallback(async () => {
    if (!opFile || !keyFile || !password) {
      setStatus({ type: 'error', message: 'Please select both files and enter the password.' });
      return;
    }

    setIsLoading(true);
    resetState();
    setStatus({ type: 'info', message: 'Decrypting key and file... Please wait.' });
    
    try {
        const opFileContent = await opFile.arrayBuffer();
        const keyFileContent = await keyFile.text();

        const { fileKey, metadata } = await importAndDecryptKey(keyFileContent, password);
        const content = await decryptFile(opFileContent, fileKey);
        
        setDecryptedContent(content);
        setDecryptionInfo({
            metadata,
            decryptedAt: Date.now(),
            decryptedBy: navigator.userAgent
        });

        if (isTextFile(metadata.filename)) {
            const text = new TextDecoder().decode(content);
            setDecryptedText(text);
        }
        
        setStatus({ type: 'success', message: 'File decrypted successfully! See details below.' });
      } catch (error: any) {
        setStatus({ type: 'error', message: error.message || 'Decryption failed.' });
        console.error(error);
      } finally {
        setIsLoading(false);
      }
  }, [opFile, keyFile, password]);

  const handleDownload = () => {
    if (!decryptedContent || !decryptionInfo) return;
    const blob = new Blob([decryptedContent]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = decryptionInfo.metadata.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    if (!decryptedText || isCopied) return;
    try {
      await navigator.clipboard.writeText(decryptedText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500); // Reset after 2.5 seconds
    } catch (err) {
      setStatus({ type: 'error', message: 'Failed to copy text to clipboard.' });
      console.error('Failed to copy:', err);
    }
  };


  return (
    <div className="space-y-6">
      <div className="space-y-4 p-4 border border-border-color rounded-lg">
        <FileInput
          label="Encrypted File (.op)"
          onFileChange={handleOpFileChange}
          accept=".op"
          disabled={isLoading}
        />
        <FileInput
          label="Key File (.key.json)"
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

      {decryptedContent && decryptionInfo && (
        <div className="space-y-6 pt-6 border-t border-border-color mt-6">
            <div className="space-y-3 p-4 bg-primary border border-border-color rounded-lg">
                <h3 className="text-lg font-semibold text-accent">File Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <InfoItem label="Original Filename" value={decryptionInfo.metadata.filename} />
                    <InfoItem label="Encrypted On" value={new Date(decryptionInfo.metadata.encryptedAt).toLocaleString()} />
                    <InfoItem label="Encrypted By" value={decryptionInfo.metadata.encryptedBy} fullWidth />
                    <InfoItem label="Decrypted On" value={new Date(decryptionInfo.decryptedAt).toLocaleString()} />
                    <InfoItem label="Decrypted By" value={decryptionInfo.decryptedBy} fullWidth />
                </div>
            </div>

            {decryptedText ? (
                 <textarea
                    readOnly
                    value={decryptedText}
                    className="w-full h-48 p-3 bg-primary border border-border-color rounded-md text-text-primary focus:ring-2 focus:ring-accent focus:outline-none"
                    placeholder="Decrypted content"
                />
            ) : (
                <div className="p-4 text-center bg-primary border border-border-color rounded-md text-text-secondary">
                    <p>Preview is not available for this file type.</p>
                </div>
            )}
            
            <div className={`grid grid-cols-1 ${decryptedText ? 'sm:grid-cols-2' : ''} gap-4`}>
                <ActionButton onClick={handleDownload} className={!decryptedText ? 'col-span-full' : ''}>
                    Download "{decryptionInfo.metadata.filename}"
                </ActionButton>
                {decryptedText && (
                    <button
                      onClick={handleCopy}
                      disabled={isCopied}
                      className="w-full flex items-center justify-center p-3 bg-border-color text-text-primary text-base font-bold rounded-md transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-secondary focus:ring-accent disabled:opacity-75 disabled:cursor-not-allowed"
                    >
                      {isCopied ? <CheckIcon /> : <ClipboardIcon />}
                      {isCopied ? 'Copied!' : 'Copy to Clipboard'}
                    </button>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

const InfoItem: React.FC<{ label: string; value: string; fullWidth?: boolean }> = ({ label, value, fullWidth = false }) => (
    <div className={fullWidth ? 'sm:col-span-2' : ''}>
        <p className="font-semibold text-text-secondary">{label}:</p>
        <p className="text-text-primary break-words">{value}</p>
    </div>
);
