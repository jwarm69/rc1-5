import { useState, useRef, useCallback, DragEvent, ChangeEvent, ClipboardEvent } from "react";
import { toast } from "sonner";

export interface UseScreenshotUploadOptions {
  onImageProcessed: (imageUrl: string) => void;
  maxSizeMB?: number;
}

export interface UseScreenshotUploadReturn {
  isDragging: boolean;
  uploadedImage: string | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  setUploadedImage: React.Dispatch<React.SetStateAction<string | null>>;
  handleDragOver: (e: DragEvent<HTMLDivElement>) => void;
  handleDragLeave: (e: DragEvent<HTMLDivElement>) => void;
  handleDrop: (e: DragEvent<HTMLDivElement>) => void;
  handleFileSelect: (e: ChangeEvent<HTMLInputElement>) => void;
  handlePaste: (e: ClipboardEvent) => void;
  triggerFileSelect: () => void;
  clearImage: () => void;
}

export function useScreenshotUpload({
  onImageProcessed,
  maxSizeMB = 10,
}: UseScreenshotUploadOptions): UseScreenshotUploadReturn {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImageFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }

      if (file.size > maxSizeMB * 1024 * 1024) {
        toast.error(`Image must be less than ${maxSizeMB}MB`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setUploadedImage(imageUrl);
        onImageProcessed(imageUrl);
      };
      reader.readAsDataURL(file);
    },
    [onImageProcessed, maxSizeMB]
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files && files[0]) {
        processImageFile(files[0]);
      }
    },
    [processImageFile]
  );

  const handleFileSelect = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files[0]) {
        processImageFile(files[0]);
      }
    },
    [processImageFile]
  );

  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          e.preventDefault();
          const file = items[i].getAsFile();
          if (file) {
            processImageFile(file);
          }
          break;
        }
      }
    },
    [processImageFile]
  );

  const triggerFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const clearImage = useCallback(() => {
    setUploadedImage(null);
  }, []);

  return {
    isDragging,
    uploadedImage,
    fileInputRef,
    setUploadedImage,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileSelect,
    handlePaste,
    triggerFileSelect,
    clearImage,
  };
}
