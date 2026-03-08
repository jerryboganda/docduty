/**
 * AvatarUpload — Profile picture upload/change/remove component
 * Supports drag & drop, file picker, preview, and validation
 */

import React, { useState, useRef, useCallback } from 'react';
import { Camera, Upload, Trash2, Loader2, X, Check } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import UserAvatar from './UserAvatar';

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  userName?: string;
  onAvatarChange?: (newUrl: string | null) => void;
  size?: 'md' | 'lg' | 'xl';
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export default function AvatarUpload({ currentAvatarUrl, userName, onAvatarChange, size = 'xl' }: AvatarUploadProps) {
  const { updateAvatarUrl } = useAuth();
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `Invalid file type: ${file.type}. Allowed: JPG, PNG, WebP`;
    }
    if (file.size > MAX_SIZE_BYTES) {
      return `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum: ${MAX_SIZE_MB}MB`;
    }
    return null;
  };

  const handleFileSelect = useCallback((file: File) => {
    setError(null);
    setSuccess(null);

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleUpload = async () => {
    if (!selectedFile) return;
    setError(null);
    setSuccess(null);
    setUploading(true);

    try {
      const result = await api.uploadFile<{ avatarUrl: string }>('/users/avatar', selectedFile, 'avatar');
      updateAvatarUrl(result.avatarUrl);
      onAvatarChange?.(result.avatarUrl);
      setSuccess('Avatar updated successfully!');
      setPreview(null);
      setSelectedFile(null);
    } catch (err: any) {
      setError(err.message || 'Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    setError(null);
    setSuccess(null);
    setRemoving(true);

    try {
      await api.delete('/users/avatar');
      updateAvatarUrl(null);
      onAvatarChange?.(null);
      setSuccess('Avatar removed');
      setPreview(null);
      setSelectedFile(null);
    } catch (err: any) {
      setError(err.message || 'Failed to remove avatar');
    } finally {
      setRemoving(false);
    }
  };

  const handleCancel = () => {
    setPreview(null);
    setSelectedFile(null);
    setError(null);
    setSuccess(null);
  };

  const displayUrl = preview || currentAvatarUrl;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Avatar Display / Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`relative group cursor-pointer rounded-full transition-all ${
          isDragOver ? 'ring-4 ring-emerald-400 ring-offset-2' : ''
        }`}
      >
        {displayUrl ? (
          <img
            src={displayUrl}
            alt={userName || 'Avatar'}
            className={`${size === 'xl' ? 'w-24 h-24' : size === 'lg' ? 'w-16 h-16' : 'w-10 h-10'} rounded-full object-cover border-2 border-slate-200`}
          />
        ) : (
          <UserAvatar name={userName} size={size} />
        )}

        {/* Hover Overlay */}
        <div className={`absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${
          uploading || removing ? 'opacity-100' : ''
        }`}>
          {uploading || removing ? (
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          ) : (
            <Camera className="w-6 h-6 text-white" />
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Action Buttons */}
      <div className="flex flex-col items-center gap-2 w-full max-w-xs">
        {selectedFile && preview ? (
          <div className="flex items-center gap-2 w-full">
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {uploading ? 'Uploading...' : 'Save'}
            </button>
            <button
              onClick={handleCancel}
              disabled={uploading}
              className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || removing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5" />
              {currentAvatarUrl ? 'Change Photo' : 'Upload Photo'}
            </button>
            {currentAvatarUrl && (
              <button
                onClick={handleRemove}
                disabled={uploading || removing}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                {removing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Remove
              </button>
            )}
          </div>
        )}

        {/* Feedback Messages */}
        {error && (
          <p className="text-xs text-red-600 text-center font-medium">{error}</p>
        )}
        {success && (
          <p className="text-xs text-emerald-600 text-center font-medium">{success}</p>
        )}
        <p className="text-[10px] text-slate-400 text-center">JPG, PNG, or WebP. Max {MAX_SIZE_MB}MB.</p>
      </div>
    </div>
  );
}
