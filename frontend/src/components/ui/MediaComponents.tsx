import React, { useState, useRef } from 'react';
import { Upload, File, Image as ImageIcon, X, Loader2 } from 'lucide-react';

// ==========================================
// 1. REUSABLE SECURE IMAGE WRAPPER
// ==========================================
export interface SecureImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackText?: string;
  className?: string;
}

export const SecureImage: React.FC<SecureImageProps> = ({
  src,
  alt = 'Secure Image asset',
  fallbackText = 'Image unavailable',
  className = '',
  ...props
}) => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  if (!src || error) {
    return (
      <div className={`flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center p-4 ${className}`}>
        <ImageIcon className="w-6 h-6 text-slate-300 dark:text-slate-600 mb-1" />
        <span className="text-[8px] font-black uppercase text-gray-400 dark:text-slate-500 tracking-wider">
          {fallbackText}
        </span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50 dark:bg-slate-900">
          <Loader2 className="w-4 h-4 text-teal-600 animate-spin" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        onError={() => setError(true)}
        onLoad={() => setLoading(false)}
        className={`w-full h-full object-cover transition-opacity duration-350 ${loading ? 'opacity-0' : 'opacity-100'}`}
        referrerPolicy="no-referrer"
        {...props}
      />
    </div>
  );
};

// ==========================================
// 2. REUSABLE FILE UPLOAD COMPONENT
// ==========================================
export interface FileUploadProps {
  label?: string;
  accept?: string;
  maxSizeMB?: number;
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  label,
  accept = '*/*',
  maxSizeMB = 10,
  onFileSelect,
  isLoading = false,
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.size / 1024 / 1024 <= maxSizeMB) {
        setFileName(file.name);
        onFileSelect(file);
      } else {
        alert(`File exceeds sizing bounds of ${maxSizeMB}MB.`);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size / 1024 / 1024 <= maxSizeMB) {
        setFileName(file.name);
        onFileSelect(file);
      } else {
        alert(`File exceeds sizing bounds of ${maxSizeMB}MB.`);
      }
    }
  };

  return (
    <div className="space-y-1.5 w-full select-none">
      {label && (
        <span className="block text-[10px] font-black text-gray-700 dark:text-slate-300 uppercase tracking-widest">
          {label}
        </span>
      )}

      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer flex flex-col items-center justify-center transition ${
          isDragActive
            ? 'border-teal-500 bg-teal-50/10 dark:bg-teal-950/10'
            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/40'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
        />

        {isLoading ? (
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
        ) : fileName ? (
          <div className="space-y-2">
            <div className="p-2.5 bg-teal-50 dark:bg-teal-950/30 text-teal-600 rounded-xl w-fit mx-auto border border-teal-100 dark:border-teal-900/30">
              <File className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-bold text-gray-850 dark:text-slate-200 truncate max-w-xs">
              {fileName}
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setFileName(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="text-[9px] font-extrabold uppercase text-rose-500 hover:underline"
            >
              Clear file
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="p-2.5 bg-slate-50 dark:bg-slate-900/60 text-slate-400 rounded-xl w-fit mx-auto border border-slate-100 dark:border-slate-800/60">
              <Upload className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-black text-gray-900 dark:text-slate-200 uppercase tracking-wider">
              Drag file here or click to browse
            </p>
            <p className="text-[8px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-widest">
              Limit {maxSizeMB}MB ({accept})
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// 3. REUSABLE IMAGE UPLOAD WITH THUMBNAIL PREVIEW
// ==========================================
export interface ImageUploadProps {
  label?: string;
  aspectRatioLabel?: string;
  onImageSelect: (file: File) => void;
  imageUrl?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  label,
  aspectRatioLabel = '16:9 Standard',
  onImageSelect,
  imageUrl,
}) => {
  const [preview, setPreview] = useState<string | null>(imageUrl || null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPreview(URL.createObjectURL(file));
      onImageSelect(file);
    }
  };

  return (
    <div className="space-y-1.5 w-full">
      <div className="flex justify-between items-center">
        {label && (
          <span className="block text-[10px] font-black text-gray-700 dark:text-slate-300 uppercase tracking-widest">
            {label}
          </span>
        )}
        <span className="text-[8px] font-mono font-black text-teal-650 dark:text-teal-400 uppercase">
          {aspectRatioLabel}
        </span>
      </div>

      <div
        onClick={() => inputRef.current?.click()}
        className="relative border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-2xl h-36 flex items-center justify-center bg-white dark:bg-slate-900/40 cursor-pointer overflow-hidden transition"
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleSelect}
          className="hidden"
        />

        {preview ? (
          <>
            <img src={preview} alt="Selected thumbnail" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition duration-150">
              <span className="text-[10px] font-black uppercase text-white tracking-widest bg-slate-900/80 px-3 py-1.5 rounded-xl border border-white/10">
                Replace Image
              </span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPreview(null);
                if (inputRef.current) inputRef.current.value = '';
              }}
              className="absolute top-2 right-2 p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <div className="text-center space-y-1.5">
            <ImageIcon className="w-6 h-6 text-slate-400 mx-auto" />
            <p className="text-[9px] font-black text-gray-900 dark:text-slate-200 uppercase tracking-wider">
              Upload display banner
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// 4. CIRCULAR LOGO UPLOAD COMPONENT
// ==========================================
export interface LogoUploadProps {
  label?: string;
  onLogoSelect: (file: File) => void;
  logoUrl?: string;
}

export const LogoUpload: React.FC<LogoUploadProps> = ({
  label,
  onLogoSelect,
  logoUrl,
}) => {
  const [preview, setPreview] = useState<string | null>(logoUrl || null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPreview(URL.createObjectURL(file));
      onLogoSelect(file);
    }
  };

  return (
    <div className="space-y-1.5 flex flex-col items-center select-none">
      {label && (
        <span className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
          {label}
        </span>
      )}

      <div
        onClick={() => inputRef.current?.click()}
        className="relative w-20 h-20 rounded-full border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 flex items-center justify-center bg-white dark:bg-slate-900/40 cursor-pointer overflow-hidden transition"
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleSelect}
          className="hidden"
        />

        {preview ? (
          <>
            <img src={preview} alt="Cooperative logo" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition">
              <Upload className="w-4 h-4 text-white" />
            </div>
          </>
        ) : (
          <div className="text-center">
            <Upload className="w-4 h-4 text-slate-400 mx-auto" />
          </div>
        )}
      </div>
    </div>
  );
};
