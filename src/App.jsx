import { useState } from 'react'
import './App.css'

import Puzzle from "./Puzzle";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Puzzle />
    </div>
  );
}