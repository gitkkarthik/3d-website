export const TOTAL_FRAMES = 174;

export class FrameLoader {
  private static instance: FrameLoader;
  private images: (HTMLImageElement | null)[] = new Array(TOTAL_FRAMES).fill(null);
  private loadedCount = 0;
  private isFullyLoaded = false;

  public static getInstance(): FrameLoader {
    if (!FrameLoader.instance) {
      FrameLoader.instance = new FrameLoader();
    }
    return FrameLoader.instance;
  }

  public getFramePath(index: number): string {
    const frameNum = String(index + 1).padStart(3, '0');
    return `/frames/ezgif-frame-${frameNum}.jpg`;
  }

  public preloadAll(onProgress: (progress: number) => void): Promise<void> {
    return new Promise((resolve) => {
      if (this.isFullyLoaded) {
        onProgress(100);
        resolve();
        return;
      }

      let completed = 0;

      const loadNextBatch = (startIndex: number, batchSize: number) => {
        for (let i = startIndex; i < Math.min(startIndex + batchSize, TOTAL_FRAMES); i++) {
          if (this.images[i]) {
            completed++;
            continue;
          }

          const img = new Image();
          img.src = this.getFramePath(i);
          
          img.onload = () => {
            this.images[i] = img;
            completed++;
            this.loadedCount = completed;
            const progress = Math.min(100, Math.floor((completed / TOTAL_FRAMES) * 100));
            onProgress(progress);

            if (completed >= TOTAL_FRAMES) {
              this.isFullyLoaded = true;
              resolve();
            }
          };

          img.onerror = () => {
            completed++;
            if (completed >= TOTAL_FRAMES) {
              this.isFullyLoaded = true;
              resolve();
            }
          };
        }
      };

      const BATCH_SIZE = 20;
      let currentBatch = 0;

      const scheduleBatch = () => {
        if (currentBatch * BATCH_SIZE < TOTAL_FRAMES) {
          loadNextBatch(currentBatch * BATCH_SIZE, BATCH_SIZE);
          currentBatch++;
          setTimeout(scheduleBatch, 10);
        }
      };

      scheduleBatch();
    });
  }

  public getFrame(index: number): HTMLImageElement | null {
    const safeIndex = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.round(index)));
    return this.images[safeIndex];
  }

  public drawFrameToCanvas(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    index: number,
    zoomScale = 1.0,
    offsetY = 0
  ) {
    this.drawWavyFrameToCanvas(ctx, canvas, index, 0, 0, zoomScale, offsetY);
  }

  /**
   * Out-of-the-box Liquid Sine-Wave Distortion Canvas Rendering
   * Slices the frame horizontally and applies a dynamic sine-wave displacement
   * driven by scroll velocity & time to simulate fluid silk undulating in motion.
   */
  public drawWavyFrameToCanvas(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    index: number,
    scrollVelocity: number, // positive/negative scroll speed
    timeMs: number,
    zoomScale = 1.0,
    offsetY = 0
  ) {
    const img = this.getFrame(index);
    if (!img || !img.complete || img.naturalWidth === 0) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    const imgRatio = img.naturalWidth / img.naturalHeight;
    const drawH = (canvasHeight / dpr) * zoomScale;
    const drawW = drawH * imgRatio;

    const drawX = ((canvasWidth / dpr) - drawW) / 2;
    const drawY = (((canvasHeight / dpr) - drawH) / 2) + offsetY;

    ctx.save();
    ctx.scale(dpr, dpr);

    const velocityAmp = Math.min(35, Math.abs(scrollVelocity) * 0.8);
    const ambientAmp = Math.sin(timeMs * 0.002) * 4;
    const totalAmp = velocityAmp + ambientAmp;
    
    const waveFrequency = 0.012;
    const sliceHeight = 4;

    const targetH = drawH;

    for (let y = 0; y < targetH; y += sliceHeight) {
      const xDisplacement = Math.sin((y * waveFrequency) + (timeMs * 0.003) + (scrollVelocity * 0.015)) * totalAmp;

      const srcY = (y / targetH) * img.naturalHeight;
      const srcH = Math.min((sliceHeight / targetH) * img.naturalHeight, img.naturalHeight - srcY);

      if (srcH <= 0) break;

      ctx.drawImage(
        img,
        0,
        srcY,
        img.naturalWidth,
        srcH,
        drawX + xDisplacement,
        drawY + y,
        drawW,
        sliceHeight
      );
    }

    const gradient = ctx.createLinearGradient(0, (canvasHeight / dpr) - 140, 0, canvasHeight / dpr);
    gradient.addColorStop(0, 'rgba(7, 7, 9, 0)');
    gradient.addColorStop(1, 'rgba(7, 7, 9, 0.9)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, (canvasHeight / dpr) - 140, canvasWidth / dpr, 140);

    ctx.restore();
  }
}
