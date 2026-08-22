export default {
  SUGGESTIONS: [
    'Create a ToDo app in React',
    'Create a budget tracker',
    'Create a gym management dashboard',
    'Create a quiz app on history',
    'Create a login / signup screen',
  ],
  HERO_HEADING: 'What do you want to build?',
  HERO_DESC: 'Prompt, run, edit and deploy full-stack web apps.',
  INPUT_PLACEHOLDER: 'Describe the app you want to build...',
  SIGNIN_HEADING: 'Continue With VIISEVEN',
  SIGNIN_SUBHEADING: 'To use VIISEVEN you must log into an existing account or create one.',
  SIGNIn_AGREEMENT_TEXT: 'By using VIISEVEN, you agree to the collection of usage data for analytics.',

  DEFAULT_FILE: {
    '/public/index.html': {
      code: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VIISEVEN Preview</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
    </style>
  </head>
  <body class="bg-gray-950 text-white antialiased min-h-screen">
    <div id="root"></div>
  </body>
</html>`
    },
    '/index.js': {
      code: `import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import App from "./App";

const root = createRoot(document.getElementById("root"));
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);`
    },
    '/App.js': {
      code: `import React, { useState } from "react";
import { Sparkles, Code, Play } from "lucide-react";
import "./styles.css";

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl text-center">
        <div className="w-14 h-14 bg-blue-600/20 border border-blue-500/30 rounded-2xl flex items-center justify-center mx-auto mb-5 text-blue-400">
          <Sparkles size={28} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">VIISEVEN.AI Ready</h1>
        <p className="text-gray-400 text-sm mb-6 leading-relaxed">
          Type your prompt to generate a full-featured React application.
        </p>
        <button
          onClick={() => setCount(c => c + 1)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-95"
        >
          <Play size={16} /> Interactive Test: {count}
        </button>
      </div>
    </div>
  );
}`
    },
    '/styles.css': {
      code: `@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
}`
    }
  },

  DEPENDANCY: {
    "lucide-react": "^0.469.0",
    "react-router-dom": "^6.28.0",
    "date-fns": "^4.1.0",
    "react-chartjs-2": "^5.3.0",
    "chart.js": "^4.4.7",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.5",
    "canvas-confetti": "^1.9.3"
  },

  PRICING_DESC:'Start with a free account to speed up your workflow on public projects or boost your entire team with instantly-opening production environments.',
  PRICING_OPTIONS:[
    {
      name:'Basic',
      tokens:'50K',
      value:50000,
      desc:'Ideal for hobbyists and casual users for light, exploratory use.',
      price:4.99
    },
    {
      name:'Starter',
      tokens:'120K',
      value:120000,
      desc:'Designed for professionals who need to use VIISEVEN a few times per week.',
      price:9.99
    },
    {
      name:'Pro',
      tokens:'2.5M',
      value:2500000,
      desc:'Designed for professionals who need to use VIISEVEN a few times per week.',
      price:19.99
    },
    {
      name:'Unlimited (License)',
      tokens:'Unlimited',
      value:999999999,
      desc:'Designed for professionals who need to use VIISEVEN a few times per week.',
      price:49.99
    }
  ]
};