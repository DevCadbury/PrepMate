import React, { useEffect, useRef, useState, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Environment } from "@react-three/drei";
import { InterviewState } from "../../types/interview";
import * as THREE from "three";

interface WebGLAvatarProps {
  interviewState: InterviewState;
}

const AVATAR_URL = "https://models.readyplayer.me/68948fbeef2ebda3c26f743b.glb";

// Helper function to get head/face position for camera targeting
function getHeadPosition(scene: THREE.Group) {
  const box = new THREE.Box3().setFromObject(scene);
  const center = box.getCenter(new THREE.Vector3());
  // Head is at the top of the bounding box, focus on upper face area
  const headY = box.max.y - (box.max.y - box.min.y) * 0.15; // focus on upper face/eyes area
  return new THREE.Vector3(center.x, headY, center.z);
}

const VideoCallAvatar: React.FC<{
  interviewState: InterviewState;
  camera: THREE.PerspectiveCamera | null;
}> = ({ interviewState, camera }) => {
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

  // Store head position for camera targeting
  const [headPosition, setHeadPosition] = useState<THREE.Vector3>(
    new THREE.Vector3(0, 1.6, 0)
  );

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

      // Calculate the head position for correct camera focus
      const head = getHeadPosition(scene);
      setHeadPosition(head);
    }
  }, [scene]);

  // Lip sync animation
  const animateLipSync = useCallback(() => {
    if (interviewState === InterviewState.SPEAKING) {
      const time = Date.now() * 0.005;
      const baseLip = Math.sin(time * 6) * 0.4 + 0.3;
      const microMovements = Math.sin(time * 15) * 0.15;
      const emphasis = Math.sin(time * 2) * 0.1;
      const lipValue = Math.max(
        0,
        Math.min(1, baseLip + microMovements + emphasis)
      );
      setLipSyncValue(lipValue);
    } else {
      setLipSyncValue((prev) => Math.max(0, prev - 0.08));
    }
  }, [interviewState]);

  // Eye blinking
  const animateEyeBlink = useCallback(() => {
    const currentTime = Date.now();
    const timeSinceLastBlink = currentTime - lastBlinkTime.current;
    if (timeSinceLastBlink > 1500 + Math.random() * 2500) {
      lastBlinkTime.current = currentTime;
    }
    const blinkProgress = (currentTime - lastBlinkTime.current) / 150;
    if (blinkProgress < 1) {
      const blinkValue = Math.sin(blinkProgress * Math.PI);
      setEyeBlinkValue(blinkValue);
    } else {
      setEyeBlinkValue(0);
    }
  }, []);

  // Facial expression animation
  const animateExpression = useCallback(() => {
    const time = Date.now() * 0.001;
    switch (interviewState) {
      case InterviewState.SPEAKING:
        setExpressionValue(0.7 + Math.sin(time * 2.5) * 0.15);
        break;
      case InterviewState.LISTENING:
        setExpressionValue(0.4 + Math.sin(time * 1.5) * 0.08);
        break;
      case InterviewState.THINKING:
        setExpressionValue(0.5 + Math.sin(time * 0.8) * 0.12);
        break;
      default:
        setExpressionValue(0.2 + Math.sin(time * 0.5) * 0.05);
        break;
    }
  }, [interviewState]);

  // Apply morph targets
  useEffect(() => {
    morphTargets.forEach((mesh) => {
      if (mesh.morphTargetDictionary && mesh.morphTargetInfluences) {
        const dict = mesh.morphTargetDictionary;
        if (dict["mouthOpen"] !== undefined) {
          mesh.morphTargetInfluences[dict["mouthOpen"]] = lipSyncValue;
        }
        if (dict["mouthWide"] !== undefined) {
          mesh.morphTargetInfluences[dict["mouthWide"]] = lipSyncValue * 0.4;
        }
        if (dict["mouthSmile"] !== undefined) {
          mesh.morphTargetInfluences[dict["mouthSmile"]] = lipSyncValue * 0.3;
        }
        if (dict["mouthFrown"] !== undefined) {
          mesh.morphTargetInfluences[dict["mouthFrown"]] = 0;
        }
        if (dict["eyeBlinkLeft"] !== undefined) {
          mesh.morphTargetInfluences[dict["eyeBlinkLeft"]] = eyeBlinkValue;
        }
        if (dict["eyeBlinkRight"] !== undefined) {
          mesh.morphTargetInfluences[dict["eyeBlinkRight"]] = eyeBlinkValue;
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
          mesh.morphTargetInfluences[dict["jawOpen"]] = lipSyncValue * 0.6;
        }
        if (dict["jawForward"] !== undefined) {
          mesh.morphTargetInfluences[dict["jawForward"]] = lipSyncValue * 0.2;
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
    animateLipSync();
    animateExpression();
    animateEyeBlink();
    // Camera always looks at head position and is placed in front of face
    if (camera && headPosition) {
      // Position camera at face level, slightly above eye level for better framing
      // const cameraY = headPosition.y + 0.1; // Slightly above eye level
      camera.position.set(headPosition.x, headPosition.y, headPosition.z + 3); // Further back to show full face
      // Look directly at the face/eyes area
      camera.lookAt(headPosition.x, headPosition.y, headPosition.z);
    }
  });

  useEffect(() => {
    return () => {
      if (mixerRef.current) {
        mixerRef.current.stopAllAction();
      }
    };
  }, []);

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

const WebGLAvatar: React.FC<WebGLAvatarProps> = ({ interviewState }) => {
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
        const response = await fetch(AVATAR_URL, { method: "HEAD" });
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
    <div className="w-full h-full bg-black rounded-xl overflow-hidden relative shadow-2xl">
      {/* Video Call Frame */}
      <div className="absolute inset-0 border-2 border-gray-600 rounded-xl pointer-events-none z-10"></div>
      {/* Video Call Status Bar */}
      <div className="absolute top-0 left-0 right-0 bg-black bg-opacity-80 text-white px-4 py-2 z-20 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Live Interview</span>
            <span className="text-xs text-gray-300">• Face-to-Face</span>
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
          position: [0, 1.7, 2.2], // Initial position further back to show full face
          fov: 25,
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
        onCreated={({ camera }) => {
          (cameraRef as any).current = camera as THREE.PerspectiveCamera;
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
        />

        {/* Environment lighting */}
        <Environment preset="studio" />
      </Canvas>
      {/* Status Indicator */}
      <div className="absolute bottom-4 left-4 bg-black bg-opacity-80 text-white px-4 py-2 rounded-lg backdrop-blur-sm border border-gray-600">
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
            <div className="text-xs text-gray-300">HR Interviewer</div>
          </div>
        </div>
      </div>
      {/* Controls */}
      <div className="absolute bottom-4 right-4 flex space-x-2">
        <button className="bg-black bg-opacity-60 text-white p-2 rounded-full hover:bg-opacity-80 transition-all border border-gray-600">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <button className="bg-black bg-opacity-60 text-white p-2 rounded-full hover:bg-opacity-80 transition-all border border-gray-600">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
          </svg>
        </button>
      </div>
      {/* Overlay Elements */}
      <div className="absolute top-4 right-4 flex space-x-2">
        <div className="bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs">
          HD
        </div>
        <div className="bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs">
          1080p
        </div>
      </div>
    </div>
  );
};

export default WebGLAvatar;
