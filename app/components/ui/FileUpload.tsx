'use client';

interface FileUploadProps {
  file?: File | null;
  onChange: (file: File | null) => void;
  accept?: string;
  placeholder?: string;
  hint?: string;
}

export default function FileUpload({ file, onChange, accept = 'application/pdf', placeholder = 'Drag file here or click to browse', hint }: FileUploadProps) {
  return (
    <div className="group relative w-full border-2 border-dashed border-amana-sec-6 rounded-xl p-6 flex flex-col items-center justify-center bg-amana-white hover:border-amana-blue/40 hover:bg-white transition-all duration-200 cursor-pointer min-h-[120px]">
      <input
        type="file"
        accept={accept}
        onChange={(e) => onChange(e.target.files?.[0] || null)}
        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
      />
      <img src="/icon/BUpload.png" alt="" className="w-8 h-8 object-contain mb-2" />
      <span className="text-sm font-semibold text-amana-blue text-center truncate max-w-full px-2">
        {file ? file.name : placeholder}
      </span>
      {hint && <span className="text-xs text-amana-sec-7 mt-1 font-light">{hint}</span>}
    </div>
  );
}
