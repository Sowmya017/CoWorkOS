"use client"
import { useEffect, useRef } from "react"
import { Html5Qrcode } from "html5-qrcode"

interface Props {
  onScan: (token: string) => void
  onReady: () => void
}

export default function QrScanner({ onScan, onReady }: Props) {
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    const qr = new Html5Qrcode("qr-reader")

    qr.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 240, height: 240 } },
      (text) => onScan(text),
      () => {}
    )
      .then(() => onReady())
      .catch(() => {
        // Fallback: try any available camera
        qr.start(
          { facingMode: "user" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (text) => onScan(text),
          () => {}
        )
          .then(() => onReady())
          .catch(() => {})
      })

    return () => {
      qr.isScanning && qr.stop().catch(() => {})
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return <div id="qr-reader" className="w-full h-full" />
}
