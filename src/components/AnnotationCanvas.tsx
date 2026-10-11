import React, { useRef, useEffect, useState } from 'react';
import { Pencil, Square, Type, RotateCcw, Trash2 } from 'lucide-react';

interface AnnotationCanvasProps {
  imageSrc: string;
  onSave: (annotatedImage: string) => void;
  onCancel: () => void;
}

export const AnnotationCanvas: React.FC<AnnotationCanvasProps> = ({ imageSrc, onSave, onCancel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'pen' | 'rect' | 'text'>('pen');
  const [color, setColor] = useState('#f59e0b'); // amber-500
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
    };
  }, [imageSrc]);

  const getPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    setStartPos(getPos(e));
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const pos = getPos(e);

    if (tool === 'pen') {
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(startPos.x, startPos.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      setStartPos(pos);
    }
  };

  const stopDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const pos = getPos(e);

    if (tool === 'rect') {
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.strokeRect(startPos.x, startPos.y, pos.x - startPos.x, pos.y - startPos.y);
    }
    // Text handling would be more complex, for now keep it simple.
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 p-2 bg-[#080b12] rounded-xl border border-slate-700">
        <button onClick={() => setTool('pen')} className={`p-2 rounded-lg ${tool === 'pen' ? 'bg-slate-700' : ''}`}><Pencil className="w-4 h-4" /></button>
        <button onClick={() => setTool('rect')} className={`p-2 rounded-lg ${tool === 'rect' ? 'bg-slate-700' : ''}`}><Square className="w-4 h-4" /></button>
        <button onClick={() => setTool('text')} className={`p-2 rounded-lg ${tool === 'text' ? 'bg-slate-700' : ''}`}><Type className="w-4 h-4" /></button>
        <div className="w-px h-6 bg-slate-700 mx-2" />
        <button onClick={() => {
            const canvas = canvasRef.current!;
            const ctx = canvas.getContext('2d')!;
            const img = new Image();
            img.src = imageSrc;
            img.onload = () => {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0);
            };
        }} className="p-2 text-rose-400"><RotateCcw className="w-4 h-4" /></button>
      </div>
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        className="max-h-[360px] w-full object-contain cursor-crosshair border border-slate-700 rounded-lg"
      />
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white">Cancel</button>
        <button onClick={() => onSave(canvasRef.current!.toDataURL('image/png'))} className="px-4 py-2 text-xs font-bold bg-amber-500 rounded-lg text-slate-950">Save Annotations</button>
      </div>
    </div>
  );
};
