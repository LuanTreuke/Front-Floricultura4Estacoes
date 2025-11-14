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
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Tipo de arquivo não suportado. Use: JPG, PNG, GIF ou WebP');
      // Limpar o input para permitir nova seleção
      e.target.value = '';
      return;
    }

    // Validar tamanho (15MB)
    const maxSize = 15 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('Arquivo muito grande. Máximo 15MB permitido.');
      // Limpar o input para permitir nova seleção
      e.target.value = '';
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
      // Limpar ambos os inputs após o upload (sucesso ou erro)
      // para permitir nova seleção do mesmo arquivo
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      if (cameraInputRef.current) {
        cameraInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = () => {
    setPreview('');
    onImageUploaded('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  };

  const handleCameraClick = () => {
    // Limpar o input antes de abrir para garantir que onChange sempre dispare
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
      cameraInputRef.current.click();
    }
  };

  const handleFileClick = () => {
    // Limpar o input antes de abrir para garantir que onChange sempre dispare
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Inputs ocultos */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        disabled={disabled || uploading}
        style={{ display: 'none' }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        disabled={disabled || uploading}
        style={{ display: 'none' }}
      />

      {/* Botões visuais */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={handleCameraClick}
          disabled={disabled || uploading}
          style={{
            background: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            padding: '12px 16px',
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flex: '1',
            minWidth: '140px'
          }}
        >
          <i className="bi bi-camera" style={{ verticalAlign: 'middle', fontSize: 22, marginRight: 0 }}></i> Tirar Foto 
        </button>
        
        <button
          type="button"
          onClick={handleFileClick}
          disabled={disabled || uploading}
          style={{
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            padding: '12px 16px',
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flex: '1',
            minWidth: '140px'
          }}
        >
          Escolher Arquivo
        </button>

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
              borderRadius: 8,
              padding: '12px 16px',
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            Remover
          </button>
        )}
      </div>

      <div style={{ 
        fontSize: '0.8rem', 
        color: '#666', 
        textAlign: 'center'
      }}>
        Formatos: JPG, PNG, GIF, WebP (máx. 15MB)
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
          Fazendo upload da imagem...
        </div>
      )}
    </div>
  );
}
