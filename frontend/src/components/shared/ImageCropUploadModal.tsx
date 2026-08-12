import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Upload,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RefreshCw,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle2,
  Camera,
  VideoOff,
  FlipHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { uploadImage } from "@/services/imageUpload";
import { useCamera } from "@/hooks/useCamera";
import { cn } from "@/lib/utils";
import { CameraCapture } from "@/components/shared/CameraCapture";
import { TypoCaption } from "@/components/shared/Typography";

export type ImageCropMode = "avatar" | "banner";

export interface ImageCropUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (url: string) => void;
  mode?: ImageCropMode;
  maxSizeMB?: number;
  title?: string;
}

const MAX_FILE_SIZE_DEFAULT_MB = 5;

export function ImageCropUploadModal({
  isOpen,
  onClose,
  onUploadSuccess,
  mode = "avatar",
  maxSizeMB = MAX_FILE_SIZE_DEFAULT_MB,
  title,
}: ImageCropUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Crop canvas controls
  const [zoom, setZoom] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Progress state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);

  const [isCameraMode, setIsCameraMode] = useState(false);
  const {
    cameraState,
    stream,
    videoRef,
    errorMsg,
    startCamera,
    stopCamera,
    switchCamera,
  } = useCamera();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const aspectRatio = mode === "banner" ? 3 / 1 : 1 / 1;
  const modalTitle = title ?? (mode === "banner" ? "Upload Banner Image" : "Upload Avatar Image");

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      setPreviewUrl(null);
      setError(null);
      setIsCameraActive(false);
      setZoom(1.0);
      setRotation(0);
      setPanX(0);
      setPanY(0);
      setIsUploading(false);
      setUploadProgress(0);
      setUploadComplete(false);
      setIsCameraMode(false);
      stopCamera();
    }
  }, [isOpen, stopCamera]);

  const validateAndLoadFile = (file: File) => {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (.jpg, .png, .webp, .gif).");
      return;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size exceeds the maximum allowed size of ${maxSizeMB}MB.`);
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPreviewUrl(reader.result);
        const img = new Image();
        img.src = reader.result;
        img.onload = () => {
          imageRef.current = img;
          setZoom(1.0);
          setRotation(0);
          setPanX(0);
          setPanY(0);
        };
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCapturePhoto = useCallback(() => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
        stopCamera();
        setIsCameraMode(false);
        validateAndLoadFile(file);
      }
    }, "image/jpeg", 0.9);
  }, [videoRef, stopCamera]);

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndLoadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndLoadFile(e.target.files[0]);
    }
  };

  // Canvas drawing & crop rendering
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const canvasWidth = mode === "banner" ? 600 : 400;
    const canvasHeight = Math.round(canvasWidth / aspectRatio);

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.save();

    // Move to center of canvas for rotation and scale
    const centerX = canvasWidth / 2 + panX;
    const centerY = canvasHeight / 2 + panY;
    ctx.translate(centerX, centerY);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);

    // Calculate image render dimensions preserving aspect ratio
    const imgAspect = img.width / img.height;
    let drawW = canvasWidth;
    let drawH = canvasWidth / imgAspect;

    if (drawH < canvasHeight) {
      drawH = canvasHeight;
      drawW = canvasHeight * imgAspect;
    }

    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
  }, [aspectRatio, mode, panX, panY, rotation, zoom]);

  useEffect(() => {
    if (previewUrl && imageRef.current) {
      drawCanvas();
    }
  }, [previewUrl, zoom, rotation, panX, panY, drawCanvas]);

  // Canvas mouse pan controls
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsMouseDown(true);
    setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDown) return;
    setPanX(e.clientX - dragStart.x);
    setPanY(e.clientY - dragStart.y);
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
  };

  const handleResetCrop = () => {
    setZoom(1.0);
    setRotation(0);
    setPanX(0);
    setPanY(0);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Convert canvas content to blob and upload
  const handleUpload = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsUploading(true);
    setUploadProgress(10);
    setError(null);

    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          setError("Failed to process cropped image.");
          setIsUploading(false);
          return;
        }

        try {
          const result = await uploadImage(blob, `cropped-${mode}.webp`, (percent) => {
            setUploadProgress(percent);
          });

          setUploadProgress(100);
          setUploadComplete(true);
          toast.success("Image uploaded successfully!");

          setTimeout(() => {
            onUploadSuccess(result.url);
            onClose();
          }, 400);
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Failed to upload image.";
          setError(msg);
          toast.error(msg);
          setIsUploading(false);
        }
      },
      "image/webp",
      0.9,
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isUploading && onClose()}>
      <DialogContent className="max-w-xl rounded-xl border border-border bg-card p-6 shadow-xl sm:max-w-2xl">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
            {modalTitle}
          </DialogTitle>
        </DialogHeader>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Upload State / Dropzone vs Canvas View */}
        {isCameraActive ? (
          <CameraCapture
            onCapture={(file) => {
              setIsCameraActive(false);
              validateAndLoadFile(file);
            }}
            onCancel={() => setIsCameraActive(false)}
          />
        ) : !previewUrl ? (
          <div className="flex flex-col gap-4">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors cursor-pointer text-center",
                isDragging
                  ? "border-primary bg-primary/10"
                  : "border-border bg-muted/30 hover:border-primary/60 hover:bg-muted/50",
              )}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Upload size={24} />
              </div>
              <p className="mt-3 text-sm font-medium text-foreground">
                Drag & drop your image here, or <span className="text-primary underline">browse</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Supports JPEG, PNG, WebP, GIF · Max {maxSizeMB}MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                data-testid="file-input"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-border"></div>
              <span className="shrink-0 px-4 text-xs text-muted-foreground uppercase tracking-wider">or</span>
              <div className="flex-grow border-t border-border"></div>
            </div>
            
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 gap-2 rounded-xl"
              onClick={() => setIsCameraActive(true)}
            >
              <Camera size={18} />
              Take a Photo
            </Button>
        {!previewUrl ? (
          isCameraMode ? (
            <div className="flex flex-col items-center justify-center space-y-4 rounded-xl border border-border bg-black/90 p-4 min-h-[300px]">
              {cameraState === "ready" && stream ? (
                <div className="relative w-full max-w-sm overflow-hidden rounded-lg bg-black flex justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-auto object-cover"
                    style={{ maxHeight: "300px", transform: "scaleX(-1)" }}
                  />
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center gap-4">
                     <Button type="button" size="icon" variant="secondary" onClick={(e) => { e.stopPropagation(); switchCamera(); }} className="rounded-full h-10 w-10">
                        <FlipHorizontal size={18} />
                     </Button>
                     <Button type="button" size="icon" className="rounded-full h-12 w-12 bg-white text-black hover:bg-gray-200" onClick={(e) => { e.stopPropagation(); handleCapturePhoto(); }}>
                        <Camera size={24} />
                     </Button>
                     <Button type="button" size="icon" variant="destructive" onClick={(e) => { e.stopPropagation(); stopCamera(); setIsCameraMode(false); }} className="rounded-full h-10 w-10">
                        <VideoOff size={18} />
                     </Button>
                  </div>
                </div>
              ) : cameraState === "requesting_permission" ? (
                <div className="text-sm text-white p-8 animate-pulse">Requesting camera permission...</div>
              ) : cameraState === "permission_denied" ? (
                <div className="text-sm text-destructive p-8 flex flex-col items-center gap-2 bg-black/40 rounded-lg">
                  <AlertCircle size={24} />
                  <span>Camera permission denied.</span>
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsCameraMode(false)} className="mt-2 text-foreground">Back to upload</Button>
                </div>
              ) : (
                <div className="text-sm text-destructive p-8 flex flex-col items-center gap-2 bg-black/40 rounded-lg">
                  <AlertCircle size={24} />
                  <span>{errorMsg || "Camera is unavailable."}</span>
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsCameraMode(false)} className="mt-2 text-foreground">Back to upload</Button>
                </div>
              )}
            </div>
            <p className="mt-3 text-sm font-medium text-foreground">
              Drag & drop your image here, or <span className="text-primary underline">browse</span>
            </p>
            <TypoCaption as="p">
              Supports JPEG, PNG, WebP, GIF · Max {maxSizeMB}MB
            </TypoCaption>
            <input
              ref={fileInputRef}
              type="file"
              data-testid="file-input"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
          ) : (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                "flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors text-center",
                isDragging
                  ? "border-primary bg-primary/10"
                  : "border-border bg-muted/30 hover:border-primary/60",
              )}
            >
              <div 
                className="flex flex-col items-center cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Upload size={24} />
                </div>
                <p className="mt-3 text-sm font-medium text-foreground">
                  Drag & drop your image here, or <span className="text-primary underline">browse</span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground mb-4">
                  Supports JPEG, PNG, WebP, GIF · Max {maxSizeMB}MB
                </p>
              </div>
              
              <div className="flex items-center gap-3 mt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setIsCameraMode(true); 
                    startCamera(); 
                  }}
                  className="z-10 relative"
                >
                  <Camera size={16} className="mr-2" />
                  Take Photo
                </Button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                data-testid="file-input"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          )
        ) : (
          <div className="space-y-4">
            {/* Interactive Canvas & Preview */}
            <div className="relative flex justify-center overflow-hidden rounded-xl border border-border bg-black/90 p-4">
              <div
                className={cn(
                  "relative overflow-hidden cursor-grab active:cursor-grabbing border-2 border-primary/50 shadow-md",
                  mode === "avatar" ? "rounded-full" : "rounded-lg",
                )}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{
                  width: mode === "banner" ? "100%" : "240px",
                  maxHeight: mode === "banner" ? "180px" : "240px",
                  aspectRatio: `${aspectRatio}`,
                }}
              >
                <canvas ref={canvasRef} className="h-full w-full object-contain" />
              </div>
            </div>

            {/* Crop Controls: Zoom, Pan, Rotate, Reset */}
            {!isUploading && !uploadComplete && (
              <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-3">
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                  {/* Zoom Slider */}
                  <div className="flex items-center gap-2 flex-1 min-w-[180px]">
                    <ZoomOut size={14} className="text-muted-foreground shrink-0" />
                    <input
                      type="range"
                      min="1.0"
                      max="3.0"
                      step="0.05"
                      value={zoom}
                      onChange={(e) => setZoom(parseFloat(e.target.value))}
                      className="h-1.5 flex-1 appearance-none rounded-lg bg-border accent-primary cursor-pointer"
                    />
                    <ZoomIn size={14} className="text-muted-foreground shrink-0" />
                    <TypoCaption>
                      {Math.round(zoom * 100)}%
                    </TypoCaption>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRotate}
                      className="h-8 gap-1 px-2.5 text-xs"
                      title="Rotate 90 degrees"
                    >
                      <RotateCw size={13} />
                      Rotate
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleResetCrop}
                      className="h-8 gap-1 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                      title="Reset position and zoom"
                    >
                      <RefreshCw size={13} />
                      Reset
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Upload Progress Indicator Bar */}
            {(isUploading || uploadComplete) && (
              <div className="space-y-2 rounded-lg border border-border bg-card p-4">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-foreground">
                    {uploadComplete ? (
                      <>
                        <CheckCircle2 size={15} className="text-emerald-500" />
                        <span>Upload complete!</span>
                      </>
                    ) : (
                      <>
                        <ImageIcon size={15} className="text-primary animate-pulse" />
                        <span>Uploading image...</span>
                      </>
                    )}
                  </span>
                  <TypoCaption>{uploadProgress}%</TypoCaption>
                </div>

                {/* Progress Bar Container */}
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full transition-all duration-300 ease-out",
                      uploadComplete ? "bg-emerald-500" : "bg-primary",
                    )}
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="mt-4 gap-2 sm:gap-0">
          {previewUrl && !isUploading && !uploadComplete && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setPreviewUrl(null);
                setSelectedFile(null);
              }}
              className="mr-auto text-xs"
            >
              Choose different file
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isUploading}
            className="text-xs"
          >
            Cancel
          </Button>

          {previewUrl && !uploadComplete && (
            <Button
              type="button"
              onClick={handleUpload}
              disabled={isUploading || !selectedFile}
              className="text-xs font-medium"
            >
              {isUploading ? "Uploading..." : "Crop & Save Image"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
