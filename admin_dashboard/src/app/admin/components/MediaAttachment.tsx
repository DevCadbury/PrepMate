import { useState, useRef } from 'react';
import { ImagePlus, X, FileImage, Paperclip, ZoomIn } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent } from '../../components/ui/dialog';

export interface AttachedFile {
  id: string;
  name: string;
  size: string;
  type: string;
  url: string;
  thumbnail?: string;
}

interface MediaAttachmentProps {
  files: AttachedFile[];
  onChange: (files: AttachedFile[]) => void;
  maxFiles?: number;
  label?: string;
  compact?: boolean;
}

export default function MediaAttachment({
  files,
  onChange,
  maxFiles = 5,
  label = 'Attach screenshots or files',
  compact = false,
}: MediaAttachmentProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewFile, setPreviewFile] = useState<AttachedFile | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    const newFiles: AttachedFile[] = [];
    for (let i = 0; i < selectedFiles.length; i++) {
      if (files.length + newFiles.length >= maxFiles) break;
      const file = selectedFiles[i];
      const isImage = file.type.startsWith('image/');
      const url = URL.createObjectURL(file);
      newFiles.push({
        id: `${Date.now()}-${i}`,
        name: file.name,
        size: formatSize(file.size),
        type: file.type,
        url,
        thumbnail: isImage ? url : undefined,
      });
    }
    onChange([...files, ...newFiles]);
    if (inputRef.current) inputRef.current.value = '';
  };

  const removeFile = (id: string) => {
    const file = files.find(f => f.id === id);
    if (file) URL.revokeObjectURL(file.url);
    onChange(files.filter(f => f.id !== id));
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (compact) {
    return (
      <div className="space-y-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />

        {files.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {files.map(file => (
              <div key={file.id} className="group relative">
                {file.thumbnail ? (
                  <div
                    className="size-14 rounded-lg border border-border overflow-hidden cursor-pointer bg-muted"
                    onClick={() => setPreviewFile(file)}
                  >
                    <img src={file.thumbnail} alt={file.name} className="size-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <ZoomIn className="size-4 text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="size-14 rounded-lg border border-border flex items-center justify-center bg-muted">
                    <FileImage className="size-5 text-muted-foreground" />
                  </div>
                )}
                <button
                  onClick={() => removeFile(file.id)}
                  className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {files.length < maxFiles && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground"
            onClick={() => inputRef.current?.click()}
          >
            <Paperclip className="size-3 mr-1" />
            Attach
          </Button>
        )}

        {/* Preview Dialog */}
        <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
          <DialogContent className="max-w-2xl p-2">
            {previewFile?.thumbnail && (
              <img src={previewFile.thumbnail} alt={previewFile.name} className="w-full rounded-lg" />
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf,.doc,.docx"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Upload area */}
      {files.length < maxFiles && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full rounded-lg border-2 border-dashed border-border hover:border-primary/40 bg-muted/30 hover:bg-muted/50 transition-colors p-4 flex flex-col items-center gap-2 cursor-pointer group"
        >
          <div className="flex size-9 items-center justify-center rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
            <ImagePlus className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-[11px] text-muted-foreground/60 mt-0.5">
              PNG, JPG, PDF up to 10MB · {maxFiles - files.length} remaining
            </p>
          </div>
        </button>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-1.5">
          {files.map(file => (
            <div
              key={file.id}
              className="group flex items-center gap-3 rounded-lg border border-border p-2 hover:bg-muted/30 transition-colors"
            >
              {file.thumbnail ? (
                <div
                  className="size-10 rounded-md overflow-hidden cursor-pointer shrink-0 bg-muted"
                  onClick={() => setPreviewFile(file)}
                >
                  <img src={file.thumbnail} alt={file.name} className="size-full object-cover" />
                </div>
              ) : (
                <div className="size-10 rounded-md border border-border flex items-center justify-center bg-muted shrink-0">
                  <FileImage className="size-4 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs truncate">{file.name}</p>
                <p className="text-[11px] text-muted-foreground">{file.size}</p>
              </div>
              {file.thumbnail && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => setPreviewFile(file)}
                >
                  <ZoomIn className="size-3.5" />
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                onClick={() => removeFile(file.id)}
              >
                <X className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
        <DialogContent className="max-w-3xl p-2">
          {previewFile?.thumbnail && (
            <img src={previewFile.thumbnail} alt={previewFile.name} className="w-full rounded-lg" />
          )}
          {previewFile && !previewFile.thumbnail && (
            <div className="flex flex-col items-center justify-center py-12">
              <FileImage className="size-12 text-muted-foreground/30" />
              <p className="mt-2 text-sm text-muted-foreground">{previewFile.name}</p>
              <p className="text-xs text-muted-foreground/60">{previewFile.size}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
