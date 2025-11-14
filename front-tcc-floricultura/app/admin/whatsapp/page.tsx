"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export default function AdminWhatsappPage() {
  const [qrText, setQrText] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQr = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/whatsapp/qr`);
        if (!res.ok) {
          throw new Error(`Erro ao buscar QR: ${res.status}`);
        }
        const data = await res.json();
        if (!data.qr) {
          setQrText(null);
          setQrDataUrl(null);
          setError("Nenhum QR disponível no momento. Tente reiniciar o backend ou aguarde alguns segundos.");
          return;
        }
        setQrText(data.qr as string);

        const url = await QRCode.toDataURL(data.qr as string);
        setQrDataUrl(url);
      } catch (e: any) {
        setError(e?.message || "Erro ao buscar o QR do WhatsApp");
      } finally {
        setLoading(false);
      }
    };

    fetchQr();
  }, []);

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px" }}>
      <h1 style={{ fontSize: "1.75rem", marginBottom: "16px" }}>Conectar WhatsApp</h1>
      <p style={{ marginBottom: "16px" }}>
        Use esta página para conectar o bot de WhatsApp. Abra o WhatsApp no celular &gt; Aparelhos conectados &gt; Conectar um aparelho e escaneie o QR abaixo.
      </p>

      {loading && <p>Carregando QR...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !error && qrDataUrl && (
        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <img
            src={qrDataUrl}
            alt="QR Code do WhatsApp"
            style={{ width: 280, height: 280, objectFit: "contain", borderRadius: 8, border: "1px solid #ddd" }}
          />
          <p style={{ marginTop: "12px" }}>Escaneie este QR com o aplicativo do WhatsApp no seu celular.</p>
        </div>
      )}

      {!loading && !error && !qrDataUrl && (
        <p>Nenhum QR disponível no momento.</p>
      )}
    </div>
  );
}
