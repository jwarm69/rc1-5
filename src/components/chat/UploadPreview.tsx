/**
 * RealCoach.ai - Upload Preview Component
 *
 * Displays a thumbnail grid of uploaded screenshots.
 * Allows users to remove individual images before analysis.
 */

import React from 'react';
import { X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UploadedImage, MAX_IMAGES_PER_UPLOAD } from '@/types/screenshot';

// ============================================================================
// TYPES
// ============================================================================

export interface UploadPreviewProps {
  /** Array of uploaded images to display */
  images: UploadedImage[];
  /** Called when user removes an image */
  onRemove: (imageId: string) => void;
  /** Maximum images allowed */
  maxImages?: number;
  /** Whether removal is disabled (e.g., during processing) */
  disabled?: boolean;
  /** Optional className for styling */
  className?: string;
}

// ============================================================================
// THUMBNAIL COMPONENT
// ============================================================================

interface ThumbnailProps {
  image: UploadedImage;
  onRemove: () => void;
  disabled?: boolean;
}

function Thumbnail({ image, onRemove, disabled }: ThumbnailProps) {
  return (
    <div className="relative group">
      {/* Image thumbnail */}
      <div className="w-16 h-16 rounded-md overflow-hidden bg-muted border">
        <img
          src={image.previewUrl}
          alt={`Screenshot ${image.id}`}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Remove button overlay */}
      {!disabled && (
        <Button
          variant="destructive"
          size="icon"
          className="absolute -top-2 -right-2 h-5 w-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
          aria-label={`Remove image ${image.id}`}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function UploadPreview({
  images,
  onRemove,
  maxImages = MAX_IMAGES_PER_UPLOAD,
  disabled = false,
  className = '',
}: UploadPreviewProps) {
  if (images.length === 0) {
    return null;
  }

  const isNearLimit = images.length >= maxImages - 2;
  const isAtLimit = images.length >= maxImages;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Thumbnails grid */}
      <div className="flex flex-wrap gap-2">
        {images.map((image) => (
          <Thumbnail
            key={image.id}
            image={image}
            onRemove={() => onRemove(image.id)}
            disabled={disabled}
          />
        ))}
      </div>

      {/* Image count and limit warning */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <ImageIcon className="h-3 w-3" />
          <span>
            {images.length} of {maxImages} images
          </span>
        </div>

        {isNearLimit && !isAtLimit && (
          <span className="text-xs text-amber-600">
            Almost at limit
          </span>
        )}

        {isAtLimit && (
          <span className="flex items-center gap-1 text-xs text-destructive">
            <AlertCircle className="h-3 w-3" />
            Maximum reached
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// EMPTY STATE COMPONENT
// ============================================================================

export function UploadPreviewEmpty({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg ${className}`}>
      <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
      <p className="text-sm text-muted-foreground text-center">
        Drop screenshots here or click to upload
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        PNG, JPG, GIF, or WebP (max 10 images)
      </p>
    </div>
  );
}

// ============================================================================
// PROCESSING STATE COMPONENT
// ============================================================================

export function UploadPreviewProcessing({
  imageCount,
  className = '',
}: {
  imageCount: number;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-3 p-3 bg-muted/50 rounded-lg ${className}`}>
      <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center">
        <ImageIcon className="h-4 w-4 text-primary animate-pulse" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">
          Analyzing {imageCount} screenshot{imageCount !== 1 ? 's' : ''}...
        </p>
        <p className="text-xs text-muted-foreground">
          This may take a few seconds
        </p>
      </div>
    </div>
  );
}

export default UploadPreview;
