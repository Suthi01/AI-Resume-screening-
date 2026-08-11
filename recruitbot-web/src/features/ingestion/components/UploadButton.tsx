import React, { useRef } from 'react';
import { Upload } from 'lucide-react';

interface UploadButtonProps {
  onFileSelect: (file: File) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

export const UploadButton: React.FC<UploadButtonProps> = ({
  onFileSelect,
  onError,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      onError('Please select a file');
      return;
    }

    const file = files[0];

    // PDF validation
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      onError('Only PDF allowed');
      // Reset file input
      e.target.value = '';
      return;
    }

    // Size validation (5MB limit)
    const isLt5MB = file.size <= 5 * 1024 * 1024;
    if (!isLt5MB) {
      onError('Maximum 5MB allowed');
      // Reset file input
      e.target.value = '';
      return;
    }

    onFileSelect(file);
    // Reset file input so same file can be uploaded again if needed
    e.target.value = '';
  };

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="application/pdf"
        className="hidden"
        disabled={disabled}
      />
      <button
        type="button"
        onClick={handleButtonClick}
        disabled={disabled}
        className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-text-primary bg-primary hover:bg-opacity-90 active:scale-[0.98] rounded-md transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-bg-card ${
          disabled ? 'opacity-40 cursor-not-allowed active:scale-100' : ''
        }`}
      >
        <Upload className="w-4 h-4" />
        Browse Files
      </button>
    </div>
  );
};
