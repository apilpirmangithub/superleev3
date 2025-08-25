"use client";

import React from "react";
import { Bot, Eye, AlertTriangle, CheckCircle } from "lucide-react";

interface AIDetectionResult {
  isAI: boolean;
  confidence: number;
  status?: 'detecting' | 'completed' | 'failed';
}

interface AIDetectionDisplayProps {
  result?: AIDetectionResult;
  isAnalyzing?: boolean;
  className?: string;
}

export function AIDetectionDisplay({ result, isAnalyzing = false, className = "" }: AIDetectionDisplayProps) {
  if (!result && !isAnalyzing) {
    return null;
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-red-400";
    if (confidence >= 0.6) return "text-yellow-400";
    return "text-green-400";
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return "Tinggi";
    if (confidence >= 0.6) return "Sedang";
    return "Rendah";
  };

  if (isAnalyzing) {
    return (
      <div className={`rounded-xl border border-white/10 bg-white/5 p-4 ${className}`}>
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-full bg-blue-500/20">
            <Bot className="h-5 w-5 text-blue-400 animate-pulse" />
          </div>
          <div>
            <h3 className="font-medium text-white">Mendeteksi AI</h3>
            <p className="text-sm text-white/70">Menganalisis gambar untuk mendeteksi konten yang dibuat AI...</p>
          </div>
        </div>
        
        <div className="w-full bg-white/10 rounded-full h-1.5">
          <div className="bg-blue-400 h-1.5 rounded-full animate-pulse w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className={`rounded-xl border border-white/10 bg-white/5 p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-full ${result.isAI ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
          {result.isAI ? (
            <Bot className="h-5 w-5 text-red-400" />
          ) : (
            <Eye className="h-5 w-5 text-green-400" />
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-medium text-white">Hasil Deteksi AI</h3>
            {result.status === 'completed' && (
              <CheckCircle className="h-4 w-4 text-green-400" />
            )}
            {result.status === 'failed' && (
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/70">Status:</span>
              <span className={`text-sm font-medium ${result.isAI ? 'text-red-400' : 'text-green-400'}`}>
                {result.isAI ? 'Terdeteksi AI' : 'Asli/Manual'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/70">Tingkat Keyakinan:</span>
              <span className={`text-sm font-medium ${getConfidenceColor(result.confidence)}`}>
                {((result.confidence || 0) * 100).toFixed(1)}% ({getConfidenceText(result.confidence || 0)})
              </span>
            </div>

            {/* Confidence bar */}
            <div className="w-full bg-white/10 rounded-full h-2 mt-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  (result.confidence || 0) >= 0.8 ? 'bg-red-400' :
                  (result.confidence || 0) >= 0.6 ? 'bg-yellow-400' : 'bg-green-400'
                }`}
                style={{ width: `${(result.confidence || 0) * 100}%` }}
              />
            </div>

            {/* AI detection explanation */}
            <div className="mt-3 p-3 rounded-lg bg-black/30 border border-white/5">
              <p className="text-xs text-white/60">
                {result.isAI ? (
                  <>
                    <strong>🤖 AI Terdeteksi:</strong> Gambar ini kemungkinan dibuat menggunakan AI. 
                    Ini akan ditandai dalam metadata dan atribut NFT untuk transparansi.
                  </>
                ) : (
                  <>
                    <strong>✨ Konten Asli:</strong> Gambar ini kemungkinan dibuat secara manual atau tidak terdeteksi sebagai AI. 
                    Akan ditandai sebagai konten original.
                  </>
                )}
              </p>
            </div>

            {/* Tags that will be added */}
            <div className="flex flex-wrap gap-1 mt-2">
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {result.isAI ? '🤖 AI-generated' : '✨ Original'}
              </span>
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {getConfidenceText(result.confidence)} confidence
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
