"use client";

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { uploadImage } from '@/services/uploadService';
import { buildImageURL } from '@/utils/imageUtils';

interface ImageUploadProps {
  onImageUploaded: (imageUrl: string) => void;
  currentImage?: string;
  disabled?: boolean;
}

export default function ImageUpload({ onImageUploaded, currentImage, disabled = false }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string>(currentImage ? buildImageURL(currentImage) : '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Tipo de arquivo não suportado. Use: JPG, PNG, GIF ou WebP');
      return;
    }

    // Validar tamanho (15MB)
    const maxSize = 15 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('Arquivo muito grande. Máximo 15MB permitido.');
      return;
    }

    // Criar preview local
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload do arquivo
    try {
      setUploading(true);
      const result = await uploadImage(file);
      onImageUploaded(result.url);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Erro no upload:', error);
      }
      alert('Erro ao fazer upload da imagem. Tente novamente.');
      setPreview(currentImage ? buildImageURL(currentImage) : '');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setPreview('');
    onImageUploaded('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {/* Input de arquivo */}
        <div style={{ flex: 1 }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
            onChange={handleFileSelect}
            disabled={disabled || uploading}
            style={{
              padding: 8,
              border: '1px solid #cbead6',
              borderRadius: 8,
              width: '100%',
              fontSize: '0.9rem'
            }}
          />
          <div style={{ 
            fontSize: '0.8rem', 
            color: '#666', 
            marginTop: 4 
          }}>
            Formatos: JPG, PNG, GIF, WebP (máx. 5MB)
          </div>
        </div>

        {/* Botão remover (se há preview) */}
        {preview && (
          <button
            type="button"
            onClick={handleRemoveImage}
            disabled={disabled || uploading}
            style={{
              background: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              padding: '8px 12px',
              fontSize: '0.8rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Remover
          </button>
        )}
      </div>

      {/* Preview da imagem */}
      {preview && (
        <div style={{
          border: '2px dashed #cbead6',
          borderRadius: 8,
          padding: 16,
          textAlign: 'center',
          background: '#f8f9fa'
        }}>
          <Image
            src={preview}
            alt="Preview"
            width={300}
            height={200}
            style={{
              maxWidth: '300px',
              maxHeight: '200px',
              objectFit: 'contain',
              borderRadius: 8,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
            onError={(e) => {
              if (process.env.NODE_ENV === 'development') {
                console.warn('Preview da imagem não pôde ser carregado:', preview);
              }
            }}
          />
        </div>
      )}

      {/* Indicador de upload */}
      {uploading && (
        <div style={{
          padding: 12,
          background: '#e3f2fd',
          border: '1px solid #1976d2',
          borderRadius: 8,
          color: '#1976d2',
          textAlign: 'center',
          fontSize: '0.9rem'
        }}>
          📤 Fazendo upload da imagem...
        </div>
      )}
    </div>
  );
}
