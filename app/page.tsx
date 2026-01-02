"use client";

import { useRef } from "react";
import ZenGarden, { ZenGardenHandle } from "@/components/ZenGarden";
import HandGestureController, { GestureAction } from "@/components/HandGestureController";

export default function Home() {
  const zenGardenRef = useRef<ZenGardenHandle>(null);

  const handleGesture = (action: GestureAction, value?: number) => {
    if (!zenGardenRef.current) return;

    switch (action) {
      case "ROTATE":
        if (value !== undefined) zenGardenRef.current.setRotationSpeed(value);
        break;
      case "WATER":
        if (value !== undefined) zenGardenRef.current.water(value);
        break;
      case "TOGGLE_THEME":
        zenGardenRef.current.toggleTheme();
        break;
      case "ZOOM":
        if (value !== undefined) zenGardenRef.current.zoom(value);
        break;
    }
  };

  return (
    <main className="w-full h-screen overflow-hidden">
      <HandGestureController onGesture={handleGesture} />
      <ZenGarden ref={zenGardenRef} />
    </main>
  );
}
