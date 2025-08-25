"use client";

import { useState } from "react";
import { useSimpleRegisterIP, type LicensePreset } from "@/hooks/useSimpleRegisterIP";
import { SimpleLicenseSelector } from "./SimpleLicenseSelector";
import { Upload, Check, X, Loader2 } from "lucide-react";

export function SimpleIPRegister() {
  const { state, register, reset, LICENSE_PRESETS } = useSimpleRegisterIP();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [license, setLicense] = useState<LicensePreset>("remix");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleRegister = async () => {
    if (!file || !title) return;
    
    await register(file, title, description, license);
  };

  const handleReset = () => {
    reset();
    setFile(null);
    setTitle("");
    setDescription("");
    setLicense("remix");
  };

  if (state.status === 'success') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center space-y-4">
          <div className="text-6xl">🎉</div>
          <h2 className="text-2xl font-bold text-white">IP Registered Successfully!</h2>
          
          {state.result && (
            <div className="bg-white/5 rounded-2xl p-4 space-y-2 text-left">
              <div className="text-sm text-white/60">IP ID:</div>
              <div className="font-mono text-xs break-all text-sky-400">{state.result.ipId}</div>
              
              <div className="text-sm text-white/60 mt-4">Transaction:</div>
              <div className="font-mono text-xs break-all text-green-400">{state.result.txHash}</div>
              
              {state.result.aiDetected && (
                <div className="text-sm text-yellow-400 mt-4">
                  🤖 AI-generated content detected
                </div>
              )}
            </div>
          )}
          
          <button
            onClick={handleReset}
            className="mt-6 px-6 py-3 bg-sky-500 hover:bg-sky-400 text-white rounded-2xl transition-colors"
          >
            Register Another IP
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Register Your IP</h1>
        <p className="text-white/60">Simple, fast, and secure IP registration</p>
      </div>

      {state.status === 'processing' ? (
        <div className="bg-white/5 rounded-2xl p-6 text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-sky-400 mx-auto" />
          <div className="text-white font-medium">{state.step}</div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div 
              className="bg-sky-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${state.progress}%` }}
            />
          </div>
          <div className="text-sm text-white/60">{state.progress}% complete</div>
        </div>
      ) : (
        <>
          {/* File Upload */}
          <div className="space-y-4">
            <label className="block">
              <div className="text-sm font-medium text-white/80 mb-2">Upload File</div>
              <div className={`
                border-2 border-dashed rounded-2xl p-8 text-center transition-colors cursor-pointer
                ${file 
                  ? 'border-green-400 bg-green-400/10' 
                  : 'border-white/20 hover:border-white/40 bg-white/5'
                }
              `}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {file ? (
                  <div className="flex items-center justify-center gap-2 text-green-400">
                    <Check className="h-5 w-5" />
                    <span>{file.name}</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 text-white/40 mx-auto" />
                    <div className="text-white/60">Click to upload your image</div>
                  </div>
                )}
              </div>
            </label>
          </div>

          {/* Title and Description */}
          <div className="space-y-4">
            <label className="block">
              <div className="text-sm font-medium text-white/80 mb-2">Title</div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your IP a name..."
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/40 focus:outline-none focus:border-sky-400"
              />
            </label>

            <label className="block">
              <div className="text-sm font-medium text-white/80 mb-2">Description (optional)</div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your IP..."
                rows={3}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/40 focus:outline-none focus:border-sky-400 resize-none"
              />
            </label>
          </div>

          {/* License Selector */}
          <SimpleLicenseSelector
            selected={license}
            onChange={setLicense}
          />

          {/* Submit Button */}
          <div className="pt-4">
            <button
              onClick={handleRegister}
              disabled={!file || !title || state.status !== 'idle'}
              className="w-full py-4 bg-sky-500 hover:bg-sky-400 disabled:bg-white/10 disabled:text-white/40 text-white font-medium rounded-2xl transition-colors disabled:cursor-not-allowed"
            >
              Register IP Now
            </button>
            
            <div className="text-center text-sm text-white/40 mt-3">
              All technical steps handled automatically
            </div>
          </div>
        </>
      )}

      {state.error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-red-400">
            <X className="h-5 w-5" />
            <span className="font-medium">Registration Failed</span>
          </div>
          <div className="text-sm text-white/60 mt-2">{state.error}</div>
          <button
            onClick={handleReset}
            className="mt-3 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl text-sm transition-colors"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
