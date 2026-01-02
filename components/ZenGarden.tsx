"use client";

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export interface ZenGardenHandle {
    setRotationSpeed: (speed: number) => void;
    water: (intensity: number) => void;
    toggleTheme: () => void;
    zoom: (delta: number) => void;
}

const ZenGarden = React.forwardRef<ZenGardenHandle, {}>((props, ref) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isNight, setIsNight] = useState(false);
  
  // Internal refs to be accessed by imperative handle
  const rotationSpeedRef = useRef(0);
  const isWateringRef = useRef(false);
  const activeZoomRef = useRef(0);
  
  // Use a ref to access the internal toggle function from the handle
  const toggleThemeRef = useRef<() => void>(() => {});

  React.useImperativeHandle(ref, () => ({
    setRotationSpeed: (speed: number) => {
        // Map hand position (-1.5 to 1.5 approx) to rotation speed
        rotationSpeedRef.current = speed * 0.05;
    },
    water: (intensity: number) => {
        if (intensity > 0) {
            isWateringRef.current = true;
            // Auto turn off after a bit if no signal
        } else {
            isWateringRef.current = false;
        }
    },
    toggleTheme: () => {
        toggleThemeRef.current();
    },
    zoom: (delta: number) => {
        activeZoomRef.current = delta;
    }
  }));

  useEffect(() => {
    if (!mountRef.current) return;

    // --- SCENE & CAMERA ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xddeeff); // Pastel Day Blue
    scene.fog = new THREE.Fog(0xddeeff, 5, 15);

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 2, 7);
    camera.lookAt(0, 0.5, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    const container = mountRef.current;
    container.appendChild(renderer.domElement);

    // --- LIGHTING ---
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffeedd, 1.2);
    dirLight.position.set(5, 10, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    // --- OBJECTS ---
    const gardenGroup = new THREE.Group();
    scene.add(gardenGroup);

    // 1. The Hexagon Terrarium (Glass)
    const glassGeo = new THREE.CylinderGeometry(2, 2, 2.5, 6);
    const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0,
        roughness: 0.05,
        transmission: 0.9, // Glass transparency
        thickness: 0.5,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
    });
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.y = 1.25;
    gardenGroup.add(glass);

    // 2. The Soil/Base
    const soilGeo = new THREE.CylinderGeometry(1.9, 1.8, 0.4, 6);
    const soilMat = new THREE.MeshStandardMaterial({ color: 0x5d4037 });
    const soil = new THREE.Mesh(soilGeo, soilMat);
    soil.position.y = 0.2;
    soil.receiveShadow = true;
    gardenGroup.add(soil);

    // 3. The Bonsai Tree
    const treeGroup = new THREE.Group();
    gardenGroup.add(treeGroup);

    // Trunk
    const trunkGeo = new THREE.CylinderGeometry(0.1, 0.2, 1.5, 5);
    // Bend the trunk vertexes slightly for "organic" look
    const pos = trunkGeo.attributes.position;
    for(let i=0; i<pos.count; i++){
        if(pos.getY(i) > 0) pos.setX(i, pos.getX(i) + 0.3);
    }
    trunkGeo.computeVertexNormals();
    
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63, flatShading: true });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.set(0, 0.9, 0);
    trunk.castShadow = true;
    treeGroup.add(trunk);

    // Leaves (Clusters of Icosahedrons)
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x98fb98, flatShading: true }); // Pastel Green
    const leaves: THREE.Mesh[] = [];
    
    function createLeafCluster(x: number, y: number, z: number, scale: number) {
        const geo = new THREE.IcosahedronGeometry(0.4, 0);
        const mesh = new THREE.Mesh(geo, leafMat);
        mesh.position.set(x, y, z);
        mesh.scale.setScalar(scale);
        mesh.castShadow = true;
        mesh.userData = { originalScale: scale }; // Store for growth animation
        treeGroup.add(mesh);
        leaves.push(mesh);
    }

    createLeafCluster(0.3, 1.6, 0, 1);
    createLeafCluster(-0.2, 1.4, 0.3, 0.8);
    createLeafCluster(0.1, 1.5, -0.3, 0.7);

    // 4. Stones
    const stoneGeo = new THREE.DodecahedronGeometry(0.2, 0);
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x9e9e9e, flatShading: true });
    const stone1 = new THREE.Mesh(stoneGeo, stoneMat);
    stone1.position.set(-1, 0.5, 0.5);
    stone1.rotation.set(Math.random(), Math.random(), Math.random());
    gardenGroup.add(stone1);
    
    const stone2 = new THREE.Mesh(stoneGeo, stoneMat);
    stone2.scale.set(1.5, 0.8, 1.2);
    stone2.position.set(0.8, 0.5, -0.5);
    gardenGroup.add(stone2);

    // --- PARTICLES (Rain/Fireflies) ---
    const particleCount = 100;
    const particlesGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(particleCount * 3);
    const pSpeed = new Float32Array(particleCount);
    
    for(let i=0; i<particleCount; i++){
        pPos[i*3] = (Math.random() - 0.5) * 3;   // x
        pPos[i*3+1] = Math.random() * 4;         // y
        pPos[i*3+2] = (Math.random() - 0.5) * 3; // z
        pSpeed[i] = 0.05 + Math.random() * 0.05;
    }
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    
    const particlesMat = new THREE.PointsMaterial({
        color: 0xaaccff,
        size: 0.1,
        transparent: true,
        opacity: 0, // Hidden by default
        sizeAttenuation: true
    });
    const particleSystem = new THREE.Points(particlesGeo, particlesMat);
    gardenGroup.add(particleSystem);

    // --- INTERACTION LOGIC ---
    let isDragging = false;
    let dragStartY = 0;
    let mouseX = 0;
    let targetRotationY = 0;
    let growthLevel = 1.0;
    
    // Mutable state for the animation loop to access without closure issues
    const state = {
        isNight: false
    };
    
    // Color Palettes
    const dayColor = new THREE.Color(0xddeeff);
    const nightColor = new THREE.Color(0x1a1025);
    const dayLeaf = new THREE.Color(0x98fb98);
    const nightLeaf = new THREE.Color(0x00ffaa); // Glowing green at night

    const handleMouseMove = (e: MouseEvent) => {
        // Only use mouse if NO hand rotation is active (optional, or mix them)
        // For now, let's allow mouse to override
        mouseX = (e.clientX - window.innerWidth / 2) * 0.001;
        
        if(isDragging) {
            const deltaY = dragStartY - e.clientY;
            if(deltaY > 0) { // Dragging Up
                particlesMat.opacity = Math.min(0.8, deltaY * 0.01);
                growthLevel += 0.01;
            } else {
                particlesMat.opacity = 0;
            }
        }
    };

    const handleMouseDown = (e: MouseEvent) => {
        isDragging = true;
        dragStartY = e.clientY;
    };

    const handleMouseUp = (e: MouseEvent) => {
        // Detect Click vs Drag
        if(isDragging && Math.abs(e.clientY - dragStartY) < 5) {
            toggleTimeOfDay();
        }
        isDragging = false;
        particlesMat.opacity = 0;
    };

    function toggleTimeOfDay() {
        state.isNight = !state.isNight;
        setIsNight(state.isNight); // Sync with React state
    }
    
    // Assign to ref for external access
    toggleThemeRef.current = toggleTimeOfDay;

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    // --- ANIMATION ---
    let animationId: number;
    function animate() {
        animationId = requestAnimationFrame(animate);

        // 1. Smooth Rotation
        // Mix mouse X and hand control
        // If hand rotation speed is set, increment rotation
        if (rotationSpeedRef.current !== 0) {
            gardenGroup.rotation.y += rotationSpeedRef.current;
            // Decay rotation speed slightly if we wanted momentum
        } else {
           // Fallback to mouse targeting
           targetRotationY += (mouseX - targetRotationY) * 0.05;
           // If mouse interaction is idle, maybe don't rotate to mouse? 
           // For now, keeping existing mouse logic active.
           gardenGroup.rotation.y = targetRotationY;
        }

        // 2. Day/Night Transition
        const targetBg = state.isNight ? nightColor : dayColor;
        if (scene.background instanceof THREE.Color) {
            scene.background.lerp(targetBg, 0.05);
        }
        scene.fog?.color.lerp(targetBg, 0.05);
        
        // Leaf Color Transition
        leaves.forEach(leaf => {
            const targetLeaf = state.isNight ? nightLeaf : dayLeaf;
            // @ts-ignore - Material color lerp
            leaf.material.color.lerp(targetLeaf, 0.05);
             // @ts-ignore - Material emissive
            leaf.material.emissive = state.isNight ? new THREE.Color(0x004422) : new THREE.Color(0x000000);
        });

        // 3. Growth Logic (Bouncing Scale)
        
        // Check external watering
        if (isWateringRef.current) {
             growthLevel += 0.01;
             particlesMat.opacity = 0.8;
             // Reset automatically after one frame of "signal" if we want pulse?
             // Or we rely on component calling water(0) to stop.
             // Let's assume water(val) calls stop coming when hand stops moving.
             isWateringRef.current = false; // Auto-reset for single impulse per frame
        }

        leaves.forEach(leaf => {
            // Determine target scale based on Growth Level
            let targetScale = leaf.userData.originalScale * growthLevel;
            // Cap growth
            if(growthLevel > 2.0) growthLevel = 2.0;
            
            // Add a "breathing" effect
            const breath = 1 + Math.sin(Date.now() * 0.002) * 0.05;
            leaf.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale).multiplyScalar(breath), 0.1);
        });

        // 4. Particle Rain / Fireflies
        const positions = particleSystem.geometry.attributes.position.array;
        // @ts-ignore
        const pArray = positions as Float32Array;
        
        // Determine active particle state
        // Mouse dragging OR Night OR External Watering
        const activeParticles = isDragging || state.isNight || particlesMat.opacity > 0.1;

        for(let i=0; i<particleCount; i++){
            if(activeParticles) {
                if(state.isNight && !isDragging && particlesMat.opacity <= 0.1) {
                     // Firefly Only mode (Night, no rain)
                    pArray[i*3+1] += Math.sin(Date.now() * 0.001 + i) * 0.01;
                    particlesMat.color.setHex(0xffff00);
                    particlesMat.opacity = 0.8;
                } else {
                    // Rain motion (fall down) - Covers dragging AND hand watering
                    pArray[i*3+1] -= pSpeed[i] * 2;
                    particlesMat.color.setHex(0xaaccff);
                }

                // Reset height
                if(pArray[i*3+1] < 0) pArray[i*3+1] = 4;
                if(pArray[i*3+1] > 4) pArray[i*3+1] = 0;
            }
        }
        particleSystem.geometry.attributes.position.needsUpdate = true;
        
        // Disable particles if day and not dragging/watering
        if(!state.isNight && !isDragging && !isWateringRef.current && particlesMat.opacity > 0) {
             particlesMat.opacity *= 0.9;
        }
        
        // Zoom Logic
        if (activeZoomRef.current !== 0) {
            // Zoom in = move camera closer (decrease Z)
            // Zoom out = move camera further (increase Z)
            const newZ = camera.position.z - activeZoomRef.current;
            // Clamp between 2 (Close) and 12 (Far)
            camera.position.z = Math.max(2, Math.min(12, newZ));
            
            // Decaying zoom momentum (optional, or just single step)
            activeZoomRef.current = 0; 
        }

        renderer.render(scene, camera);
    }

    animate();

    const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mousedown', handleMouseDown);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(animationId);
        container.removeChild(renderer.domElement);
        
        // Dispose geometries and materials
        glassGeo.dispose();
        glassMat.dispose();
        soilGeo.dispose();
        soilMat.dispose();
        trunkGeo.dispose();
        trunkMat.dispose();
        // @ts-ignore
        leaves.forEach(leaf => leaf.geometry.dispose());
        leafMat.dispose();
        stoneGeo.dispose();
        stoneMat.dispose();
        particlesGeo.dispose();
        particlesMat.dispose();
    };
  }, []);

  return (
    <div className={`relative w-full h-screen ${isNight ? 'bg-black' : ''}`}>
        <div 
            id="ui" 
            className={`absolute bottom-[30px] w-full text-center pointer-events-none transition-colors duration-1000 ${
                isNight ? 'text-[#ccc]' : 'text-[#555]'
            }`}
        >
            <span className={`inline-block px-5 py-2.5 mx-2.5 rounded-[30px] backdrop-blur-[10px] font-semibold text-[0.9rem] shadow-[0_4px_15px_rgba(0,0,0,0.05)] ${
                isNight ? 'bg-[rgba(0,0,0,0.3)]' : 'bg-[rgba(255,255,255,0.5)]'
            }`}>
               👋 / 🖱️ Rotate
            </span>
            <span className={`inline-block px-5 py-2.5 mx-2.5 rounded-[30px] backdrop-blur-[10px] font-semibold text-[0.9rem] shadow-[0_4px_15px_rgba(0,0,0,0.05)] ${
                isNight ? 'bg-[rgba(0,0,0,0.3)]' : 'bg-[rgba(255,255,255,0.5)]'
            }`}>
               🖐 Lift / Drag Up to Water
            </span>
            <span className={`inline-block px-5 py-2.5 mx-2.5 rounded-[30px] backdrop-blur-[10px] font-semibold text-[0.9rem] shadow-[0_4px_15px_rgba(0,0,0,0.05)] ${
                isNight ? 'bg-[rgba(0,0,0,0.3)]' : 'bg-[rgba(255,255,255,0.5)]'
            }`}>
               ✊ Fist / Click for Day/Night
            </span>
             <span className={`inline-block px-5 py-2.5 mx-2.5 rounded-[30px] backdrop-blur-[10px] font-semibold text-[0.9rem] shadow-[0_4px_15px_rgba(0,0,0,0.05)] ${
                isNight ? 'bg-[rgba(0,0,0,0.3)]' : 'bg-[rgba(255,255,255,0.5)]'
            }`}>
               🤏 Pinch to Zoom
            </span>
        </div>
        <div ref={mountRef} className="width-full height-full" />
    </div>
  );
});

ZenGarden.displayName = "ZenGarden";

export default ZenGarden;
