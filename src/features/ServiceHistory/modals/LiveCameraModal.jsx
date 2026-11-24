import React, { useState, useEffect, useRef } from 'react';
import { compressImage } from '../../../utils/imageCompressor';

export default function LiveCameraModal({
  isOpen,
  onClose,
  onCapture,
  checkPoints = [],
  initialCheckpointIndex = null,
  showToast
}) {
  const [stream, setStream] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' (back) or 'user' (front)
  const [capturedDataUrl, setCapturedDataUrl] = useState(null);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState(
    initialCheckpointIndex !== null ? String(initialCheckpointIndex) : 'general'
  );
  const [caption, setCaption] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fallbackInputRef = useRef(null);

  // Stop camera stream tracks
  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {
          console.error('Error stopping track:', e);
        }
      });
      streamRef.current = null;
    }
    setStream(null);
  };

  // Start camera stream
  const startCamera = async (mode = 'environment') => {
    stopStream();
    setCameraError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Webcam / Live camera is not supported on this browser. You can use the device camera button below.');
      return;
    }

    try {
      const constraints = {
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = mediaStream;
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.warn('Could not open camera with facingMode:', mode, err);
      // Fallback: try basic video without facingMode constraint
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        streamRef.current = fallbackStream;
        setStream(fallbackStream);
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
        }
      } catch (fallbackErr) {
        console.error('Failed to access camera:', fallbackErr);
        if (fallbackErr.name === 'NotAllowedError') {
          setCameraError('Camera access was denied. Please allow camera permissions in your browser or use the file picker button below.');
        } else {
          setCameraError('Unable to open live camera on this device. You can capture or upload using your device camera directly.');
        }
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      setCapturedDataUrl(null);
      setCaption('');
      setSelectedCheckpoint(initialCheckpointIndex !== null ? String(initialCheckpointIndex) : 'general');
      startCamera(facingMode);
    } else {
      stopStream();
    }

    return () => {
      stopStream();
    };
  }, [isOpen, facingMode]);

  // Ensure video element receives stream when ready
  useEffect(() => {
    if (videoRef.current && stream && !capturedDataUrl) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, capturedDataUrl]);

  if (!isOpen) return null;

  // Toggle front/back camera
  const handleToggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
  };

  // Snap photo from live video feed
  const handleSnap = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const rawDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    try {
      setIsProcessing(true);
      const compressed = await compressImage(rawDataUrl, 1024, 1024, 0.78);
      setCapturedDataUrl(compressed);
    } catch (e) {
      setCapturedDataUrl(rawDataUrl);
    } finally {
      setIsProcessing(false);
    }
  };

  // Retake photo
  const handleRetake = () => {
    setCapturedDataUrl(null);
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    } else {
      startCamera(facingMode);
    }
  };

  // Confirm and add photo
  const handleConfirmPhoto = () => {
    if (!capturedDataUrl) return;

    let checkpointName = 'General Tool Inspection';
    let cpIndex = null;

    if (selectedCheckpoint !== 'general') {
      const idx = parseInt(selectedCheckpoint, 10);
      cpIndex = idx;
      const cp = checkPoints[idx];
      const pointText = typeof cp === 'object' && cp !== null ? (cp.point || cp.description || '') : String(cp || '');
      checkpointName = `Check Point #${idx + 1}: ${pointText.slice(0, 40)}${pointText.length > 40 ? '...' : ''}`;
    }

    const photoObj = {
      id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      dataUrl: capturedDataUrl,
      timestamp: new Date().toLocaleString(),
      checkpointIndex: cpIndex,
      checkpointName: checkpointName,
      caption: caption.trim() || checkpointName
    };

    onCapture(photoObj);
    stopStream();
    onClose();
    showToast?.('Inspection photo added to checklist!', 'success');
  };

  // Native camera fallback (e.g. mobile native camera prompt)
  const handleFallbackFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      const compressed = await compressImage(file, 1024, 1024, 0.78);
      setCapturedDataUrl(compressed);
    } catch (err) {
      showToast?.('Failed to process photo', 'danger');
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
  };

  return (
    <div className="modal-backdrop show" style={{ zIndex: 1100, backgroundColor: 'rgba(0, 0, 0, 0.85)' }}>
      <div
        className="modal-card"
        style={{
          maxWidth: '680px',
          width: '94%',
          backgroundColor: '#0f172a',
          color: '#ffffff',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          border: '1px solid #334155'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #1e293b'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>📷</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: '15px', color: '#f8fafc' }}>
                {capturedDataUrl ? 'Preview & Tag Photo' : 'Inspection Camera'}
              </div>
              <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                Capture visual proof / defect condition for PM checklist
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              stopStream();
              onClose();
            }}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: '22px',
              cursor: 'pointer',
              lineHeight: 1
            }}
          >
            &times;
          </button>
        </div>

        {/* Viewfinder / Preview Area */}
        <div style={{
          position: 'relative',
          backgroundColor: '#020617',
          minHeight: '360px',
          maxHeight: '58vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}>
          {capturedDataUrl ? (
            <img
              src={capturedDataUrl}
              alt="Inspection Snapshot"
              style={{
                width: '100%',
                maxHeight: '56vh',
                objectFit: 'contain'
              }}
            />
          ) : cameraError ? (
            <div style={{ padding: '30px', textAlign: 'center', maxWidth: '440px' }}>
              <div style={{ fontSize: '38px', marginBottom: '10px' }}>⚠️</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#f87171', marginBottom: '8px' }}>
                Camera Unavailable
              </div>
              <p style={{ fontSize: '12.5px', color: '#94a3b8', lineHeight: 1.5, margin: '0 0 16px' }}>
                {cameraError}
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => fallbackInputRef.current?.click()}
                style={{
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '13px',
                  padding: '10px 18px',
                  borderRadius: '6px'
                }}
              >
                📱 Open Device Camera / Select File
              </button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  maxHeight: '56vh',
                  objectFit: 'contain'
                }}
              />
              {/* Subtle Camera Viewfinder Overlay Grid */}
              <div style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                right: '16px',
                bottom: '16px',
                border: '1.5px dashed rgba(255, 255, 255, 0.3)',
                borderRadius: '8px',
                pointerEvents: 'none'
              }} />

              {/* Switch Camera Button (Front / Rear) */}
              <button
                type="button"
                onClick={handleToggleFacingMode}
                style={{
                  position: 'absolute',
                  top: '14px',
                  right: '14px',
                  backgroundColor: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#ffffff',
                  borderRadius: '20px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backdropFilter: 'blur(4px)'
                }}
                title="Switch Front / Rear Camera"
              >
                <span>🔄</span>
                <span>{facingMode === 'environment' ? 'Rear Camera' : 'Front Camera'}</span>
              </button>
            </>
          )}

          {/* Hidden native camera capture input for fallback */}
          <input
            type="file"
            ref={fallbackInputRef}
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={handleFallbackFile}
          />
        </div>

        {/* Controls and Tagging Bar */}
        <div style={{ padding: '16px 20px', backgroundColor: '#0f172a', borderTop: '1px solid #1e293b' }}>
          {capturedDataUrl ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {/* Checkpoint Tag Selector */}
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>
                    Tag to Checkpoint
                  </label>
                  <select
                    className="form-select"
                    value={selectedCheckpoint}
                    onChange={(e) => setSelectedCheckpoint(e.target.value)}
                    style={{
                      width: '100%',
                      height: '36px',
                      backgroundColor: '#1e293b',
                      color: '#ffffff',
                      border: '1px solid #475569',
                      borderRadius: '6px',
                      fontSize: '12.5px',
                      padding: '4px 8px'
                    }}
                  >
                    <option value="general">General Tool Condition</option>
                    {checkPoints.map((cp, idx) => {
                      const text = typeof cp === 'object' && cp !== null ? (cp.point || cp.description || '') : String(cp || '');
                      return (
                        <option key={idx} value={String(idx)}>
                          #{idx + 1}: {text.slice(0, 45)}{text.length > 45 ? '...' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Caption / Note */}
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>
                    Observation Note (Optional)
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Scratches observed on wire guide"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    style={{
                      width: '100%',
                      height: '36px',
                      backgroundColor: '#1e293b',
                      color: '#ffffff',
                      border: '1px solid #475569',
                      borderRadius: '6px',
                      fontSize: '12.5px',
                      padding: '4px 10px'
                    }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                <button
                  type="button"
                  className="btn"
                  onClick={handleRetake}
                  style={{
                    backgroundColor: '#334155',
                    color: '#f8fafc',
                    fontWeight: 700,
                    fontSize: '13px',
                    padding: '8px 18px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    border: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>↺</span>
                  <span>Retake</span>
                </button>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleConfirmPhoto}
                  disabled={isProcessing}
                  style={{
                    backgroundColor: '#10b981',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '13.5px',
                    padding: '8px 24px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  <span>✓</span>
                  <span>Attach Photo to PM Checklist</span>
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              {/* Device camera fallback trigger */}
              <button
                type="button"
                onClick={() => fallbackInputRef.current?.click()}
                style={{
                  backgroundColor: '#1e293b',
                  color: '#94a3b8',
                  border: '1px solid #334155',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                title="Use device system camera or upload photo file"
              >
                <span>📁</span>
                <span>Device Camera / File</span>
              </button>

              {/* Big Snap Shutter Button */}
              {!cameraError && (
                <button
                  type="button"
                  onClick={handleSnap}
                  disabled={isProcessing || !stream}
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: '#ffffff',
                    border: '4px solid #3b82f6',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 20px rgba(59, 130, 246, 0.6)',
                    outline: 'none',
                    margin: '0 auto'
                  }}
                  title="Take Photo"
                >
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: '#ef4444'
                  }} />
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  stopStream();
                  onClose();
                }}
                style={{
                  backgroundColor: 'transparent',
                  color: '#94a3b8',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
