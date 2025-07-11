"use client";

import { useState, useRef } from "react";
import { Upload, FileText, Loader2 } from "lucide-react";
import Tesseract from "tesseract.js";

export default function Home() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    setIsProcessing(true);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Image = e.target?.result as string;
        
        const result = await Tesseract.recognize(file, "eng", {
          logger: (m) => console.log(m),
        });

        const text = result.data.text;
        console.log(text);

        sessionStorage.setItem('extractedText', text);
        sessionStorage.setItem('imageUrl', base64Image);

        window.location.href = `/chat`;
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("OCR Error:", error);
      alert("Error processing image. Please try again.");
      setIsProcessing(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const openCameraDialog = () => {
    cameraInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Medic AI</h1>
          <p className="text-slate-300">
            Upload your medical report for AI-powered analysis
          </p>
        </div>

        <div
          className={`relative w-80 h-80 mx-auto rounded-full border-4 border-dashed transition-all duration-300 ${
            dragActive
              ? "border-blue-400 bg-blue-900/20"
              : "border-slate-400 hover:border-blue-400 hover:bg-slate-800/20"
          } ${isProcessing ? "pointer-events-none" : ""}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileInput}
            className="hidden"
          />

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
            {isProcessing ? (
              <>
                <Loader2 className="w-12 h-12 text-blue-400 animate-spin mb-4" />
                <p className="text-white font-medium">Processing...</p>
                <p className="text-slate-400 text-sm mt-2">
                  Extracting text from your medical report
                </p>
              </>
            ) : (
              <>
                <Upload className="w-12 h-12 text-slate-400 mb-4" />
                <p className="text-white font-medium mb-2">
                  Upload Medical Report
                </p>
                <p className="text-slate-400 text-sm mb-6">
                  Choose your preferred method
                </p>
                <div className="flex flex-col items-center justify-center space-y-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openCameraDialog();
                    }}
                    className="flex items-center space-x-3 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.44A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.44A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="font-medium">Take Photo</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openFileDialog();
                    }}
                    className="flex items-center space-x-3 px-6 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <FileText className="w-5 h-5" />
                    <span className="font-medium">Choose File</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>



        <div className="text-center mt-8">
          <p className="text-slate-400 text-sm">
            Supported formats: JPG, PNG, PDF
          </p>
        </div>

        <div className="mt-12 text-center">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-lg bg-slate-800/50">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-white text-sm font-bold">1</span>
              </div>
              <p className="text-white text-sm font-medium">Upload</p>
              <p className="text-slate-400 text-xs">Medical report image</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-800/50">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-white text-sm font-bold">2</span>
              </div>
              <p className="text-white text-sm font-medium">Process</p>
              <p className="text-slate-400 text-xs">OCR extraction</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-800/50">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-white text-sm font-bold">3</span>
              </div>
              <p className="text-white text-sm font-medium">Chat</p>
              <p className="text-slate-400 text-xs">AI analysis</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
