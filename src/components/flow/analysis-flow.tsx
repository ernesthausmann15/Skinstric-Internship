"use client";

import { useEffect, useRef, useState } from "react";
import { Landing } from "@/components/layers/phase1/landing";
import { Layer3 } from "@/components/layers/phase1/layer3";
import { Layer4 } from "@/components/layers/phase1/layer4";
import { Layer5 } from "@/components/layers/phase1/layer5";
import { Layer1 as ChooseSource } from "@/components/layers/phase2/layer1";
import { Layer3 as AnalysisResult } from "@/components/layers/phase2/layer3";
import { Layer1 as CameraPermission } from "@/components/layers/phase3/layer1";
import { Layer2 as CameraSetup } from "@/components/layers/phase3/layer2";

type Step =
  | "landing"
  | "name"
  | "place"
  | "confirm"
  | "choose"
  | "camera"
  | "setup"
  | "analysis";

/**
 * One path through the intro. The landing headline slides as the pointer
 * changes sides, Take Test walks name → city → confirmation, Proceed opens
 * the camera-or-gallery choice, and the camera choice opens the permission
 * card. Allow opens the phase 3 camera-setup screen, then the analysis diamond.
 * Gallery skips the camera frames and opens that same diamond once a photo
 * is chosen. Back from the result returns to the camera choice, because the
 * setup frame has no control of its own. Deny and Back step back along the
 * same path.
 */
export function AnalysisFlow() {
  const [step, setStep] = useState<Step>("landing");
  const [place, setPlace] = useState("");
  const [granted, setGranted] = useState(false);
  const galleryInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step !== "setup") return;
    const timer = window.setTimeout(() => setStep("analysis"), 1400);
    return () => window.clearTimeout(timer);
  }, [step]);

  async function allowCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((track) => track.stop());
      setGranted(true);
      setStep("setup");
    } catch {
      setGranted(false);
    }
  }

  return (
    <>
      {step === "landing" ? <Landing onTakeTest={() => setStep("name")} /> : null}
      {step === "name" ? (
        <Layer3
          onBack={() => setStep("landing")}
          onSubmit={() => setStep("place")}
        />
      ) : null}
      {step === "place" ? (
        <Layer4
          onBack={() => setStep("name")}
          onSubmit={(value) => {
            setPlace(value);
            setStep("confirm");
          }}
        />
      ) : null}
      {step === "confirm" ? (
        <Layer5
          city={place || "Melbourne"}
          onBack={() => setStep("place")}
          onProceed={() => setStep("choose")}
        />
      ) : null}
      {step === "choose" ? (
        <ChooseSource
          onBack={() => setStep("confirm")}
          onCamera={() => {
            setGranted(false);
            setStep("camera");
          }}
          onGallery={() => galleryInput.current?.click()}
        />
      ) : null}
      {step === "camera" ? (
        <CameraPermission
          granted={granted}
          onBack={() => setStep("choose")}
          onDeny={() => setStep("choose")}
          onAllow={allowCamera}
        />
      ) : null}
      {step === "setup" ? <CameraSetup /> : null}
      {step === "analysis" ? (
        <AnalysisResult onBack={() => setStep("choose")} />
      ) : null}
      <input
        ref={galleryInput}
        type="file"
        accept="image/*"
        className="hidden"
        aria-label="Choose a gallery image"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) setStep("analysis");
        }}
      />
    </>
  );
}
