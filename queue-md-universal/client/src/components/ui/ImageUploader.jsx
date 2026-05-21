import { useState, useRef, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

/**
 * ImageUploader Component
 * Handles image selection, preview, 1:1 dynamic cropping, and Cloudinary upload.
 * @param {function} onUploadSuccess - Callback with { imageUrl, publicId }
 * @param {string} folderType - Cloudinary sub-folder label (default: 'logos')
 * @param {string} currentImage - Existing image URL to pre-populate preview
 */
const ImageUploader = ({ onUploadSuccess, folderType = 'logos', currentImage = '' }) => {
  const [preview, setPreview] = useState(currentImage || null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Cropping states
  const [rawImage, setRawImage] = useState(null);
  const [rawFile, setRawFile] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [baseSize, setBaseSize] = useState({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cropping, setCropping] = useState(false);

  const viewportRef = useRef(null);
  const imageRef = useRef(null);

  // Sync preview with currentImage when it changes from parent
  useEffect(() => {
    setPreview(currentImage || null);
  }, [currentImage]);

  // Global mouse/touch release listener
  useEffect(() => {
    if (isDragging) {
      const handleGlobalRelease = () => {
        setIsDragging(false);
      };
      window.addEventListener('mouseup', handleGlobalRelease);
      window.addEventListener('touchend', handleGlobalRelease);
      return () => {
        window.removeEventListener('mouseup', handleGlobalRelease);
        window.removeEventListener('touchend', handleGlobalRelease);
      };
    }
  }, [isDragging]);

  const startCropping = (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed!');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5MB');
      return;
    }

    setRawFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setRawImage(reader.result);
      setZoom(1);
      setPosition({ x: 0, y: 0 });
      setBaseSize({ width: 0, height: 0 });
    };
    reader.readAsDataURL(file);
  };

  const handleImageLoad = (e) => {
    const img = e.target;
    const naturalW = img.naturalWidth;
    const naturalH = img.naturalHeight;
    const aspect = naturalW / naturalH;
    const viewportSize = 280;

    let baseW = 0;
    let baseH = 0;

    if (aspect >= 1) {
      baseH = viewportSize;
      baseW = viewportSize * aspect;
    } else {
      baseW = viewportSize;
      baseH = viewportSize / aspect;
    }

    setBaseSize({ width: baseW, height: baseH });
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleDragStart = (clientX, clientY) => {
    setIsDragging(true);
    setDragStart({
      x: clientX - position.x,
      y: clientY - position.y
    });
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    handleDragStart(e.clientX, e.clientY);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleDragMove = (clientX, clientY) => {
    if (!isDragging || !baseSize.width || !baseSize.height) return;

    const newX = clientX - dragStart.x;
    const newY = clientY - dragStart.y;

    const scaledW = baseSize.width * zoom;
    const scaledH = baseSize.height * zoom;
    const viewportSize = 280;

    const maxOffsetX = (scaledW - viewportSize) / 2;
    const maxOffsetY = (scaledH - viewportSize) / 2;

    const clampedX = Math.min(Math.max(newX, -maxOffsetX), maxOffsetX);
    const clampedY = Math.min(Math.max(newY, -maxOffsetY), maxOffsetY);

    setPosition({ x: clampedX, y: clampedY });
  };

  const handleMouseMove = (e) => {
    handleDragMove(e.clientX, e.clientY);
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 1) {
      handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const adjustZoom = (newZoom) => {
    if (!baseSize.width || !baseSize.height) return;

    const scaledW = baseSize.width * newZoom;
    const scaledH = baseSize.height * newZoom;
    const viewportSize = 280;

    const maxOffsetX = (scaledW - viewportSize) / 2;
    const maxOffsetY = (scaledH - viewportSize) / 2;

    const clampedX = Math.min(Math.max(position.x, -maxOffsetX), maxOffsetX);
    const clampedY = Math.min(Math.max(position.y, -maxOffsetY), maxOffsetY);

    setZoom(newZoom);
    setPosition({ x: clampedX, y: clampedY });
  };

  const cancelCrop = () => {
    setRawImage(null);
    setRawFile(null);
  };

  const uploadFile = async (file) => {
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    const formData = new FormData();
    formData.append('image', file);
    formData.append('folderType', folderType);

    setUploading(true);
    try {
      const response = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        toast.success('Logo uploaded to cloud! ☁️');
        onUploadSuccess(response.data.data);
        setPreview(response.data.data.imageUrl);
      }
    } catch (err) {
      toast.error('Upload failed. Please try again.');
      setPreview(currentImage || null);
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleCropSave = () => {
    if (!imageRef.current || !baseSize.width || !baseSize.height || !rawFile) return;

    setCropping(true);
    try {
      const canvas = document.createElement('canvas');
      const canvasSize = 400; // 1:1 square crop output size
      canvas.width = canvasSize;
      canvas.height = canvasSize;

      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvasSize, canvasSize);

      const viewportSize = 280;
      const S = canvasSize / viewportSize;

      const scaledW = baseSize.width * zoom;
      const scaledH = baseSize.height * zoom;

      // Find top-left coordinates relative to viewport
      const X_tl = (viewportSize - scaledW) / 2 + position.x;
      const Y_tl = (viewportSize - scaledH) / 2 + position.y;

      // Draw onto target canvas
      ctx.drawImage(
        imageRef.current,
        X_tl * S,
        Y_tl * S,
        scaledW * S,
        scaledH * S
      );

      canvas.toBlob(async (blob) => {
        if (!blob) {
          toast.error('Could not process image crop.');
          setCropping(false);
          return;
        }

        const croppedFile = new File([blob], rawFile.name || 'logo.png', { type: 'image/png' });
        await uploadFile(croppedFile);
        setRawImage(null);
        setRawFile(null);
        setCropping(false);
      }, 'image/png');

    } catch (err) {
      console.error('Cropping error:', err);
      toast.error('Error cropping image.');
      setCropping(false);
    }
  };

  const handleChange = (e) => startCropping(e.target.files?.[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    startCropping(e.dataTransfer.files?.[0]);
  };

  return (
    <div className="space-y-3">
      {/* Drop Zone */}
      <label
        htmlFor="image-uploader-input"
        className={`relative flex flex-col items-center justify-center w-full h-36 rounded-2xl border-2 border-dashed transition-all cursor-pointer
          ${dragOver ? 'border-emerald-500 bg-emerald-500/10' : 'border-border-muted/50 dark:border-white/10 hover:border-border-muted hover:bg-bg-primary/50'}
          ${uploading ? 'opacity-60 pointer-events-none' : ''}
        `}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {preview ? (
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={preview}
              alt="Logo Preview"
              className="h-full max-h-32 max-w-full object-contain rounded-xl p-2"
            />
            {uploading && (
              <div className="absolute inset-0 bg-bg-primary/70 backdrop-blur-sm flex items-center justify-center rounded-xl">
                <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold">
                  <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
                  Uploading...
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-text-secondary">
            <span className="material-symbols-outlined text-[36px] text-text-secondary/50">
              {uploading ? 'sync' : 'cloud_upload'}
            </span>
            <p className="text-xs font-bold uppercase tracking-widest">
              {uploading ? 'Uploading...' : 'Drop image or click to browse'}
            </p>
            <p className="text-[10px] text-text-secondary/50">PNG, JPG, WEBP · Max 5MB</p>
          </div>
        )}

        <input
          id="image-uploader-input"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleChange}
          disabled={uploading}
        />
      </label>

      {/* Change button if already has preview */}
      {preview && !uploading && (
        <button
          type="button"
          onClick={() => document.getElementById('image-uploader-input').click()}
          className="w-full text-center text-[11px] uppercase tracking-widest font-bold text-text-secondary hover:text-text-primary transition-colors"
        >
          ↑ Change Logo
        </button>
      )}

      {/* Crop Modal */}
      {rawImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-bg-secondary border border-border-muted/50 dark:border-white/10 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-6 flex flex-col items-center">
            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-text-primary tracking-tight">Crop & Center Logo</h3>
              <p className="text-xs text-text-secondary font-medium">Drag to position, use slider to zoom. Logo must be 1:1.</p>
            </div>

            {/* Cropping Viewport */}
            <div
              ref={viewportRef}
              className="relative w-[280px] h-[280px] bg-bg-primary rounded-2xl border border-border-muted/50 dark:border-white/10 overflow-hidden cursor-move select-none touch-none"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
            >
              <img
                ref={imageRef}
                src={rawImage}
                alt="Crop Preview"
                onLoad={handleImageLoad}
                className="absolute max-w-none pointer-events-none"
                style={{
                  transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${zoom})`,
                  transformOrigin: 'center',
                  width: baseSize.width ? `${baseSize.width}px` : 'auto',
                  height: baseSize.height ? `${baseSize.height}px` : 'auto',
                  left: baseSize.width ? `${(280 - baseSize.width) / 2}px` : '0px',
                  top: baseSize.height ? `${(280 - baseSize.height) / 2}px` : '0px',
                }}
              />

              {/* Circular Guide Mask Overlay */}
              <div className="absolute inset-0 pointer-events-none rounded-full m-2 border-2 border-dashed border-white/40 shadow-[0_0_0_9999px_rgba(15,23,42,0.65)]" />
            </div>

            {/* Zoom Controls */}
            <div className="w-full space-y-2">
              <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-wider text-text-secondary">
                <span>Zoom</span>
                <span>{Math.round(zoom * 100)}%</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => adjustZoom(Math.max(1, zoom - 0.1))}
                  className="p-1 rounded-lg hover:bg-bg-primary/50 text-text-secondary hover:text-text-primary transition"
                >
                  <span className="material-symbols-outlined text-[20px]">zoom_out</span>
                </button>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.01"
                  value={zoom}
                  onChange={(e) => adjustZoom(parseFloat(e.target.value))}
                  className="flex-1 h-1.5 bg-bg-primary rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => adjustZoom(Math.min(3, zoom + 0.1))}
                  className="p-1 rounded-lg hover:bg-bg-primary/50 text-text-secondary hover:text-text-primary transition"
                >
                  <span className="material-symbols-outlined text-[20px]">zoom_in</span>
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 w-full">
              <button
                type="button"
                onClick={cancelCrop}
                className="flex-1 py-3 rounded-xl bg-bg-primary border border-border-muted/50 dark:border-white/5 text-text-secondary font-black text-[12px] uppercase tracking-widest hover:text-text-primary transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCropSave}
                disabled={cropping}
                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-[12px] uppercase tracking-widest transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {cropping ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                    Cropping...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">crop</span>
                    Apply Crop
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
