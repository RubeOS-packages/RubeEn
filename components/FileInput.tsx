
import React, { useRef, useState } from 'react';
import { UploadIcon } from './Icons';

interface FileInputProps {
  onFileChange: (file: File | null) => void;
  accept: string;
  disabled: boolean;
}

export const FileInput: React.FC<FileInputProps> = ({ onFileChange, accept, disabled }) => {
  const [fileName, setFileName] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setFileName(file ? file.name : '');
    onFileChange(file);
  };

  const handleLabelClick = () => {
    inputRef.current?.click();
  };

  return (
    <div>
      <label className="block text-sm font-medium text-text-secondary mb-2">
        {fileName ? 'Selected File' : 'Select File'}
      </label>
      <div
        onClick={handleLabelClick}
        className={`flex items-center justify-between w-full p-3 bg-primary border-2 border-dashed border-border-color rounded-md transition-colors ${
          disabled
            ? 'cursor-not-allowed opacity-50'
            : 'cursor-pointer hover:border-accent hover:text-accent'
        }`}
      >
        <span className="text-sm truncate pr-4">{fileName || 'No file chosen'}</span>
        <div className="flex items-center px-4 py-2 bg-border-color text-text-primary rounded-md text-sm font-semibold">
          <UploadIcon />
          Choose File
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        disabled={disabled}
        className="hidden"
      />
    </div>
  );
};
