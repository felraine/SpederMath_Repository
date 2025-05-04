import { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

function QRCodeScanner({ onLogin }) {
  const scannerRef = useRef(null);

  useEffect(() => {
    const qrRegionId = "qr-reader";
    const html5QrCode = new Html5Qrcode(qrRegionId);

    Html5Qrcode.getCameras().then((devices) => {
      if (devices && devices.length) {
        const cameraId = devices[0].id;

        html5QrCode
          .start(
            cameraId,
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
            },
            (decodedText) => {
              try {
                const { username, password } = JSON.parse(decodedText);
                html5QrCode.stop(); // stop scanning after successful read
                onLogin(username, password);
              } catch (err) {
                alert("Invalid QR data format.");
              }
            },
            (errorMessage) => {
              // Optional: console.log('QR scan error', errorMessage);
            }
          )
          .catch((err) => {
            console.error("Camera start failed:", err);
          });
      }
    });

    return () => {
      html5QrCode.stop().catch(() => {});
    };
  }, [onLogin]);

  return (
    <div className="mt-5 text-center">
      <h3 className="text-lg font-bold mb-2">Scan QR Code</h3>
      <div id="qr-reader" ref={scannerRef} style={{ width: "300px", margin: "auto" }}></div>
    </div>
  );
}

export default QRCodeScanner;