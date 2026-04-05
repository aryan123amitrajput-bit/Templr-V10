
import React, { useRef, useEffect } from 'react';

const QuantumFlow: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;
    let width = 0;
    let height = 0;
    let animationFrameId: number;

    const resize = () => {
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      // Double resolution for retina screens, but scale back with CSS
      canvas.width = width * 1; 
      canvas.height = height * 1;
    };

    const drawWave = (
      yOffset: number, 
      amplitude: number, 
      frequency: number, 
      speed: number, 
      color: string, 
      thickness: number
    ) => {
        ctx.beginPath();
        ctx.lineWidth = thickness;
        ctx.strokeStyle = color;
        
        // Use 'lighter' for that neon glow additive effect
        ctx.globalCompositeOperation = 'screen'; 

        for (let x = 0; x < width; x += 5) {
            // Complex wave superposition for "liquid" 3D feel
            const y = yOffset + 
                      Math.sin(x * frequency + time * speed) * amplitude +
                      Math.sin(x * frequency * 0.5 + time * speed * 0.5) * (amplitude * 0.5);
            
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    };

    const animate = () => {
        ctx.clearRect(0, 0, width, height);
        
        // Background fade for trails (optional, disabling for cleaner look)
        // ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        // ctx.fillRect(0, 0, width, height);

        time += 0.015;

        const cy = height / 2;

        // Draw multiple layers of waves to create depth
        // Deep Purple/Blue Base
        drawWave(cy, 60, 0.003, 1, 'rgba(76, 29, 149, 0.3)', 20); 
        drawWave(cy, 50, 0.005, 1.2, 'rgba(124, 58, 237, 0.4)', 15);
        
        // Mid Cyan/Indigo
        drawWave(cy, 40, 0.008, 1.5, 'rgba(37, 99, 235, 0.5)', 8);
        drawWave(cy, 35, 0.01, 1.8, 'rgba(6, 182, 212, 0.6)', 5);

        // Bright Highlights (White/Cyan)
        drawWave(cy, 25, 0.015, 2.5, 'rgba(34, 211, 238, 0.8)', 2);
        drawWave(cy, 20, 0.02, 3.0, 'rgba(255, 255, 255, 0.9)', 1);

        animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', resize);
    resize();
    animate();

    return () => {
        window.removeEventListener('resize', resize);
        cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="w-full h-full relative overflow-hidden">
        {/* Blur container to soften the canvas lines into a glow */}
        <canvas 
            ref={canvasRef} 
            className="w-full h-full block blur-[8px] opacity-80"
            style={{ transform: 'scaleY(1.5)' }} // Stretch vertically for dramatic effect
        />
        
        {/* Overlay Vignette to blend edges */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black"></div>
    </div>
  );
};

export default QuantumFlow;
