# Pocket Garden 🎋

A magical, interactive 3D Pocket Garden simulator that you control with your hands. Built with **Next.js**, **Three.js**, and **MediaPipe** for real-time hand tracking.

![Project Status](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

## 🌟 Features

- **Interactive 3D World**: A serene environment with sand, stones, a bonsai tree, and dynamic lighting.
- **Hand Gesture Control**: No mouse or keyboard needed! Use intuitive hand gestures to interact with the garden.
- **3D Hand Cursor**: Visual feedback showing your hand position in 3D space for precise interaction.
- **Gesture Debug Display**: Real-time visualization of detected gestures and hand landmarks for easier control.
- **Real-time Physics & Visuals**:
    - **Day/Night Cycle**: Control the sun and moon position with your movements.
    - **Dynamic Shadows**: high-quality shadows that respond to the light source.
    - **Animated Stone Dropping**: Smooth physics-based stone placement with realistic dropping animations.
    - **Raking**: Draw patterns in the sand using your fingers.
- **Audio Feedback**: Immersive sound effects that respond to your gestures (Grabbing, Time Control, Raking).
- **Webcam Overlay**: See your hand landmarks in real-time for easier control.

## 🎮 Controls

The garden is controlled entirely by your hand movements captured via webcam.

| Gesture | Action | Description |
| :--- | :--- | :--- |
| **Open Hand Tilt** | **Rotate View** | Tilt your open palm left or right to rotate the camera around the garden. |
| **Pinch** (Thumb + Index) | **Levitate Stone** | Pinch over a stone to grab and levitate it. Move your hand to reposition it. **(Sound: Pop/Release)** |
| **Peace Sign** (✌️) | **Rake Sand** | Extend your index and middle fingers to draw trails in the sand. **(Sound: White Noise)** |
| **Fist (High)** | **Time Control** | Make a fist in the *upper* part of the screen and move horizontally to change the time of day (Day ↔ Night). **(Sound: Magic Hum)** |
| **Fist (Low)** | **Stop Rotation** | Make a fist in the *lower* part of the screen to lock the garden's rotation. **(Sound: Magic Hum)** |

## 🛠️ Tech Stack

- **[Next.js 16](https://nextjs.org/)**: React framework for the web.
- **[Three.js](https://threejs.org/)** (@types/three): For 3D graphics and rendering.
- **[MediaPipe Tasks Vision](https://developers.google.com/mediapipe/solutions/vision/hand_landmarker)**: For high-performance, real-time hand tracking and landmark detection.
- **[Tailwind CSS](https://tailwindcss.com/)**: For UI styling and layout.
- **TypeScript**: For type-safe code.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or later recommended)
- A webcam

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/nisalrenuja/pocket-zen-garden.git
    cd pocket-zen-garden
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```

4.  **Open the application:**
    Open [http://localhost:3000](http://localhost:3000) in your browser. Allow webcam access when prompted.

## 📁 Project Structure

```
pocket-zen-garden/
├── app/                        # Next.js app directory
│   ├── layout.tsx             # Root layout with metadata
│   └── page.tsx               # Main entry point
├── components/                 # React components
│   ├── ErrorBoundary.tsx      # Error handling boundary
│   ├── HandGestureController.tsx  # MediaPipe hand tracking
│   └── PocketGarden.tsx          # Three.js 3D scene orchestration
├── constants/                  # Configuration constants
│   ├── gestures.ts            # Hand gesture thresholds
│   ├── mediapipe.ts           # MediaPipe configuration
│   ├── scene.ts               # Three.js scene constants
│   └── index.ts               # Barrel exports
├── hooks/                      # Custom React hooks
│   ├── useGardenRotation.ts   # Garden rotation logic
│   ├── useSandRaking.ts       # Sand trail rendering
│   ├── useStoneLevitation.ts  # Stone grab/levitation
│   ├── useThrottledCallback.ts # Performance throttling
│   ├── useTimeControl.ts      # Day/night cycle control
│   └── index.ts               # Barrel exports
├── lib/                        # Utility libraries
│   ├── mediapipe/
│   │   ├── gesture-detection.ts   # Gesture recognition logic
│   │   └── index.ts
│   └── three/
│       ├── day-night.ts           # Day/night cycle rendering
│       ├── garden-objects.ts      # 3D object creation
│       ├── raycasting.ts          # Ray-object intersection
│       ├── scene-setup.ts         # Scene initialization
│       └── index.ts               # Barrel exports
├── types/                      # TypeScript type definitions
│   └── index.ts               # Shared interfaces
└── public/                     # Static assets
    └── sounds/                 # Audio files for gesture feedback
```

## 🏗️ Architecture

### Design Principles
- **Separation of Concerns**: Components, logic, and configuration are isolated into dedicated directories
- **Type Safety**: Full TypeScript coverage with explicit interfaces
- **Named Constants**: All magic numbers extracted to semantic constants
- **Reusability**: Shared logic in hooks and lib utilities
- **Single Responsibility**: Each file has one clear, focused purpose

### Component Flow

```
User Hand Gesture
      ↓
[HandGestureController] ← MediaPipe SDK
      ↓
  HandFrame data
      ↓
   [page.tsx] ← ErrorBoundary
      ↓
 [PocketGarden] ← Three.js Scene
      ↓
  ┌────────────────────┐
  │   Custom Hooks     │
  ├────────────────────┤
  │ useGardenRotation  │
  │ useStoneLevitation │
  │ useSandRaking      │
  │ useTimeControl     │
  │ useAudioFeedback   │
  └────────────────────┘
      ↓
  ┌────────────────────┐
  │   Lib Utilities    │
  ├────────────────────┤
  │ scene-setup        │
  │ garden-objects     │
  │ raycasting         │
  │ day-night          │
  │ gesture-detection  │
  └────────────────────┘
      ↓
  Three.js Rendering
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Adding New Features

When adding new features, follow the project's architecture:

1. **Constants**: Add configuration to `constants/` (e.g., thresholds, colors, positions)
2. **Types**: Define interfaces in `types/index.ts` for new data structures
3. **Logic**: Create utilities in `lib/` or hooks in `hooks/` for reusable logic
4. **Components**: Compose using existing utilities and hooks

### Development Guidelines

- Keep components focused on composition, not logic
- Extract all magic numbers to named constants
- Use TypeScript for type safety - avoid `any` types
- Add error handling for user-facing operations
- Test all gestures after making changes

### Pull Request Process

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Ensure `npm run build` succeeds with no errors
5.  Push to the Branch (`git push origin feature/AmazingFeature`)
6.  Open a Pull Request

## 📄 License

This project is licensed under the MIT License.
