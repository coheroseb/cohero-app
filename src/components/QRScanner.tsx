'use client';

import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface QRScannerProps {
    onScanSuccess: (decodedText: string) => void;
    onScanFailure?: (error: any) => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScanSuccess, onScanFailure }) => {
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    useEffect(() => {
        // Initialize the scanner
        if (!scannerRef.current) {
            scannerRef.current = new Html5QrcodeScanner(
                "qr-reader",
                { 
                    fps: 10, 
                    qrbox: { width: 250, height: 250, },
                    aspectRatio: 1.0,
                    showTorchButtonIfSupported: true,
                },
                /* verbose= */ false
            );
            
            scannerRef.current.render(onScanSuccess, onScanFailure || (() => {}));
        }

        // Cleanup
        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(error => {
                    console.error("Failed to clear html5QrcodeScanner. ", error);
                });
                scannerRef.current = null;
            }
        };
    }, []);

    return (
        <div className="w-full max-w-sm mx-auto overflow-hidden rounded-3xl border-2 border-slate-100 shadow-inner bg-slate-50">
            <div id="qr-reader" className="w-full" />
            <style jsx global>{`
                #qr-reader {
                    border: none !important;
                }
                #qr-reader__dashboard {
                    padding: 20px !important;
                    background: transparent !important;
                }
                #qr-reader__status_span {
                    display: none !important;
                }
                #qr-reader__scan_region {
                    background: #f8fafc !important;
                }
                #qr-reader__camera_selection {
                    width: 100% !important;
                    padding: 10px !important;
                    border-radius: 12px !important;
                    border: 1px solid #e2e8f0 !important;
                    margin-bottom: 10px !important;
                }
                #qr-reader__camera_permission_button {
                    background: #0f172a !important;
                    color: white !important;
                    padding: 12px 24px !important;
                    border-radius: 12px !important;
                    font-weight: 700 !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.1em !important;
                    font-size: 12px !important;
                    border: none !important;
                    cursor: pointer !important;
                }
            `}</style>
        </div>
    );
};

export default QRScanner;
