"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Landing } from "@/components/layers/phase1/landing";
import { Layer3 } from "@/components/layers/phase1/layer3";
import { Layer4 } from "@/components/layers/phase1/layer4";
import { Layer5 } from "@/components/layers/phase1/layer5";
import { Layer1 as ChooseSource } from "@/components/layers/phase2/layer1";
import { Layer3 as AnalysisResult } from "@/components/layers/phase2/layer3";
import { Layer4 as Demographics } from "@/components/layers/phase2/layer4";
import { Layer1 as CameraPermission } from "@/components/layers/phase3/layer1";
import { Layer2 as CameraSetup } from "@/components/layers/phase3/layer2";
import { Layer3 as CameraPreview } from "@/components/layers/phase3/layer3";
import { Layer4 as CameraShot } from "@/components/layers/phase3/layer4";
import { analyzePortrait, readImageFile, type PortraitAnalysis } from "@/lib/analyze-portrait";
import { isPersonText, readCustomer, submitCustomer } from "@/lib/customer";
import { isolateFace, prepareFrame, type FaceContour, type PreparedFrame } from "@/lib/focus-face";

type Step =
  | "landing"
  | "name"
  | "place"
  | "confirm"
  | "choose"
  | "camera"
  | "setup"
  | "preview"
  | "shot"
  | "analysis"
  | "demographics";

/**
 * One path through the intro. The landing headline slides as the pointer
 * changes sides, Take Test walks name → city → confirmation, Proceed opens
 * the camera-or-gallery choice, and the camera choice opens the permission
 * card. Allow keeps the camera open through setup and into the live preview.
 * A gallery file and a camera still both open sharp. The face scan and the
 * background blur then run for the same stretch of time, and a clipped face
 * is walked a second time before the frame locks. Proceed is what
 * sends that isolated face to the reader. The picture is cleared before Demographics
 * opens. An older reply
 * is dropped, so age and sex follow that face.
 * Demographics on the diamond opens those three lists. Back and Confirm
 * return to the diamond, and Back from the diamond returns to the camera
 * choice. Deny and Back step back along the same path.
 */
export function AnalysisFlow() {
  const [step, setStep] = useState<Step>("landing");
  const [name, setName] = useState("");
  const [place, setPlace] = useState("");
  const [introducing, setIntroducing] = useState(false);
  const [introError, setIntroError] = useState("");
  const [granted, setGranted] = useState(false);
  const [reading, setReading] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [frame, setFrame] = useState<PreparedFrame | null>(null);
  const [face, setFace] = useState<FaceContour | null>(null);
  const [shotFrom, setShotFrom] = useState<"camera" | "gallery" | null>(null);
  const [analysis, setAnalysis] = useState<PortraitAnalysis | null>(null);
  const [scanId, setScanId] = useState(0);
  const galleryInput = useRef<HTMLInputElement>(null);
  const scanGuard = useRef(false);
  // Each new picture bumps this. A reply from an older picture is ignored,
  // so the sample portrait cannot paint over the photo just chosen.
  const readId = useRef(0);

  useEffect(() => {
    const saved = readCustomer();
    if (!saved) return;
    setName(saved.name);
    setPlace(saved.location);
  }, []);

  useEffect(() => {
    if (step !== "setup") return;
    const timer = window.setTimeout(() => setStep("preview"), 1400);
    return () => window.clearTimeout(timer);
  }, [step]);

  function stopCamera() {
    setStream((current) => {
      current?.getTracks().forEach((track) => track.stop());
      return null;
    });
  }

  async function openCamera() {
    const next = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: { ideal: "user" },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    });
    setStream(next);
    return next;
  }

  async function allowCamera() {
    try {
      await openCamera();
      setGranted(true);
      setStep("setup");
    } catch {
      setGranted(false);
    }
  }

  async function proceedFromIntro() {
    if (introducing || !isPersonText(name) || !isPersonText(place)) return;
    setIntroducing(true);
    setIntroError("");
    try {
      await submitCustomer({ name, location: place });
      setStep("choose");
    } catch (error) {
      setIntroError(error instanceof Error ? error.message : "The introduction could not be saved.");
    } finally {
      setIntroducing(false);
    }
  }

  function holdFrame(next: PreparedFrame, from: "camera" | "gallery") {
    readId.current += 1;
    scanGuard.current = false;
    setReading(false);
    setAnalysis(null);
    setFace(null);
    setFrame(next);
    setShotFrom(from);
    setStep("shot");
  }

  function scanFace(region: FaceContour, prepared: PreparedFrame) {
    if (scanGuard.current) return;
    scanGuard.current = true;
    void isolateFace(prepared.source, region, prepared.fit)
      .then((faceOnly) => submitPortrait(faceOnly))
      .catch(() => {
        scanGuard.current = false;
      });
  }

  async function submitPortrait(dataUrl: string) {
    if (!dataUrl.startsWith("data:image/")) return;
    const id = readId.current + 1;
    readId.current = id;
    setReading(true);
    setAnalysis(null);
    try {
      const result = await analyzePortrait(dataUrl);
      if (id !== readId.current) return;
      setAnalysis(result);
      setScanId((current) => current + 1);
      setFrame(null);
      setStep("analysis");
    } catch {
      // The blurred frame stays on the processing screen. Age and sex are not filled from an older picture.
      scanGuard.current = false;
    } finally {
      if (id === readId.current) setReading(false);
    }
  }

  return (
    <StageFrame>
      {step === "landing" ? <Landing onTakeTest={() => setStep("name")} /> : null}
      {step === "name" ? (
        <Layer3
          value={name}
          onChange={setName}
          onBack={() => setStep("landing")}
          onSubmit={() => {
            if (isPersonText(name)) setStep("place");
          }}
        />
      ) : null}
      {step === "place" ? (
        <Layer4
          value={place}
          onChange={setPlace}
          onBack={() => setStep("name")}
          onSubmit={() => {
            if (isPersonText(place)) setStep("confirm");
          }}
        />
      ) : null}
      {step === "confirm" ? (
        <Layer5
          city={place}
          pending={introducing}
          error={introError}
          onBack={() => {
            if (introducing) return;
            setIntroError("");
            setStep("place");
          }}
          onProceed={() => {
            void proceedFromIntro();
          }}
        />
      ) : null}
      {!reading && step === "choose" ? (
        <ChooseSource
          onBack={() => setStep("confirm")}
          onCamera={() => {
            stopCamera();
            setFrame(null);
            setAnalysis(null);
            setGranted(false);
            setStep("camera");
          }}
          onGallery={() => galleryInput.current?.click()}
        />
      ) : null}
      {step === "camera" ? (
        <CameraPermission
          granted={granted}
          onBack={() => {
            stopCamera();
            setStep("choose");
          }}
          onDeny={() => {
            stopCamera();
            setStep("choose");
          }}
          onAllow={allowCamera}
        />
      ) : null}
      {!reading && step === "setup" ? <CameraSetup /> : null}
      {!reading && step === "preview" ? (
        <CameraPreview
          stream={stream}
          onBack={() => {
            stopCamera();
            setStep("choose");
          }}
          onCapture={(image) => {
            stopCamera();
            void prepareFrame(image).then((prepared) => holdFrame(prepared, "camera"));
          }}
        />
      ) : null}
      {step === "shot" ? (
        <CameraShot
          image={frame?.image ?? null}
          ready={Boolean(face)}
          scanning={reading}
          onScanReady={(region) => setFace(region)}
          onBack={() => {
            if (reading) return;
            if (shotFrom === "gallery") {
              setFrame(null);
              setFace(null);
              setStep("choose");
              return;
            }
            openCamera()
              .then(() => setStep("preview"))
              .catch(() => setStep("choose"));
          }}
          onProceed={() => {
            if (face && frame && !reading) scanFace(face, frame);
          }}
        />
      ) : null}
      {step === "analysis" ? (
        <AnalysisResult
          onBack={() => setStep("choose")}
          onDemographics={() => setStep("demographics")}
        />
      ) : null}
      {!reading && step === "demographics" && analysis ? (
        <Demographics
          key={scanId}
          analysis={analysis}
          scanId={scanId}
          onBack={() => setStep("analysis")}
          onConfirm={() => setStep("analysis")}
        />
      ) : null}
      <input
        ref={galleryInput}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-label="Choose a gallery image"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          void readImageFile(file)
            .then((dataUrl) => prepareFrame(dataUrl))
            .then((prepared) => holdFrame(prepared, "gallery"));
        }}
      />
    </StageFrame>
  );
}

function StageFrame({ children }: { children: ReactNode }) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    // The artboard stays 1920×960. Phone and tablet windows scale that same
    // frame to the visual viewport, so the camera and the forms stay on
    // screen when the browser chrome or the orientation changes.
    const fit = () => {
      const width = window.visualViewport?.width ?? window.innerWidth;
      const height = window.visualViewport?.height ?? window.innerHeight;
      setScale(Math.min(width / 1920, height / 960));
    };
    fit();
    window.addEventListener("resize", fit);
    window.addEventListener("orientationchange", fit);
    window.visualViewport?.addEventListener("resize", fit);
    return () => {
      window.removeEventListener("resize", fit);
      window.removeEventListener("orientationchange", fit);
      window.visualViewport?.removeEventListener("resize", fit);
    };
  }, []);

  return (
    <div className="relative h-dvh w-dvw overflow-hidden bg-[#FCFCFC]" style={{ touchAction: "manipulation" }}>
      <div
        className="absolute top-1/2 left-1/2"
        style={{ width: 1920, height: 960, transform: `translate(-50%, -50%) scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  );
}
