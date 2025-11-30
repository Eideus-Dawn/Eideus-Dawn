# Eideus Dawn RPG Engine

> A Neuro-Symbolic AI Game Master engine that solves "Goldfish Memory" using a 1x3x7 Transform Architecture and Vector Lattice Memory.

## ⚠️ Licensing & Commercial Use

**Eideus Dawn is free for personal, non-profit, and educational use.**

If you wish to use this engine in a commercial product (e.g., a game you sell on Steam, a paid app, or a service), you **must obtain a Commercial License**.

* **Non-Commercial:** Free (PolyForm Noncommercial 1.0.0)
* **Commercial:** Contact me for pricing.

If you make money, I make money. Simple as that.

## 🧠 The Concept

Eideus Dawn imposes a rigid "skeleton" (Symbolic Logic) onto the "flesh" of the LLM (Neural Network). It visualizes the AI's internal state in real-time.

### The 1x3x7 Architecture
* **1 Identity:** The singular focus (The Player).
* **3 Transforms:** Identity, World, and Story (The Pillars).
* **7 Slots:** Each modifier contains exactly 7 active slots to manage context window efficiency.

### Lattice Memory
Unlike standard chat history, Eideus uses a 3D coordinate system (7x7x7 cubes) to store memories as vectors, allowing for spatial clustering of narrative events.

## 🚀 Quick Start

1.  **Clone the repo**
    ```bash
    git clone [https://github.com/Eideus-Dawn/Eideus-Dawn.git](https://github.com/Eideus-Dawn/Eideus-Dawn.git)
    cd Eideus-Dawn
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Setup API Key**
    * Copy `.env.example` to `.env.local`
    * Add your Gemini API Key

4.  **Run Locally**
    ```bash
    npm run dev
    ```

## 🛠 Tech Stack
* **Framework:** React 19 + Vite
* **AI:** Google Gemini 2.5 Flash + Embeddings 004
* **Visualization:** D3.js (Force Directed Graphs)
* **Styling:** Tailwind CSS