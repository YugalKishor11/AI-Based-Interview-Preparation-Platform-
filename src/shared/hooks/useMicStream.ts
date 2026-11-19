import { useState, useEffect, useRef, useCallback } from 'react';

export type MicPermissionState = 'idle' | 'requesting' | 'granted' | 'denied' | 'no-device' | 'error';

interface UseMicStreamResult {
  stream: MediaStream | null;
  analyserNode: AnalyserNode | null;
  audioContext: AudioContext | null;
  permissionState: MicPermissionState;
  errorMessage: string | null;
  devices: MediaDeviceInfo[];
  selectedDeviceId: string;
  setSelectedDeviceId: (id: string) => void;
  requestPermission: () => Promise<void>;
  stop: () => void;
}

export function useMicStream(autoStart = false): UseMicStreamResult {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [permissionState, setPermissionState] = useState<MicPermissionState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('default');

  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // List audio input devices
  const updateDeviceList = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = allDevices.filter((d) => d.kind === 'audioinput');
      setDevices(audioInputs);
    } catch (e) {
      console.warn('Failed to enumerate audio devices', e);
    }
  }, []);

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setStream(null);
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
      setAudioContext(null);
      setAnalyserNode(null);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    stop();
    setPermissionState('requesting');
    setErrorMessage(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setPermissionState('no-device');
      setErrorMessage('Browser mediaDevices API not supported in this environment.');
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        audio: selectedDeviceId && selectedDeviceId !== 'default'
          ? { deviceId: { exact: selectedDeviceId } }
          : true,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = mediaStream;
      setStream(mediaStream);

      // Create WebAudio pipeline
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtxClass();
      audioCtxRef.current = ctx;
      setAudioContext(ctx);

      const source = ctx.createMediaStreamSource(mediaStream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.3;
      source.connect(analyser);
      setAnalyserNode(analyser);

      setPermissionState('granted');
      await updateDeviceList();

      // Listen for track ending (e.g. unplugged mic)
      mediaStream.getAudioTracks().forEach((track) => {
        track.onended = () => {
          setPermissionState('error');
          setErrorMessage('Microphone disconnected.');
        };
      });
    } catch (err: unknown) {
      const error = err as Error;
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setPermissionState('denied');
        setErrorMessage('Microphone access was denied. Please allow microphone permissions in your browser URL bar.');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        setPermissionState('no-device');
        setErrorMessage('No microphone device detected on this system.');
      } else {
        setPermissionState('error');
        setErrorMessage(error.message || 'Unable to access microphone.');
      }
    }
  }, [selectedDeviceId, stop, updateDeviceList]);

  useEffect(() => {
    if (autoStart) {
      requestPermission();
    }
    return () => {
      stop();
    };
  }, [autoStart, requestPermission, stop]);

  return {
    stream,
    analyserNode,
    audioContext,
    permissionState,
    errorMessage,
    devices,
    selectedDeviceId,
    setSelectedDeviceId,
    requestPermission,
    stop,
  };
}
