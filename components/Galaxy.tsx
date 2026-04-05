
import React, { useRef, useEffect } from 'react';

interface GalaxyProps {
  mouseInteraction?: boolean;
  density?: number;
}

/**
 * StarField Component
 * Renders a high-performance, immersive star field with depth and parallax.
 * Optimized for robustness to prevent rendering issues on initial load.
 */
const Galaxy: React.FC<GalaxyProps> = ({
  mouseInteraction = true,
  density = 2,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Use alpha: true to allow transparency. 
    const ctx = canvas.getContext('2d', { alpha: true }); 
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let animationFrameId: number;
    let stars: Star[] = [];
    
    // Mouse state
    let mouseX = 0;
    let mouseY = 0;
    
    // Smooth camera movement variables (Inertia)
    let cameraX = 0;
    let cameraY = 0;

    // Mouse Velocity for "Warp" effect
    let targetSpeedMultiplier = 1;
    let currentSpeedMultiplier = 1;

    class Star {
        x: number;
        y: number;
        z: number;
        prevZ: number;
        speed: number;
        baseSize: number;
        color: string;

        constructor() {
            this.x = Math.random() * width - width / 2;
            this.y = Math.random() * height - height / 2;
            this.z = Math.random() * width;
            this.prevZ = this.z;
            this.speed = Math.random() * 2 + 0.5; // Varied speed
            this.baseSize = Math.random() * 2 + 0.5;
            // Slight blue/white variations
            const blue = Math.floor(Math.random() * 55) + 200;
            // Occasional cyan/purple stars for theme matching
            if (Math.random() > 0.9) {
                 this.color = `rgb(100, 200, 255)`; // Cyanish
            } else if (Math.random() > 0.9) {
                 this.color = `rgb(200, 100, 255)`; // Purplish
            } else {
                 this.color = `rgb(${blue}, ${blue}, 255)`;
            }
        }

        update() {
            // Move star closer (Z-axis movement)
            // Apply speed multiplier based on mouse movement
            this.z -= this.speed * 4 * currentSpeedMultiplier; 
            
            // Mouse Parallax with Inertia
            if (mouseInteraction) {
                // Calculate offset based on smoothed camera position
                // Stars closer to camera (z near 0) move more relative to view
                const depthFactor = (width - this.z) / width;
                
                // Drift effect - Increased responsiveness
                this.x -= (cameraX - width / 2) * 0.001 * depthFactor * this.speed;
                this.y -= (cameraY - height / 2) * 0.001 * depthFactor * this.speed;
            }

            // Reset if passes camera
            if (this.z <= 1) {
                this.reset();
            }
        }

        reset() {
            this.z = width;
            this.prevZ = this.z;
            this.x = Math.random() * width - width / 2;
            this.y = Math.random() * height - height / 2;
        }

        draw() {
            let x, y, size;
            const cx = width / 2;
            const cy = height / 2;
            
            // 3D Projection
            x = (this.x / this.z) * width + cx;
            y = (this.y / this.z) * height + cy;
            
            // Size based on depth
            const scale = (1 - this.z / width);
            size = this.baseSize * scale * scale * 4;
            
            // Draw
            if (x >= 0 && x < width && y >= 0 && y < height && size > 0) {
                const opacity = scale;
                ctx!.fillStyle = this.color.replace('rgb', 'rgba').replace(')', `, ${opacity})`);
                
                ctx!.beginPath();
                ctx!.arc(x, y, size, 0, Math.PI * 2);
                ctx!.fill();
                
                // Draw "Warp" Trail
                // Uses previous Z to draw a line trailing behind the star
                // Trail length increases with speed multiplier
                if (this.prevZ > this.z) {
                    const prevX = (this.x / this.prevZ) * width + cx;
                    const prevY = (this.y / this.prevZ) * height + cy;
                    
                    const trailOpacity = opacity * 0.3 * (currentSpeedMultiplier > 1.5 ? 0.8 : 0.3);
                    ctx!.strokeStyle = this.color.replace('rgb', 'rgba').replace(')', `, ${trailOpacity})`);
                    ctx!.lineWidth = size;
                    ctx!.beginPath();
                    ctx!.moveTo(x, y);
                    ctx!.lineTo(prevX, prevY);
                    ctx!.stroke();
                }
            }
            
            this.prevZ = this.z;
        }
    }

    const initStars = () => {
        if (width <= 0 || height <= 0) return;
        stars = [];
        const starCount = Math.floor((width * height) / 6000 * density); 
        for (let i = 0; i < starCount; i++) {
            stars.push(new Star());
        }
    };

    const render = () => {
        if (!ctx) return;
        ctx.clearRect(0, 0, width, height);

        // Smooth camera inertia
        // Approaches the actual mouse position gradually (ease-out)
        const ease = 0.08;
        const dx = mouseX - cameraX;
        const dy = mouseY - cameraY;
        
        cameraX += dx * ease;
        cameraY += dy * ease;

        // Calculate velocity magnitude for warp effect
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Target multiplier increases with mouse speed
        // Base is 1, adds up to 4x speed when moving fast
        targetSpeedMultiplier = 1 + (dist * 0.01);
        
        // Smoothly interpolate current speed towards target
        currentSpeedMultiplier += (targetSpeedMultiplier - currentSpeedMultiplier) * 0.1;

        stars.forEach(star => {
            star.update();
            star.draw();
        });

        animationFrameId = requestAnimationFrame(render);
    };

    const handleResize = () => {
        if (!container) return;
        
        const dpr = window.devicePixelRatio || 1;
        const rect = container.getBoundingClientRect();
        
        if (rect.width === 0 || rect.height === 0) return;

        width = rect.width;
        height = rect.height;
        
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        
        ctx.scale(dpr, dpr);
        
        if (stars.length === 0) {
            initStars();
        }
    };

    const onMouseMove = (e: MouseEvent) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    };

    const resizeObserver = new ResizeObserver(() => {
        // Prevent "ResizeObserver loop completed with undelivered notifications"
        // by wrapping layout updates in rAF
        window.requestAnimationFrame(() => {
            if (!container) return;
            handleResize();
        });
    });
    resizeObserver.observe(container);

    window.addEventListener('mousemove', onMouseMove);
    handleResize();
    render();

    return () => {
        window.removeEventListener('mousemove', onMouseMove);
        resizeObserver.disconnect();
        cancelAnimationFrame(animationFrameId);
    };
  }, [mouseInteraction, density]);

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full bg-transparent pointer-events-none z-[-1]">
        <canvas ref={canvasRef} className="block w-full h-full opacity-70 mix-blend-screen" />
    </div>
  );
};

export default Galaxy;
