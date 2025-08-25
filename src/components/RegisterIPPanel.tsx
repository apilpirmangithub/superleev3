"use client";

import React, { useState, useEffect } from "react";
import { Upload, X, FileImage, Sparkles } from "lucide-react";
import { LicenseSelector } from "./LicenseSelector";
import { AIDetectionDisplay } from "./AIDetectionDisplay";
import { useFileUpload } from "@/hooks/useFileUpload";
import { detectAI, fileToBuffer } from "@/services";
import { DEFAULT_LICENSE_SETTINGS, type LicenseSettings } from "@/lib/license/terms";

interface RegisterIPPanelProps {
  onRegister?: (file: File, title: string, description: string, license: LicenseSettings, aiResult?: any) => void;
  className?: string;
}

export function RegisterIPPanel({ onRegister, className = "" }: RegisterIPPanelProps) {
  const fileUpload = useFileUpload();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedLicense, setSelectedLicense] = useState<LicenseSettings>(DEFAULT_LICENSE_SETTINGS);
  const [aiDetectionResult, setAiDetectionResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showLicenseSelector, setShowLicenseSelector] = useState(false);

  // Auto-analyze when file is uploaded
  useEffect(() => {
    if (fileUpload.file && !isAnalyzing) {
      analyzeImage();
    }
  }, [fileUpload.file]);

  const analyzeImage = async () => {
    if (!fileUpload.file) return;

    setIsAnalyzing(true);
    setAiDetectionResult(null);

    try {
      const buffer = await fileToBuffer(fileUpload.file);
      const result = await detectAI(buffer);
      setAiDetectionResult({
        ...result,
        status: 'completed'
      });
    } catch (error) {
      console.error('AI detection failed:', error);
      setAiDetectionResult({
        isAI: false,
        confidence: 0,
        status: 'failed'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRegister = () => {
    if (fileUpload.file && onRegister) {
      onRegister(fileUpload.file, title, description, selectedLicense, aiDetectionResult);
    }
  };

  const canRegister = fileUpload.file && title.trim() && description.trim();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="h-6 w-6 text-purple-400" />
          <h2 className="text-xl font-semibold text-white">Daftarkan IP Anda</h2>
        </div>
        <p className="text-sm text-white/70">Upload gambar, pilih lisensi, dan daftarkan sebagai IP di Story Protocol</p>
      </div>

      {/* File Upload */}
      <div className="space-y-4">
        {!fileUpload.file ? (
          <div
            onClick={() => document.getElementById('file-input')?.click()}
            className="relative border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-white/30 hover:bg-white/5 transition-all cursor-pointer group"
          >
            <input
              id="file-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => fileUpload.handleFileSelect(e.target.files?.[0])}
            />
            
            <div className="space-y-3">
              <div className="mx-auto w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                <Upload className="h-8 w-8 text-purple-400" />
              </div>
              <div>
                <p className="text-white font-medium">Pilih gambar untuk didaftarkan</p>
                <p className="text-sm text-white/60">PNG, JPG, GIF hingga 10MB</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-start gap-4">
              <div className="relative">
                <img
                  src={fileUpload.previewUrl!}
                  alt="Preview"
                  className="w-20 h-20 rounded-lg object-cover"
                />
                <button
                  onClick={fileUpload.removeFile}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <FileImage className="h-4 w-4 text-purple-400" />
                  <span className="font-medium text-white truncate">{fileUpload.file.name}</span>
                </div>
                <p className="text-xs text-white/60">
                  {(fileUpload.file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <button
                  onClick={analyzeImage}
                  className="mt-2 text-xs px-2 py-1 rounded bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors"
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? 'Menganalisis...' : 'Analisis Ulang'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AI Detection Results */}
      {(fileUpload.file && (isAnalyzing || aiDetectionResult)) && (
        <AIDetectionDisplay
          result={aiDetectionResult}
          isAnalyzing={isAnalyzing}
        />
      )}

      {/* IP Metadata */}
      {fileUpload.file && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            Informasi IP
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Judul IP *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Masukkan judul untuk IP Anda"
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/50 focus:border-blue-400/50 focus:ring-1 focus:ring-blue-400/30 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Deskripsi *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Deskripsikan IP Anda..."
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/50 focus:border-blue-400/50 focus:ring-1 focus:ring-blue-400/30 focus:outline-none resize-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* License Selection */}
      {fileUpload.file && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              Pengaturan Lisensi
            </div>
            <button
              onClick={() => setShowLicenseSelector(!showLicenseSelector)}
              className="text-xs px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors"
            >
              {showLicenseSelector ? 'Sembunyikan' : 'Pilih Lisensi'}
            </button>
          </div>

          {/* Current license preview */}
          <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-400/20">
            <div className="text-sm font-medium text-purple-300 mb-1">Lisensi Aktif:</div>
            <div className="text-sm text-white/80">
              {selectedLicense.pilType === 'open_use' && '🎁 Open Use - Gratis untuk penggunaan non-komersial'}
              {selectedLicense.pilType === 'non_commercial_remix' && '🔄 Non-Commercial Remix - Boleh remix, tidak komersial'}
              {selectedLicense.pilType === 'commercial_use' && '💼 Commercial Use - Boleh komersial, tidak boleh remix'}
              {selectedLicense.pilType === 'commercial_remix' && '🎨 Commercial Remix - Boleh komersial + remix dengan bagi hasil'}
            </div>
          </div>

          {/* License selector */}
          {showLicenseSelector && (
            <LicenseSelector
              selectedLicense={selectedLicense}
              onLicenseChange={setSelectedLicense}
            />
          )}
        </div>
      )}

      {/* Register Button */}
      {fileUpload.file && (
        <button
          onClick={handleRegister}
          disabled={!canRegister}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white font-medium hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {canRegister ? 'Daftarkan IP' : 'Lengkapi informasi untuk melanjutkan'}
        </button>
      )}

      {/* Summary */}
      {fileUpload.file && aiDetectionResult && canRegister && (
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
          <h4 className="font-medium text-white mb-2">Ringkasan Pendaftaran:</h4>
          <div className="text-sm space-y-1 text-white/70">
            <p>• <strong>File:</strong> {fileUpload.file.name}</p>
            <p>• <strong>Judul:</strong> {title}</p>
            <p>• <strong>Deteksi AI:</strong> {aiDetectionResult.isAI ? 'Terdeteksi AI' : 'Original'} ({((aiDetectionResult.confidence || 0) * 100).toFixed(1)}%)</p>
            <p>• <strong>Lisensi:</strong> {selectedLicense.pilType}</p>
            <p>• <strong>Komersial:</strong> {selectedLicense.commercialUse ? 'Ya' : 'Tidak'}</p>
          </div>
        </div>
      )}
    </div>
  );
}
