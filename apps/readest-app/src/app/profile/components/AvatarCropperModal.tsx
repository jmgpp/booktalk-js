'use client';

import React, { useState, useRef } from 'react';
import ReactCrop, { type Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface AvatarCropperModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  onClose: () => void;
  onCropComplete: (croppedImageBlob: Blob) => void;
}

// Helper to ensure the crop selection is centered and within the image bounds initially
function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
): Crop {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90, // Start with 90% width selection
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );
}

const AvatarCropperModal: React.FC<AvatarCropperModalProps> = ({ 
  isOpen, 
  imageSrc, 
  onClose, 
  onCropComplete 
}) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const aspect = 1; // Square aspect ratio (1/1)

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, aspect));
  };

  const handleCrop = () => {
    const image = imgRef.current;
    if (!image || !completedCrop) {
      console.error('Image ref or crop data missing');
      onClose();
      return;
    }

    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const pixelRatio = window.devicePixelRatio || 1;
    const targetWidth = 200;
    const targetHeight = 200;

    canvas.width = targetWidth * pixelRatio;
    canvas.height = targetHeight * pixelRatio;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Failed to get canvas context');
      onClose();
      return;
    }

    ctx.scale(pixelRatio, pixelRatio);
    ctx.imageSmoothingQuality = 'high';

    const cropX = completedCrop.x * scaleX;
    const cropY = completedCrop.y * scaleY;
    const cropWidth = completedCrop.width * scaleX;
    const cropHeight = completedCrop.height * scaleY;

    // Draw the cropped and resized image onto the canvas
    ctx.drawImage(
      image,        // Source image element
      cropX,        // Source x
      cropY,        // Source y
      cropWidth,    // Source width
      cropHeight,   // Source height
      0,            // Destination x on canvas
      0,            // Destination y on canvas
      targetWidth,  // Destination width on canvas
      targetHeight, // Destination height on canvas
    );

    // Convert canvas to blob as JPEG with quality setting
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          console.error('Canvas to Blob conversion failed');
          onClose();
          return;
        }
        // Pass the cropped blob back to the profile page
        onCropComplete(blob);
        onClose(); // Close modal after completion
      },
      'image/jpeg', // Specify JPEG format
      0.7,          // Quality level (0.0 to 1.0, lower means smaller file/more compression)
    );
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"> 
      <div className="max-h-[90vh] w-full max-w-md overflow-hidden rounded-lg bg-base-100 shadow-xl">
        <div className="p-4">
          <h2 className="mb-4 text-center text-xl font-semibold">Crop Your Avatar</h2>
          {/* Apply max width and max height to the image container or the image itself */}
          <div className="flex max-h-[70vh] max-w-full items-center justify-center overflow-auto p-4"> {/* Container with max size and scroll */}
            {imageSrc && (
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={aspect}
                minWidth={50} 
                minHeight={50}
                circularCrop
              >
                <img
                  ref={imgRef}
                  alt="Crop me"
                  src={imageSrc}
                  onLoad={onImageLoad}
                  // Style applied directly to img - ensures it scales down within the container
                  style={{ 
                      display: 'block', 
                      maxHeight: '65vh', // Slightly less than container to leave space for controls
                      maxWidth: '100%'  // Constrain width within the container
                  }}
                />
              </ReactCrop>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-3 bg-base-200 p-4">
          <button onClick={onClose} className="btn btn-ghost">
            Cancel
          </button>
          <button onClick={handleCrop} className="btn btn-primary" disabled={!completedCrop}>
            Crop & Use Image
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvatarCropperModal;
