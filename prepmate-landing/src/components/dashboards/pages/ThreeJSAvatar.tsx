import React, { useEffect, useRef } from "react";

// Dynamic import to avoid TypeScript issues
const THREE = require("three");

interface ThreeJSAvatarProps {
  isSpeaking?: boolean;
  isListening?: boolean;
  className?: string;
}

const ThreeJSAvatar: React.FC<ThreeJSAvatarProps> = ({
  isSpeaking = false,
  isListening = false,
  className = "",
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<any>(null);
  const rendererRef = useRef<any>(null);
  const avatarRef = useRef<any>(null);
  const animationIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 5;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(
      mountRef.current.clientWidth,
      mountRef.current.clientHeight
    );
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0x4a90e2, 1, 100);
    pointLight.position.set(0, 2, 2);
    scene.add(pointLight);

    // Create AI Avatar
    const avatarGroup = new THREE.Group();
    avatarRef.current = avatarGroup;

    // Head (sphere)
    const headGeometry = new THREE.SphereGeometry(1, 32, 32);
    const headMaterial = new THREE.MeshPhongMaterial({
      color: 0x4a90e2,
      transparent: true,
      opacity: 0.9,
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.5;
    head.castShadow = true;
    avatarGroup.add(head);

    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    const eyeMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });

    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.3, 1.7, 0.8);
    avatarGroup.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.3, 1.7, 0.8);
    avatarGroup.add(rightEye);

    // Pupils
    const pupilGeometry = new THREE.SphereGeometry(0.05, 16, 16);
    const pupilMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });

    const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    leftPupil.position.set(-0.3, 1.7, 0.85);
    avatarGroup.add(leftPupil);

    const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    rightPupil.position.set(0.3, 1.7, 0.85);
    avatarGroup.add(rightPupil);

    // Body (cylinder)
    const bodyGeometry = new THREE.CylinderGeometry(0.8, 1, 2, 32);
    const bodyMaterial = new THREE.MeshPhongMaterial({
      color: 0x6c5ce7,
      transparent: true,
      opacity: 0.8,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = -0.5;
    body.castShadow = true;
    avatarGroup.add(body);

    // Arms
    const armGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1.5, 16);
    const armMaterial = new THREE.MeshPhongMaterial({ color: 0x4a90e2 });

    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-1.2, 0, 0);
    leftArm.rotation.z = Math.PI / 4;
    avatarGroup.add(leftArm);

    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(1.2, 0, 0);
    rightArm.rotation.z = -Math.PI / 4;
    avatarGroup.add(rightArm);

    // Speaking/Listening effects
    if (isSpeaking) {
      // Add speaking animation
      const speakingGeometry = new THREE.SphereGeometry(0.3, 16, 16);
      const speakingMaterial = new THREE.MeshPhongMaterial({
        color: 0x00ff00,
        transparent: true,
        opacity: 0.6,
      });
      const speakingEffect = new THREE.Mesh(speakingGeometry, speakingMaterial);
      speakingEffect.position.set(0, 1.5, -1.5);
      avatarGroup.add(speakingEffect);
    }

    if (isListening) {
      // Add listening animation
      const listeningGeometry = new THREE.TorusGeometry(0.5, 0.1, 16, 32);
      const listeningMaterial = new THREE.MeshPhongMaterial({
        color: 0xff6b6b,
        transparent: true,
        opacity: 0.6,
      });
      const listeningEffect = new THREE.Mesh(
        listeningGeometry,
        listeningMaterial
      );
      listeningEffect.position.set(0, 1.5, -1.5);
      avatarGroup.add(listeningEffect);
    }

    scene.add(avatarGroup);

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      if (avatarGroup) {
        // Gentle floating animation
        avatarGroup.rotation.y += 0.01;
        avatarGroup.position.y = Math.sin(Date.now() * 0.001) * 0.1;

        // Breathing effect
        if (body) {
          body.scale.y = 1 + Math.sin(Date.now() * 0.002) * 0.05;
        }

        // Blinking animation
        if (leftEye && rightEye) {
          const blink = Math.sin(Date.now() * 0.003);
          if (blink < -0.8) {
            leftEye.scale.y = 0.1;
            rightEye.scale.y = 0.1;
          } else {
            leftEye.scale.y = 1;
            rightEye.scale.y = 1;
          }
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (!mountRef.current || !renderer || !camera) return;

      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [isSpeaking, isListening]);

  return (
    <div
      ref={mountRef}
      className={`w-full h-full ${className}`}
      style={{ minHeight: "400px" }}
    />
  );
};

export default ThreeJSAvatar;
