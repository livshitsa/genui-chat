# Dynamic React JSX Chat App

A real-time chat application that generates and renders React components using Google's Gemini AI.

## Features

- **Natural Language UI Generation**: Ask for any UI component (e.g., "A login form", "A weather dashboard") and get a live, interactive React component in response.
- **Split-Screen Canvas**: A dedicated "Canvas" panel on the right displays the generated component, while the chat history remains on the left.
- **Rich UI/UX**: The AI is instructed to generate modern, beautiful, and responsive designs using Tailwind CSS, including gradients, shadows, and interactivity.
- **Safe Dynamic Rendering**: Uses an iframe with Babel standalone to securely render generated JSX code.
- **Responsive & Scrollable**: The Canvas handles tall content with automatic scrolling.

## Tech Stack

- **Frontend**: Vite, React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express
- **AI**: Google Gemini API (`gemini-2.0-flash`)

## Prerequisites

- Node.js (v18 or higher)
- Google Gemini API Key

## Setup

1.  **Clone the repository** (if applicable).
2.  **Backend Setup**:
    ```bash
    cd server
    npm install
    # Create a .env file in the root or server directory with:
    # GEMINI_API_KEY=your_api_key_here
    ```
3.  **Frontend Setup**:
    ```bash
    cd client
    npm install
    ```

## Running the App

1.  **Start the Backend**:
    ```bash
    cd server
    npm run dev
    ```
    The server will run on `http://localhost:3000`.

2.  **Start the Frontend**:
    ```bash
    cd client
    npm run dev
    ```
    The client will run on `http://localhost:5173`.

3.  **Open Browser**: Navigate to `http://localhost:5173`.

## Usage

1.  Type a prompt in the chat input, e.g., "Design a pricing table for a SaaS product."
2.  The AI will generate the code, and the component will appear in the Canvas on the right.
3.  You can ask for modifications or new components in subsequent messages.
