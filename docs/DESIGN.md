# Design System

This document outlines the visual identity and design principles of the Black Sheep platform.

## Aesthetic: Neural Glassmorphism

Black Sheep uses a "Neural Glassmorphism" aesthetic, characterized by:
- **Dark Backgrounds**: Deep blacks and neutral grays (`bg-neutral-950`).
- **Emerald Accents**: Vibrant emerald green (`text-emerald-500`) used for primary actions, branding, and status indicators.
- **Translucent Layers**: High blur backgrounds (`backdrop-blur-2xl`) and subtle borders (`border-white/5`).
- **Rounded Corners**: Generous border-radii (`rounded-[2rem]`, `rounded-[3rem]`) for a premium, organic feel.

## Visual Language

- **Mascot (Baara)**: The emotional guide of the platform. Baara pops out from the UI to provide check-ins, advice, and feedback.
- **Typography**: 
  - Headlines: Black, italic, uppercase, tracking-tighter for a bold, technical look.
  - Body: Medium-weight sans-serif for readability.
- **Animations**: 
  - Framer Motion is used for layout transitions, card entries, and Baara's interactions.
  - Micro-interactions (hover scales, pulse effects) provide feedback on user actions.

## Component Library

- **Cards**: Glassmorphic containers with subtle inner shadows and external glow effects.
- **Inputs**: Dark, themed fields with emerald focus states.
- **Buttons**: Two primary styles:
  - **Emerald Primary**: High visibility, bold.
  - **Ghost/Outline**: Subtle, used for secondary actions.
