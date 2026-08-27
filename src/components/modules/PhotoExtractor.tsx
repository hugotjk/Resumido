import React, { useState, useRef } from 'react';
import { 
  Image as ImageIcon, 
  UploadCloud, 
  Download, 
  Sparkles, 
  CheckCircle2, 
  Trash2, 
  Barcode, 
  ArrowRight,
  Settings,
  FileArchive,
  Layers
} from 'lucide-react';
import JSZip from 'jszip';
import { PdvProduct, PhotoMappingItem } from '../../types';

interface PhotoExtractorProps {
  pdvProducts: PdvProduct[];
}

export const PhotoExtractor: React.FC<PhotoExtractorProps> = ({
  pdvProducts
}) => {
  const [photos, setPhotos] = useState<PhotoMappingItem[]>([]);
  const [namingPattern, setNamingPattern] = useState<'CODIGO' | 'EAN' | 'REFERENCIA'>('CODIGO');
  const [isZipping, setIsZipping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processUploadedFiles = (files: FileList | File[]) => {
    const newItems: PhotoMappingItem[] = [];

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;

      const previewUrl = URL.createObjectURL(file);
      const cleanFileName = file.name.replace(/\.[^/.]+$/, ""); // strip extension
      const ext = file.name.split('.').pop() || 'jpg';

      // Attempt matching with PDV products by ref, code or ean
      let matched: PdvProduct | undefined;
      const lowerName = cleanFileName.toLowerCase();

      matched = pdvProducts.find(p => 
        lowerName.includes(p.codigo.toLowerCase()) ||
        (p.referencia && lowerName.includes(p.referencia.toLowerCase())) ||
        (p.ean && lowerName.includes(p.ean)) ||
        lowerName.includes(p.descricao.toLowerCase().slice(0, 10))
      );

      let suggestedName = file.name;
      if (matched) {
        if (namingPattern === 'CODIGO') {
          suggestedName = `${matched.codigo}.${ext}`;
        } else if (namingPattern === 'EAN' && matched.ean) {
          suggestedName = `${matched.ean}.${ext}`;
        } else if (namingPattern === 'REFERENCIA' && matched.referencia) {
          suggestedName = `${matched.referencia}.${ext}`;
        } else {
          suggestedName = `${matched.codigo}.${ext}`;
        }
      }

      newItems.push({
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        previewUrl,
        status: matched ? 'MAPEADO' : 'NAO_MAPEADO',
        produtoPdvCorrespondente: matched,
        novoNomeArquivoSugerido: suggestedName
      });
    });

    setPhotos(prev => [...prev, ...newItems]);
  };

  const handleLoadSamples = () => {
    // Generate 3 visual SVG mock items for instant test
    const sampleItems: PhotoMappingItem[] = [
      {
        id: 'sample-1',
        fileName: 'CAM-POLO-AZ_catalogo_2026.jpg',
        fileSize: 450000,
        fileType: 'image/jpeg',
        previewUrl: 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=300&auto=format&fit=crop&q=80',
        status: 'MAPEADO',
        produtoPdvCorrespondente: pdvProducts.find(p => p.codigo === 'PRD00101'),
        novoNomeArquivoSugerido: namingPattern === 'EAN' ? '7891234560011.jpg' : 'PRD00101.jpg'
      },
      {
        id: 'sample-2',
        fileName: 'CAL-JEANS-SK_foto_modelo.jpg',
        fileSize: 520000,
        fileType: 'image/jpeg',
        previewUrl: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=300&auto=format&fit=crop&q=80',
        status: 'MAPEADO',
        produtoPdvCorrespondente: pdvProducts.find(p => p.codigo === 'PRD00102'),
        novoNomeArquivoSugerido: namingPattern === 'EAN' ? '7891234560028.jpg' : 'PRD00102.jpg'
      },
      {
        id: 'sample-3',
        fileName: 'TEN-CAS-BR_calcado.jpg',
        fileSize: 380000,
        fileType: 'image/jpeg',
        previewUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300&auto=format&fit=crop&q=80',
        status: 'MAPEADO',
        produtoPdvCorrespondente: pdvProducts.find(p => p.codigo === 'PRD00104'),
        novoNomeArquivoSugerido: 'PRD00104.jpg'
      }
    ];

    setPhotos(sampleItems);
  };

  const handleDownloadZip = async () => {
    if (photos.length === 0) return;
    setIsZipping(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder("fotos_sistema_pdv");

      for (const item of photos) {
        const finalName = item.novoNomeArquivoSugerido || item.fileName;
        try {
          const resp = await fetch(item.previewUrl);
          const blob = await resp.blob();
          folder?.file(finalName, blob);
        } catch {
          // fallback plain text stub if CORS on external image
          folder?.file(finalName, `Mock binary image data for ${finalName}`);
        }
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `pacote_fotos_pdv_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setIsZipping(false);
    }
  };

  const removePhoto = (id: string) => {
    setPhotos(photos.filter(p => p.id !== id));
  };

  return (
    <div className="space-y-4">
      
      {/* Header */}
      <div className="bg-[#F0EFED] p-3.5 sm:p-4 rounded-sm border border-[#141414] flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-sm sm:text-base font-bold uppercase tracking-tight text-[#141414]">
              Extrator & Padronizador de Fotos para Sistema PDV
            </h2>
            <span className="text-[10px] font-mono font-bold bg-[#141414] text-[#E4E3E0] px-1.5 py-0.5 rounded-xs uppercase">
              Mapeador de Catálogo
            </span>
          </div>
          <p className="text-[11px] font-mono text-[#141414]/70 mt-0.5">
            Recebe fotos brutas de fornecedores ou catálogos, correlaciona com o cadastro de produtos e exporta pacote .ZIP renomeado no padrão do PDV.
          </p>
        </div>

        {/* Naming Pattern Selector */}
        <div className="flex items-center space-x-2 bg-[#E4E3E0] p-1.5 rounded-sm border border-[#141414] text-xs font-mono w-full md:w-auto">
          <span className="text-[#141414]/70 uppercase text-[10px] font-bold whitespace-nowrap">Padrão:</span>
          <select
            value={namingPattern}
            onChange={(e) => setNamingPattern(e.target.value as any)}
            className="bg-[#F0EFED] border border-[#141414] rounded-sm px-2 py-0.5 font-mono text-xs font-bold text-[#141414] focus:outline-none uppercase"
          >
            <option value="CODIGO">Código (Ex: PRD00101.jpg)</option>
            <option value="EAN">EAN (Ex: 7891234560011.jpg)</option>
            <option value="REFERENCIA">Referência (Ex: REF123.jpg)</option>
          </select>
        </div>
      </div>

      {/* Upload Dropzone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-[#141414]/40 hover:border-[#141414] rounded-sm p-5 text-center cursor-pointer bg-[#F0EFED] transition"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => e.target.files && processUploadedFiles(e.target.files)}
          className="hidden"
        />
        <div className="w-10 h-10 mx-auto rounded-sm bg-[#E4E3E0] border border-[#141414] flex items-center justify-center text-[#141414] mb-2">
          <UploadCloud className="w-5 h-5" />
        </div>
        <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#141414]">
          Arraste fotos dos produtos ou catálogos aqui, ou <span className="underline">clique para carregar</span>
        </p>
        <p className="text-[10px] font-mono text-[#141414]/70 mt-1">
          Suporta JPG, PNG, WEBP. Reconhece automaticamente a referência ou EAN presente no nome original.
        </p>

        {photos.length === 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleLoadSamples();
            }}
            className="mt-3 text-xs font-mono font-bold uppercase bg-[#E4E3E0] text-[#141414] px-3 py-1 rounded-sm border border-[#141414] hover:bg-[#d8d6d2] transition inline-flex items-center space-x-1"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#141414]" />
            <span>Carregar Fotos Exemplo para Teste</span>
          </button>
        )}
      </div>

      {/* Photos Grid & Batch Download */}
      {photos.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between font-mono">
            <span className="text-xs font-bold text-[#141414] uppercase tracking-wider">
              Fotos Carregadas ({photos.length})
            </span>
            <button
              onClick={handleDownloadZip}
              disabled={isZipping}
              className="px-3 py-1.5 bg-[#141414] hover:bg-[#2a2a2a] text-[#E4E3E0] rounded-sm text-xs font-mono font-bold uppercase tracking-wider transition flex items-center space-x-1.5 disabled:opacity-50 border border-[#141414]"
            >
              <FileArchive className="w-3.5 h-3.5" />
              <span>{isZipping ? 'Compactando...' : 'Baixar Todas em .ZIP'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {photos.map(photo => (
              <div 
                key={photo.id}
                className="bg-[#F0EFED] rounded-sm border border-[#141414] p-3 space-y-2.5 relative group font-mono"
              >
                <div className="w-full h-36 rounded-sm overflow-hidden bg-[#E4E3E0] border border-[#141414]/30 relative">
                  <img 
                    src={photo.previewUrl} 
                    alt={photo.fileName} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <button
                    onClick={() => removePhoto(photo.id)}
                    className="absolute top-1.5 right-1.5 p-1 rounded-sm bg-[#141414] hover:bg-[#333] text-[#E4E3E0] transition border border-[#141414]"
                    title="Remover foto"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="text-[#141414]/70 truncate text-[10px]">
                    Original: <span className="font-bold text-[#141414]">{photo.fileName}</span>
                  </div>

                  {photo.produtoPdvCorrespondente ? (
                    <div className="p-2 bg-[#E4E3E0] rounded-sm border border-[#141414] space-y-0.5">
                      <div className="flex items-center space-x-1 text-[#141414] font-bold text-[11px] uppercase">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Mapeado com Sucesso!</span>
                      </div>
                      <div className="text-[#141414] truncate font-sans text-xs font-bold">
                        {photo.produtoPdvCorrespondente.descricao}
                      </div>
                      <div className="text-[#141414]/70 text-[10px]">
                        Novo nome: <span className="font-bold text-[#141414]">{photo.novoNomeArquivoSugerido}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2 bg-[#E4E3E0] rounded-sm border border-[#141414] text-[#141414] text-[10px]">
                      Nenhum produto correspondente identificado automaticamente.
                    </div>
                  )}
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
