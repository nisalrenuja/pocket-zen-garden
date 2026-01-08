# Pocket Zen Garden 🎋

A magical, interactive 3D Zen Garden simulator that you control with your hands. Built with **Next.js**, **Three.js**, and **MediaPipe** for real-time hand tracking.

![Project Status](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

## 🌟 Features

- **Interactive 3D World**: A serene environment with sand, stones, a bonsai tree, and dynamic lighting.
- **Hand Gesture Control**: No mouse or keyboard needed! Use intuitive hand gestures to interact with the garden.
- **Real-time Physics & Visuals**:
    - **Day/Night Cycle**: Control the sun and moon position with your movements.
    - **Dynamic Shadows**: high-quality shadows that respond to the light source.
    - **Raking**: Draw patterns in the sand using your fingers.
- **Webcam Overlay**: See your hand landmarks in real-time for easier control.

## 🎮 Controls

The garden is controlled entirely by your hand movements captured via webcam.

| Gesture | Action | Description |
| :--- | :--- | :--- |
| **Open Hand Tilt** | **Rotate View** | Tilt your open palm left or right to rotate the camera around the garden. |
| **Pinch** (Thumb + Index) | **Levitate Stone** | Pinch over a stone to grab and levitate it. Move your hand to reposition it. |
| **Peace Sign** (✌️) | **Rake Sand** | Extend your index and middle fingers to draw trails in the sand. |
| **Fist (High)** | **Time Control** | Make a fist in the *upper* part of the screen and move horizontally to change the time of day (Day ↔ Night). |
| **Fist (Low)** | **Stop Rotation** | Make a fist in the *lower* part of the screen to lock the garden's rotation. |

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

- `app/page.tsx`: Main entry point rendering the Zen Garden interface.
- `components/ZenGarden.tsx`: Core 3D scene logic using Three.js (Scene, Camera, Lights, Meshes, Raycasting).
- `components/HandGestureController.tsx`: Handles MediaPipe initialization, webcam stream, and gesture recognition logic.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

This project is licensed under the MIT License.
