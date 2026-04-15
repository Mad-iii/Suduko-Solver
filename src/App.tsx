import React from 'react';
import { motion } from 'motion/react';
import { LayoutGrid, BrainCircuit, Github, History, FileSearch, ShieldCheck, Activity, HelpCircle, BookOpen } from 'lucide-react';
import SudokuSolver from './components/SudokuSolver';

export default function App() {
  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* Sidebar */}
      <aside className="w-[240px] bg-sidebar-bg text-white flex flex-col py-6 shrink-0">
        <div className="px-6 mb-8 flex items-center gap-2">
          <div className="w-6 h-6 bg-primary rounded-[4px]" />
          <span className="font-bold text-xl tracking-tight">Sudoku AI Solver</span>
        </div>
        
        <nav className="flex-1">
          <div
            className="w-full px-6 py-3 text-sm flex items-center gap-3 transition-all border-l-4 bg-sidebar-hover text-white border-primary"
          >
            <LayoutGrid className="w-4 h-4" />
            Sudoku Solver
          </div>
          
          <div className="mt-4 px-6 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Analysis</div>
          <div className="px-6 py-2 text-sm text-slate-400 flex items-center gap-3 cursor-not-allowed opacity-50">
            <History className="w-4 h-4" />
            Solver History
          </div>
          <div className="px-6 py-2 text-sm text-slate-400 flex items-center gap-3 cursor-not-allowed opacity-50">
            <FileSearch className="w-4 h-4" />
            Log Analyzer
          </div>
          <div className="px-6 py-2 text-sm text-slate-400 flex items-center gap-3 cursor-not-allowed opacity-50">
            <ShieldCheck className="w-4 h-4" />
            Config Auditor
          </div>
          <div className="px-6 py-2 text-sm text-slate-400 flex items-center gap-3 cursor-not-allowed opacity-50">
            <Activity className="w-4 h-4" />
            Network Health
          </div>
        </nav>

        <div className="mt-auto">
          <div className="px-6 py-2 text-sm text-slate-400 flex items-center gap-3 hover:text-white cursor-pointer">
            <HelpCircle className="w-4 h-4" />
            Support
          </div>
          <div className="px-6 py-2 text-sm text-slate-400 flex items-center gap-3 hover:text-white cursor-pointer">
            <BookOpen className="w-4 h-4" />
            Documentation
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-6 gap-6 overflow-hidden">
        <header className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-text-main">
            Active Sudoku Solver
          </h1>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-text-muted">Environment:</span>
              <span className="font-bold">production-v2</span>
            </div>
            <div className="w-8 h-8 bg-slate-300 rounded-full" />
            <span className="font-medium">admin_dev</span>
          </div>
        </header>

        <div className="flex-1 min-h-0 overflow-auto">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="h-full"
          >
            <SudokuSolver />
          </motion.div>
        </div>
      </main>
    </div>
  );
}
