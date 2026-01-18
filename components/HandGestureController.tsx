"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  HandLandmarker,
  FilesetResolver,
  DrawingUtils,
} from "@mediapipe/tasks-vision";
import { HandFrame } from "@/types";
import type { Landmark } from "@/types";
import { MEDIAPIPE_CONFIG, VIDEO_CONFIG, DRAWING_STYLES } from "@/constants";
import { processLandmarks } from "@/lib/mediapipe";
import { useAudioFeedback } from "@/hooks";

interface HandGestureControllerProps {
  onHandFrame: (frame: HandFrame) => void;
}

const NEUTRAL_FRAME: HandFrame = {
  x: 0.5,
  y: 0.5,
  roll: 0,
  pinch: false,
  fist: false,
  peace: false,
};

const HAND_LOST_TIMEOUT_MS = 150;

function formatDebugInfo(frame: HandFrame, isHandPresent: boolean): string {
  if (!isHandPresent) return 'Show your hand';

  const gestures: string[] = [];
  if (frame.pinch) gestures.push('Grab');
  if (frame.fist) gestures.push(frame.y < 0.5 ? 'Day' : 'Night');
  if (frame.peace) gestures.push('Rake');
  if (!frame.fist && Math.abs(frame.roll) > 0.1) {
    gestures.push(frame.roll > 0 ? 'Tilt →' : 'Tilt ←');
  }

  return gestures.length > 0 ? gestures.join(' · ') : 'Rotate';
}

export default function HandGestureController({ onHandFrame }: HandGestureControllerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [debugInfo, setDebugInfo] = useState('Show your hand');
  const requestRef = useRef<number>(0);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const lastHandSeenRef = useRef<number>(0);
  const handPresentRef = useRef<boolean>(false);

  const prevPinchRef = useRef<boolean>(false);
  const prevFistRef = useRef<boolean>(false);
  const prevPeaceRef = useRef<boolean>(false);

  const { playGrab, playRelease, playMagic, playWind, preloadSounds, initAudio } = useAudioFeedback();

  useEffect(() => {
    let handLandmarker: HandLandmarker | null = null;
    let videoStream: MediaStream | null = null;

    const init = async () => {
      const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_CONFIG.VISION_TASKS_CDN);
      handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: MEDIAPIPE_CONFIG.MODEL_URL,
          delegate: MEDIAPIPE_CONFIG.DELEGATE,
        },
        runningMode: MEDIAPIPE_CONFIG.RUNNING_MODE,
        numHands: MEDIAPIPE_CONFIG.NUM_HANDS,
      });
      handLandmarkerRef.current = handLandmarker;
      setIsLoaded(true);

      if (navigator.mediaDevices?.getUserMedia) {
        try {
          videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) {
            videoRef.current.srcObject = videoStream;
            videoRef.current.addEventListener("loadeddata", predictWebcam);
          }
        } catch (error) {
          console.error("Error accessing webcam:", error);
        }
      }

      preloadSounds();
      document.addEventListener('click', initAudio, { once: true });
    };

    init();

    return () => {
      handLandmarker?.close();
      cancelAnimationFrame(requestRef.current);
      videoStream?.getTracks().forEach(track => track.stop());
      document.removeEventListener('click', initAudio);
    };
  }, [preloadSounds, initAudio]);

  const predictWebcam = () => {
    if (!handLandmarkerRef.current || !videoRef.current || !canvasRef.current) return;

    const startTimeMs = performance.now();
    const results = handLandmarkerRef.current.detectForVideo(videoRef.current, startTimeMs);

    const canvasCtx = canvasRef.current.getContext("2d");
    if (canvasCtx) {
      canvasCtx.font = VIDEO_CONFIG.FONT;
      canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

      const drawingUtils = new DrawingUtils(canvasCtx);

      if (results.landmarks && results.landmarks.length > 0) {
        const rawLandmarks = results.landmarks[0];
        lastHandSeenRef.current = startTimeMs;
        handPresentRef.current = true;

        drawingUtils.drawConnectors(rawLandmarks, HandLandmarker.HAND_CONNECTIONS, {
          color: DRAWING_STYLES.CONNECTOR_COLOR,
          lineWidth: DRAWING_STYLES.CONNECTOR_WIDTH,
        });
        drawingUtils.drawLandmarks(rawLandmarks, {
          color: DRAWING_STYLES.LANDMARK_COLOR,
          lineWidth: DRAWING_STYLES.LANDMARK_WIDTH,
        });

        const frame = processLandmarks(rawLandmarks as Landmark[]);

        if (frame.pinch && !prevPinchRef.current) playGrab();
        else if (!frame.pinch && prevPinchRef.current) playRelease();
        if (frame.fist && !prevFistRef.current) playMagic();
        if (frame.peace && !prevPeaceRef.current) playWind();

        prevPinchRef.current = frame.pinch;
        prevFistRef.current = frame.fist;
        prevPeaceRef.current = frame.peace;

        onHandFrame(frame);
        setDebugInfo(formatDebugInfo(frame, true));
      } else {
        const timeSinceHandSeen = startTimeMs - lastHandSeenRef.current;
        if (handPresentRef.current && timeSinceHandSeen > HAND_LOST_TIMEOUT_MS) {
          handPresentRef.current = false;
          prevPinchRef.current = false;
          prevFistRef.current = false;
          prevPeaceRef.current = false;
          onHandFrame(NEUTRAL_FRAME);
          setDebugInfo(formatDebugInfo(NEUTRAL_FRAME, false));
        }
      }
    }

    requestRef.current = requestAnimationFrame(predictWebcam);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">
      <div className="px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-lg text-white/90 text-xs font-medium">
        {debugInfo}
      </div>
      <div className="w-64 h-48 bg-black/20 backdrop-blur-md rounded-xl overflow-hidden border border-white/20 shadow-2xl">
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center text-white text-xs">
            Loading AI...
          </div>
        )}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover opacity-50 -scale-x-100"
          autoPlay
          playsInline
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover -scale-x-100"
          width={VIDEO_CONFIG.CANVAS_WIDTH}
          height={VIDEO_CONFIG.CANVAS_HEIGHT}
        />
      </div>
    </div>
  );
}
