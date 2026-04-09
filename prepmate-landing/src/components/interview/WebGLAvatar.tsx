import React, { useEffect, useRef, useState, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Environment } from "@react-three/drei";
import { InterviewState } from "../../types/interview";
import * as THREE from "three";
import { apiClient } from "../../lib/apiClient";

interface WebGLAvatarProps {
  interviewState: InterviewState;
  isAudioPlaying?: boolean;
}

const AVATAR_URL = "https://models.readyplayer.me/68948fbeef2ebda3c26f743b.glb";

// Helper function to get head/face position for camera targeting
function getHeadPosition(scene: THREE.Group) {
  const box = new THREE.Box3().setFromObject(scene);
  const center = box.getCenter(new THREE.Vector3());
  
  console.log('📏 Model bounding box:', { 
    min: box.min, 
    max: box.max, 
    center: center,
    height: box.max.y - box.min.y 
  });
  
  // Find the actual head bone or face mesh for more accurate positioning
  let headBone: THREE.Object3D | null = null;
  scene.traverse((child: THREE.Object3D) => {
    const childName = child.name.toLowerCase();
    if (childName.includes('head') || 
        childName.includes('face') ||
        childName.includes('skull') ||
        childName.includes('neck') ||
        child.type === 'SkinnedMesh') {
      console.log('🔍 Found potential head bone:', child.name, child.type, child.position);
      if (!headBone || child.position.y > (headBone.position.y || -999)) {
        headBone = child; // Use the highest positioned bone/mesh
      }
    }
  });
  
  if (headBone) {
    try {
      const worldPosition = new THREE.Vector3();
      (headBone as THREE.Object3D).getWorldPosition(worldPosition);
      console.log('🎯 Head bone world position:', worldPosition);
      
      // If the world position seems reasonable (positive Y for head)
      if (worldPosition.y > center.y) {
        return new THREE.Vector3(worldPosition.x, worldPosition.y, worldPosition.z);
      }
    } catch (error) {
      console.warn('Could not get world position from head bone:', error);
    }
  }
  
  // Enhanced fallback: Always use the TOP of the bounding box for head
  // Head should be at the highest point of the model
  const headY = box.max.y - (box.max.y - box.min.y) * 0.1; // Near the top, slight adjustment for face
  const facePosition = new THREE.Vector3(center.x, headY, center.z);
  
  console.log('📍 Calculated face position (fallback):', facePosition);
  return facePosition;
}

const VideoCallAvatar: React.FC<{
  interviewState: InterviewState;
  camera: THREE.PerspectiveCamera | null;
  isAudioPlaying?: boolean;
}> = ({ interviewState, camera, isAudioPlaying = false }) => {
  const { scene, animations } = useGLTF(AVATAR_URL);
  const modelRef = useRef<THREE.Group>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const [currentAnimation, setCurrentAnimation] = useState<string | null>(null);
  const [morphTargets, setMorphTargets] = useState<THREE.Mesh[]>([]);
  const [lipSyncValue, setLipSyncValue] = useState(0);
  const [expressionValue, setExpressionValue] = useState(0);
  const [eyeBlinkValue, setEyeBlinkValue] = useState(0);
  const timeRef = useRef(0);
  const lastBlinkTime = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Store head position for camera targeting
  const [headPosition, setHeadPosition] = useState<THREE.Vector3>(
    new THREE.Vector3(0, 1.65, 0) // Face-level height
  );
  const [isCameraInitialized, setIsCameraInitialized] = useState(false);

  // Initialize audio analysis for real lip-sync
  const initializeAudioAnalysis = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      if (!analyserRef.current) {
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        analyserRef.current.smoothingTimeConstant = 0.8;
      }
    } catch (error) {
      console.warn('Audio analysis initialization failed:', error);
    }
  }, []);

  useEffect(() => {
    if (scene) {
      // Find all meshes with morph targets (facial expressions)
      const meshes: THREE.Mesh[] = [];
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh && child.morphTargetDictionary) {
          meshes.push(child);
        }
      });
      setMorphTargets(meshes);

      // Calculate head position for camera targeting
      const head = getHeadPosition(scene);
      setHeadPosition(head);
      console.log('👤 Avatar head position calculated:', head);
      
      // Initialize audio analysis for lip-sync
      initializeAudioAnalysis();
      
      // Force camera initialization on next frame
      setIsCameraInitialized(false);
    }
  }, [scene, initializeAudioAnalysis]);

  // Force camera to focus on face when camera becomes available
  useEffect(() => {
    if (camera && headPosition && !isCameraInitialized) {
      // Ensure we're looking at a reasonable head position
      let adjustedHeadPosition = headPosition.clone();
      
      // If head position seems wrong (negative Y or too low), force it to a reasonable head height
      if (adjustedHeadPosition.y < 1.0) {
        adjustedHeadPosition.y = 1.65; // Standard head height for standing figure
        console.log('⚠️ Force init: Head position too low, adjusted to:', adjustedHeadPosition);
      }
      
      // Position camera very close for detailed facial animation visibility
      const facePosition = new THREE.Vector3(
        adjustedHeadPosition.x,
        adjustedHeadPosition.y - 0.2, // Slightly lower to show upper body
        adjustedHeadPosition.z + 1.8 // Much closer for clear lip-sync visibility
      );
      
      camera.position.copy(facePosition);
      camera.lookAt(adjustedHeadPosition.x, adjustedHeadPosition.y - 0.1, adjustedHeadPosition.z);
      setIsCameraInitialized(true);
      
      console.log('📷 Camera force-initialized for close-up view:', facePosition);
      console.log('📷 Camera looking at face area:', { x: adjustedHeadPosition.x, y: adjustedHeadPosition.y - 0.1, z: adjustedHeadPosition.z });
    }
  }, [camera, headPosition, isCameraInitialized]);

  // Enhanced lip sync animation with real audio analysis when available
  const animateLipSync = useCallback(() => {
    if (interviewState === InterviewState.SPEAKING || isAudioPlaying) {
      let lipValue = 0;
      
      // Try to get real audio data first
      if (analyserRef.current && audioContextRef.current?.state === 'running') {
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Analyze frequency data for speech patterns
        const lowFreq = dataArray.slice(0, 10).reduce((a, b) => a + b, 0) / 10; // Bass (vowels)
        const midFreq = dataArray.slice(10, 40).reduce((a, b) => a + b, 0) / 30; // Mid (consonants)
        const highFreq = dataArray.slice(40, 80).reduce((a, b) => a + b, 0) / 40; // High (sibilants)
        
        // Calculate lip movement based on audio energy
        const totalEnergy = (lowFreq + midFreq + highFreq) / 3;
        lipValue = Math.min(1, Math.max(0, totalEnergy / 128)); // Normalize to 0-1
        
        // Add some natural variation for speech patterns
        const time = Date.now() * 0.003;
        const naturalVariation = Math.sin(time * 6) * 0.1;
        lipValue = Math.max(0, Math.min(1, lipValue + naturalVariation));
      } else {
        // Enhanced procedural animation for close-up visibility
        const time = Date.now() * 0.01; // Even faster for close-up view
        
        // Very pronounced speech patterns for close-up visibility
        const consonantPattern = Math.sin(time * 15) * 0.5; // Very pronounced consonants
        const vowelPattern = Math.sin(time * 8) * 0.7 + 0.6; // Strong vowel sounds
        const breathPattern = Math.sin(time * 2.5) * 0.2; // Natural breathing
        const emphasisPattern = Math.sin(time * 5) * 0.3; // Strong speech emphasis
        
        // Combine patterns for maximum visibility in close-up
        lipValue = Math.max(
          0.15, // More base movement for close-up view
          Math.min(1, (vowelPattern + consonantPattern + breathPattern + emphasisPattern) * 0.9)
        );
      }
      
      setLipSyncValue(lipValue);
    } else {
      // Gradual return to neutral position
      setLipSyncValue((prev) => Math.max(0, prev - 0.12));
    }
  }, [interviewState, isAudioPlaying]);

  // Connect audio element to analyzer for real lip-sync
  const connectAudioElement = useCallback((audioElement: HTMLAudioElement) => {
    try {
      if (audioContextRef.current && analyserRef.current && !audioSourceRef.current) {
        audioSourceRef.current = audioContextRef.current.createMediaElementSource(audioElement);
        audioSourceRef.current.connect(analyserRef.current);
        analyserRef.current.connect(audioContextRef.current.destination);
        console.log('🔊 Audio element connected to lip-sync analyzer');
      }
    } catch (error) {
      console.warn('Failed to connect audio element:', error);
    }
  }, []);

  // Expose function to connect audio globally
  useEffect(() => {
    (window as any).connectAudioToLipSync = connectAudioElement;
    return () => {
      delete (window as any).connectAudioToLipSync;
    };
  }, [connectAudioElement]);

  // Enhanced eye blinking with more visible animation
  const animateEyeBlink = useCallback(() => {
    const currentTime = Date.now();
    const timeSinceLastBlink = currentTime - lastBlinkTime.current;
    
    // More frequent blinking (1.5-3 seconds) for better visibility
    const nextBlinkTime = 1500 + Math.random() * 1500;
    
    if (timeSinceLastBlink > nextBlinkTime) {
      lastBlinkTime.current = currentTime;
    }
    
    // Slightly longer blink duration for visibility (150-200ms)
    const blinkDuration = 150 + Math.random() * 50;
    const blinkProgress = (currentTime - lastBlinkTime.current) / blinkDuration;
    
    if (blinkProgress < 1) {
      // More pronounced blink curve for visibility
      const blinkCurve = blinkProgress < 0.3 
        ? Math.sin(blinkProgress * 3.33 * Math.PI) * 0.9  // Faster close, more pronounced
        : Math.sin((1 - blinkProgress) * 1.43 * Math.PI) * 0.8; // Slower open
      setEyeBlinkValue(Math.max(0, blinkCurve));
    } else {
      setEyeBlinkValue(0);
    }
  }, []);

  // Enhanced facial expression animation with more visible gestures
  const animateExpression = useCallback(() => {
    const time = Date.now() * 0.002; // Slightly faster for more noticeable changes
    const microExpression = Math.sin(time * 4) * 0.08; // More pronounced micro-expressions
    
    switch (interviewState) {
      case InterviewState.SPEAKING:
        // More animated and expressive when speaking
        const speakingBase = 0.7 + Math.sin(time * 3.2) * 0.18; // More variation
        const speakingEnthusiasm = Math.sin(time * 1.5) * 0.12; // More enthusiasm
        setExpressionValue(Math.min(1, speakingBase + speakingEnthusiasm + microExpression));
        break;
      case InterviewState.LISTENING:
        // More attentive and engaged expression
        const listeningBase = 0.4 + Math.sin(time * 2.2) * 0.1; // More engagement
        const attentiveness = Math.sin(time * 0.8) * 0.08; // More attentiveness
        setExpressionValue(listeningBase + attentiveness + microExpression);
        break;
      case InterviewState.THINKING:
        // More thoughtful, concentrated expression
        const thinkingBase = 0.2 + Math.sin(time * 1.1) * 0.12; // More concentration
        const concentration = Math.sin(time * 0.5) * 0.1; // More visible thinking
        setExpressionValue(thinkingBase + concentration + microExpression);
        break;
      default:
        // More welcoming neutral expression
        setExpressionValue(0.3 + Math.sin(time * 0.8) * 0.06 + microExpression);
        break;
    }
  }, [interviewState]);

  // Apply morph targets
  useEffect(() => {
    morphTargets.forEach((mesh) => {
      if (mesh.morphTargetDictionary && mesh.morphTargetInfluences) {
        const dict = mesh.morphTargetDictionary;
        if (dict["mouthOpen"] !== undefined) {
          mesh.morphTargetInfluences[dict["mouthOpen"]] = lipSyncValue * 0.9; // Maximum visibility for close-up
        }
        if (dict["mouthWide"] !== undefined) {
          mesh.morphTargetInfluences[dict["mouthWide"]] = lipSyncValue * 0.7; // Very visible for close-up
        }
        if (dict["mouthSmile"] !== undefined) {
          mesh.morphTargetInfluences[dict["mouthSmile"]] = lipSyncValue * 0.6; // Enhanced smile for close-up
        }
        if (dict["mouthFrown"] !== undefined) {
          mesh.morphTargetInfluences[dict["mouthFrown"]] = 0;
        }
        if (dict["eyeBlinkLeft"] !== undefined) {
          mesh.morphTargetInfluences[dict["eyeBlinkLeft"]] = eyeBlinkValue * 0.9; // More visible blink
        }
        if (dict["eyeBlinkRight"] !== undefined) {
          mesh.morphTargetInfluences[dict["eyeBlinkRight"]] = eyeBlinkValue * 0.9; // More visible blink
        }
        if (dict["smile"] !== undefined) {
          mesh.morphTargetInfluences[dict["smile"]] = expressionValue;
        }
        if (dict["happy"] !== undefined) {
          mesh.morphTargetInfluences[dict["happy"]] = expressionValue;
        }
        if (dict["surprised"] !== undefined) {
          mesh.morphTargetInfluences[dict["surprised"]] =
            interviewState === InterviewState.THINKING ? 0.15 : 0;
        }
        if (dict["angry"] !== undefined) {
          mesh.morphTargetInfluences[dict["angry"]] = 0;
        }
        if (dict["sad"] !== undefined) {
          mesh.morphTargetInfluences[dict["sad"]] = 0;
        }
        if (dict["frown"] !== undefined) {
          mesh.morphTargetInfluences[dict["frown"]] =
            interviewState === InterviewState.THINKING ? 0.08 : 0;
        }
        if (dict["browUp"] !== undefined) {
          mesh.morphTargetInfluences[dict["browUp"]] =
            interviewState === InterviewState.LISTENING ? 0.25 : 0;
        }
        if (dict["browDown"] !== undefined) {
          mesh.morphTargetInfluences[dict["browDown"]] =
            interviewState === InterviewState.THINKING ? 0.1 : 0;
        }
        if (dict["cheekPuff"] !== undefined) {
          mesh.morphTargetInfluences[dict["cheekPuff"]] =
            interviewState === InterviewState.SPEAKING ? 0.15 : 0;
        }
        if (dict["noseSneer"] !== undefined) {
          mesh.morphTargetInfluences[dict["noseSneer"]] = 0;
        }
        if (dict["jawOpen"] !== undefined) {
          mesh.morphTargetInfluences[dict["jawOpen"]] = lipSyncValue * 0.8; // Maximum jaw movement for close-up
        }
        if (dict["jawForward"] !== undefined) {
          mesh.morphTargetInfluences[dict["jawForward"]] = lipSyncValue * 0.4; // Enhanced jaw articulation for close-up
        }
        if (dict["jawLeft"] !== undefined) {
          mesh.morphTargetInfluences[dict["jawLeft"]] = 0;
        }
        if (dict["jawRight"] !== undefined) {
          mesh.morphTargetInfluences[dict["jawRight"]] = 0;
        }
      }
    });
  }, [
    morphTargets,
    lipSyncValue,
    expressionValue,
    eyeBlinkValue,
    interviewState,
  ]);

  // Animation mixer
  useEffect(() => {
    if (scene && animations.length > 0) {
      const mixer = new THREE.AnimationMixer(scene);
      mixerRef.current = mixer;
      let targetAnimation = null;
      switch (interviewState) {
        case InterviewState.SPEAKING:
          targetAnimation =
            animations.find(
              (anim) =>
                anim.name.toLowerCase().includes("talk") ||
                anim.name.toLowerCase().includes("speak") ||
                anim.name.toLowerCase().includes("mouth") ||
                anim.name.toLowerCase().includes("idle")
            ) || animations[0];
          break;
        case InterviewState.LISTENING:
        case InterviewState.THINKING:
          targetAnimation =
            animations.find(
              (anim) =>
                anim.name.toLowerCase().includes("think") ||
                anim.name.toLowerCase().includes("listen") ||
                anim.name.toLowerCase().includes("idle")
            ) || animations[0];
          break;
        default:
          targetAnimation =
            animations.find(
              (anim) =>
                anim.name.toLowerCase().includes("idle") ||
                anim.name.toLowerCase().includes("default")
            ) || animations[0];
          break;
      }
      if (targetAnimation && targetAnimation.name !== currentAnimation) {
        mixer.stopAllAction();
        const action = mixer.clipAction(targetAnimation);
        action.setLoop(THREE.LoopRepeat, Infinity);
        action.play();
        setCurrentAnimation(targetAnimation.name);
      }
    }
  }, [interviewState, scene, animations, currentAnimation]);

  useFrame((state, delta) => {
    timeRef.current += delta;
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }
    
    // Run facial animations every frame for smooth motion
    animateLipSync();
    animateExpression(); 
    animateEyeBlink();
    // Initialize camera to always focus on face (only once or when head position changes significantly)
    if (camera && headPosition && (!isCameraInitialized || camera.position.distanceTo(new THREE.Vector3(headPosition.x, headPosition.y, headPosition.z + 1.8)) > 0.3)) {
      
      // Ensure we're looking at a reasonable head position (should be positive Y for standing figure)
      let adjustedHeadPosition = headPosition.clone();
      
      // If head position seems wrong (negative Y or too low), force it to a reasonable head height
      if (adjustedHeadPosition.y < 1.0) {
        adjustedHeadPosition.y = 1.65; // Standard head height for standing figure
        console.log('⚠️ Head position seemed too low, adjusted to:', adjustedHeadPosition);
      }
      
      // Position camera very close for maximum facial detail and lip-sync visibility
      const optimalCameraPos = new THREE.Vector3(
        adjustedHeadPosition.x,           // Center horizontally
        adjustedHeadPosition.y - 0.1,     // Just slightly lower for natural angle
        adjustedHeadPosition.z + 1.8      // Very close for clear facial animations
      );
      
      // Smooth camera movement to avoid jarring transitions
      if (isCameraInitialized) {
        camera.position.lerp(optimalCameraPos, 0.02);
      } else {
        camera.position.copy(optimalCameraPos);
        setIsCameraInitialized(true);
      }
      
      // Look at face/neck area for close-up framing with clear facial detail
      const upperBodyTarget = new THREE.Vector3(
        adjustedHeadPosition.x, 
        adjustedHeadPosition.y - 0.1, // Focus on face/neck for close-up view
        adjustedHeadPosition.z
      );
      camera.lookAt(upperBodyTarget);
      
      console.log('📷 Camera positioned for close-up at:', optimalCameraPos);
      console.log('📷 Camera looking at face close-up:', upperBodyTarget);
    }
  });

  useEffect(() => {
    return () => {
      if (mixerRef.current) {
        mixerRef.current.stopAllAction();
      }
    };
  }, []);

  // Immediately detect head position when model loads to prevent feet initialization
  useEffect(() => {
    if (modelRef.current && scene) {
      // Quick head detection on model load
      const headPos = getHeadPosition(modelRef.current);
      if (headPos && headPos.y > 1.0) {
        setHeadPosition(headPos);
        console.log('🚀 Immediate head detection on model load:', headPos);
      }
    }
  }, [scene, getHeadPosition, setHeadPosition]);

  // Place avatar at origin, face forward, scale up for close-up
  return (
    <group
      ref={modelRef}
      position={[0, 0, 0]}
      rotation={[0, 0, 0]}
      scale={[2, 2, 2]}
    >
      <primitive object={scene} />
    </group>
  );
};

const FallbackAvatar: React.FC<{ interviewState: InterviewState }> = ({
  interviewState,
}) => {
  const getAnimationClass = () => {
    switch (interviewState) {
      case InterviewState.SPEAKING:
        return "animate-pulse";
      case InterviewState.LISTENING:
      case InterviewState.THINKING:
        return "animate-bounce";
      default:
        return "";
    }
  };
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-900 to-gray-900 rounded-lg">
      <div className="text-center">
        <div
          className={`w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center ${getAnimationClass()}`}
        >
          <svg
            className="w-16 h-16 text-white"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="text-white">
          <h3 className="text-lg font-semibold mb-2">HR Interviewer</h3>
          <p className="text-sm text-gray-300">
            {interviewState === InterviewState.SPEAKING && "Speaking..."}
            {interviewState === InterviewState.LISTENING && "Listening..."}
            {interviewState === InterviewState.THINKING && "Thinking..."}
            {interviewState === InterviewState.IDLE && "Ready for interview"}
            {interviewState === InterviewState.STARTING &&
              "Starting interview..."}
            {interviewState === InterviewState.ENDED && "Interview ended"}
          </p>
        </div>
      </div>
    </div>
  );
};

const WebGLAvatar: React.FC<WebGLAvatarProps> = ({ interviewState, isAudioPlaying = false }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useFallback, setUseFallback] = useState(false);
  // Camera reference for manual control
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  useEffect(() => {
    const loadModel = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setUseFallback(false);
        const response = await apiClient.fetch(AVATAR_URL, { method: "HEAD" });
        if (!response.ok) {
          throw new Error(`Failed to load model: ${response.status}`);
        }
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load avatar");
        setIsLoading(false);
        setUseFallback(true);
      }
    };
    loadModel();
  }, []);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900 rounded-lg">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p>Loading HR Avatar...</p>
        </div>
      </div>
    );
  }
  if (useFallback) {
    return <FallbackAvatar interviewState={interviewState} />;
  }
  if (error && !useFallback) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900 rounded-lg">
        <div className="text-white text-center">
          <p className="text-red-400 mb-2">Error loading 3D avatar</p>
          <p className="text-sm text-gray-400">{error}</p>
          <button
            onClick={() => setUseFallback(true)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Use Fallback Avatar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-black rounded-lg overflow-hidden relative shadow-md">
      {/* Video Call Frame */}
      <div className="absolute inset-0 border border-border rounded-lg pointer-events-none z-10"></div>
      {/* Video Call Status Bar */}
      <div className="absolute top-0 left-0 right-0 bg-background/80 text-foreground px-4 py-2 z-20 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Live Interview</span>
            <span className="text-xs text-muted-foreground">• Face-to-Face</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs">Connected</span>
          </div>
        </div>
      </div>
      {/* 3D Character Canvas */}
      <Canvas
        camera={{
          position: [0, 1.6, 1.8], // Much closer to camera for detailed facial visibility
          fov: 28, // Tighter zoom for close-up view
          near: 0.1,
          far: 1000,
        }}
        style={{ background: "transparent" }}
        gl={{
          antialias: true,
          alpha: true,
          preserveDrawingBuffer: true,
          powerPreference: "high-performance",
        }}
        onCreated={(state: any) => {
          (cameraRef as any).current = state.camera as THREE.PerspectiveCamera;
        }}
      >
        {/* Lights */}
        <ambientLight intensity={0.8} />
        <directionalLight position={[0, 2, 2]} intensity={1.2} />
        <directionalLight position={[2, 2, 2]} intensity={0.8} />
        <pointLight position={[0, 2, 2]} intensity={0.6} color="#ffffff" />
        <directionalLight
          position={[-2, 1.5, 2]}
          intensity={0.5}
          color="#4a90e2"
        />
        <directionalLight
          position={[0, 1, 2]}
          intensity={0.6}
          color="#ffffff"
        />

        {/* Avatar */}
        <VideoCallAvatar
          interviewState={interviewState}
          camera={cameraRef.current}
          isAudioPlaying={isAudioPlaying}
        />

        {/* Environment lighting */}
        <Environment preset="studio" />
      </Canvas>
      {/* Status Indicator */}
      <div className="absolute bottom-4 left-4 bg-background/80 text-foreground px-4 py-2 rounded-md backdrop-blur-md border border-border shadow-sm">
        <div className="flex items-center space-x-3">
          <div
            className={`w-3 h-3 rounded-full ${
              interviewState === InterviewState.SPEAKING
                ? "bg-green-400 animate-pulse"
                : interviewState === InterviewState.LISTENING
                ? "bg-blue-400 animate-pulse"
                : interviewState === InterviewState.THINKING
                ? "bg-yellow-400 animate-pulse"
                : "bg-gray-400"
            }`}
          ></div>
          <div>
            <span className="text-sm font-medium">
              {interviewState === InterviewState.SPEAKING && "Speaking..."}
              {interviewState === InterviewState.LISTENING && "Listening..."}
              {interviewState === InterviewState.THINKING && "Thinking..."}
              {interviewState === InterviewState.IDLE && "Ready"}
              {interviewState === InterviewState.STARTING && "Starting..."}
              {interviewState === InterviewState.ENDED && "Ended"}
            </span>
            <div className="text-xs text-muted-foreground">HR Interviewer</div>
          </div>
        </div>
      </div>
      {/* Controls */}
      <div className="absolute bottom-4 right-4 flex space-x-2">
        <button className="bg-background/80 text-foreground p-2 rounded-full hover:bg-muted transition-all border border-border">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <button className="bg-background/80 text-foreground p-2 rounded-full hover:bg-muted transition-all border border-border">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
          </svg>
        </button>
      </div>
      {/* Overlay Elements */}
      <div className="absolute top-4 right-4 flex space-x-2">
        <div className="bg-background/60 text-foreground px-2 py-1 rounded text-xs border border-border">
          HD
        </div>
        <div className="bg-background/60 text-foreground px-2 py-1 rounded text-xs border border-border">
          1080p
        </div>
      </div>
    </div>
  );
};

export default WebGLAvatar;
