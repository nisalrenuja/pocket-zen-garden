"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  HandLandmarker,
  FilesetResolver,
  DrawingUtils,
} from "@mediapipe/tasks-vision";

export type GestureAction = "ROTATE" | "WATER" | "TOGGLE_THEME" | "ZOOM" | "NONE";

interface HandGestureControllerProps {
  onGesture: (action: GestureAction, value?: number) => void;
}

export default function HandGestureController({ onGesture }: HandGestureControllerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const requestRef = useRef<number>(0);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);

  // Gesture State
  const lastYRef = useRef<number>(0);
  const isFistRef = useRef<boolean>(false);
  const fistTriggeredRef = useRef<boolean>(false);
  const pinchDistanceRef = useRef<number | null>(null);

  useEffect(() => {
    let handLandmarker: HandLandmarker;

    const createHandLandmarker = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
      );
      handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numHands: 1,
      });
      handLandmarkerRef.current = handLandmarker;
      setIsLoaded(true);
      startCamera();
    };

    createHandLandmarker();

    return () => {
      if (handLandmarker) {
        handLandmarker.close();
      }
      cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const startCamera = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.addEventListener("loadeddata", predictWebcam);
        }
      } catch (error) {
        console.error("Error accessing webcam:", error);
      }
    }
  };

  const predictWebcam = () => {
    if (!handLandmarkerRef.current || !videoRef.current || !canvasRef.current) return;
    
    const startTimeMs = performance.now();
    const results = handLandmarkerRef.current.detectForVideo(videoRef.current, startTimeMs);

    const canvasCtx = canvasRef.current.getContext("2d");
    if (canvasCtx) {
      canvasCtx.font = "24px serif";
      canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      
      const drawingUtils = new DrawingUtils(canvasCtx);
      
      if (results.landmarks && results.landmarks.length > 0) {
        const landmarks = results.landmarks[0];
        
        // Draw landmarks
        drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, {
          color: "#00FF00",
          lineWidth: 2,
        });
        drawingUtils.drawLandmarks(landmarks, { color: "#FF0000", lineWidth: 1 });

        // --- GESTURE RECOGNITION ---
        
        // 1. ROTATION (X Position of Wrist)
        // Wrist is index 0. 
        // Normalized x: 0 is left, 1 is right. Center is 0.5.
        // Screen is mirrored.
        const wristX = landmarks[0].x;
        const centerX = 0.5;
        let rotationVal = 0;
        
        // Add Deadzone (10% center)
        if (Math.abs(wristX - centerX) > 0.1) {
             // Map remaining range to speed
             rotationVal = (centerX - wristX) * 4; 
        }
        onGesture("ROTATE", rotationVal);


        // 2. DETECT OPEN vs FIST (Day/Night)
        const wrist = landmarks[0];
        const tips = [landmarks[8], landmarks[12], landmarks[16], landmarks[20]]; // Exclude thumb for fist
        const pips = [landmarks[6], landmarks[10], landmarks[14], landmarks[18]];
        
        let fingersFolded = true;
        for (let i = 0; i < tips.length; i++) {
           // If tip is further from wrist than PIP, it's open-ish
           const dTip = Math.hypot(tips[i].x - wrist.x, tips[i].y - wrist.y);
           const dPip = Math.hypot(pips[i].x - wrist.x, pips[i].y - wrist.y);
           if (dTip > dPip * 1.2) { // Tolerance
               fingersFolded = false;
               break;
           }
        }

        if (fingersFolded) {
             if (!isFistRef.current) {
                 isFistRef.current = true;
                 // Debounce/Latch logic for toggle
                 if (!fistTriggeredRef.current) {
                     onGesture("TOGGLE_THEME");
                     fistTriggeredRef.current = true;
                     
                     // Visual Feedback
                     canvasCtx.fillStyle = "blue";
                     canvasCtx.fillText("FIST: Toggle", 10, 30);
                 }
             }
        } else {
             isFistRef.current = false;
             fistTriggeredRef.current = false; // Reset trigger so we can toggle again
        }


        // 3. WATERING (Hold Hand High)
        // If hand is OPEN and in UPPER PART of screen
        if (!fingersFolded) {
             const wristY = landmarks[0].y; // 0 is top, 1 is bottom
             
             // Water if hand is in top 30% of view
             if (wristY < 0.3) { 
                onGesture("WATER", 0.02); // Constant water flow
                canvasCtx.fillStyle = "cyan";
                canvasCtx.fillText("HIGH: Water", 10, 60);
             }
        }


        // 4. ZOOM (Pinch)
        // Distance between Thumb Tip (4) and Index Tip (8)
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];
        const distance = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
        
        // Zoom In (Tight Pinch)
        if (distance < 0.05) {
            onGesture("ZOOM", 0.1); 
            canvasCtx.fillStyle = "yellow";
            canvasCtx.fillText("PINCH: Zoom In", 10, 90);
        } 
        // Zoom Out (Wide Spread - if thumb and index are far apart?)
        // Let's use > 0.15 as "Spread"
        else if (distance > 0.15) {
             onGesture("ZOOM", -0.1);
             canvasCtx.fillStyle = "orange";
             canvasCtx.fillText("SPREAD: Zoom Out", 10, 90);
        }

      }
    }

    requestRef.current = requestAnimationFrame(predictWebcam);
  };

  return (
    <div className="fixed bottom-5 right-5 w-48 h-36 bg-black/20 backdrop-blur-md rounded-xl overflow-hidden border border-white/20 shadow-2xl z-50">
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
        width={320}
        height={240}
      />
    </div>
  );
}
