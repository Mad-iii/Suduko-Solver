import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Play, RotateCcw, Brain, BarChart3, CheckCircle, AlertCircle, Upload, FileText, X } from 'lucide-react';
import { BOARDS } from '../constants/boards';
import { createSudokuCSP, assignmentToGrid } from '../lib/sudoku';
import { CSPSolver } from '../lib/csp';
import { SolverStats } from '../types';

const SudokuSolver: React.FC = () => {
  const [selectedBoard, setSelectedBoard] = useState<keyof typeof BOARDS | 'custom'>('easy');
  const [grid, setGrid] = useState<number[][]>(BOARDS.easy);
  const [isSolving, setIsSolving] = useState(false);
  const [stats, setStats] = useState<SolverStats | null>(null);
  const [solved, setSolved] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [showInputModal, setShowInputModal] = useState(false);
  const [rawInput, setRawInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedBoard !== 'custom') {
      setGrid(BOARDS[selectedBoard]);
      setSolved(false);
      setStats(null);
      setLogs([`[INFO] Loaded ${selectedBoard} board configuration.`]);
    }
  }, [selectedBoard]);

  const parseBoardText = (text: string) => {
    const lines = text.trim().split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length !== 9) {
      throw new Error('File must contain exactly 9 lines.');
    }
    const newGrid: number[][] = [];
    for (let i = 0; i < 9; i++) {
      if (lines[i].length !== 9) {
        throw new Error(`Line ${i + 1} must contain exactly 9 digits.`);
      }
      const row = lines[i].split('').map(char => {
        const num = parseInt(char, 10);
        if (isNaN(num) || num < 0 || num > 9) {
          throw new Error(`Invalid character "${char}" at line ${i + 1}.`);
        }
        return num;
      });
      newGrid.push(row);
    }
    return newGrid;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const newGrid = parseBoardText(content);
        setGrid(newGrid);
        setSelectedBoard('custom');
        setSolved(false);
        setStats(null);
        setLogs([`[INFO] Successfully loaded board from ${file.name}.`]);
      } catch (err) {
        setLogs(prev => [...prev, `[ERROR] ${err instanceof Error ? err.message : 'Failed to parse file.'}`]);
      }
    };
    reader.readAsText(file);
  };

  const handleManualSubmit = () => {
    try {
      const newGrid = parseBoardText(rawInput);
      setGrid(newGrid);
      setSelectedBoard('custom');
      setSolved(false);
      setStats(null);
      setShowInputModal(false);
      setLogs([`[INFO] Successfully loaded manually entered board.`]);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Invalid format.');
    }
  };

  const handleSolve = async () => {
    setIsSolving(true);
    setSolved(false);
    setLogs(prev => [...prev, `[INFO] Initializing CSP solver...`]);
    
    await new Promise(resolve => setTimeout(resolve, 100));

    const solver = new CSPSolver();
    const csp = createSudokuCSP(grid);
    
    setLogs(prev => [...prev, `[INFO] Running AC-3 for arc consistency...`]);
    const domains = { ...csp.domains };
    const ac3Result = solver.ac3(csp, domains);
    
    if (!ac3Result) {
      setLogs(prev => [...prev, `[ERROR] AC-3 detected an inconsistency. No solution possible.`]);
      setIsSolving(false);
      return;
    }

    setLogs(prev => [...prev, `[INFO] Starting backtracking search with Forward Checking...`]);
    
    const result = await new Promise<Record<string, number> | null>(resolve => {
      setTimeout(() => {
        resolve(solver.solve(csp, domains));
      }, 0);
    });
    
    if (result) {
      setGrid(assignmentToGrid(result));
      setSolved(true);
      setLogs(prev => [...prev, `[SUCCESS] Solution found! Assignment complete.`]);
    } else {
      setLogs(prev => [...prev, `[ERROR] No valid solution exists for this configuration.`]);
    }
    setStats(solver.getStats());
    setIsSolving(false);
  };

  const handleReset = () => {
    if (selectedBoard === 'custom') {
      setLogs([`[INFO] Custom board reset. (Note: Custom boards revert to last loaded state)`]);
    } else {
      setGrid(BOARDS[selectedBoard]);
      setLogs([`[INFO] Solver reset to initial state.`]);
    }
    setSolved(false);
    setStats(null);
  };

  return (
    <div className="flex flex-col gap-6 h-full relative">
      {/* Input Modal */}
      {showInputModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200"
          >
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Manual Board Input
              </h3>
              <button onClick={() => setShowInputModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-xs text-slate-500 mb-4">
                Paste 9 lines of 9 digits each. Use <code className="bg-slate-100 px-1 rounded text-primary">0</code> for empty cells.
              </p>
              <textarea
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                placeholder={"004030050\n609400000\n..."}
                className="w-full h-48 p-4 font-mono text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
              />
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowInputModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-bold text-xs hover:bg-slate-50 transition-all"
                >
                  CANCEL
                </button>
                <button
                  onClick={handleManualSubmit}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-bold text-xs hover:bg-blue-700 transition-all shadow-md"
                >
                  LOAD BOARD
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Stats Bar */}
      <div className="flex gap-4">
        <div className="bg-white p-4 rounded-lg border border-border-theme flex-1 shadow-sm">
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Source</p>
          <p className="text-lg font-bold text-text-main">{selectedBoard === 'custom' ? 'CUSTOM FILE' : selectedBoard.toUpperCase()}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-border-theme flex-1 shadow-sm">
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Status</p>
          <p className={`text-lg font-bold ${solved ? 'text-success-theme' : isSolving ? 'text-warning-theme' : 'text-text-main'}`}>
            {solved ? 'SOLVED' : isSolving ? 'SOLVING...' : 'READY'}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-border-theme flex-1 shadow-sm">
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Backtracks</p>
          <p className="text-lg font-bold text-text-main font-mono">{stats?.backtrackCount ?? 0}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-border-theme flex-1 shadow-sm">
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Failures</p>
          <p className="text-lg font-bold text-error-theme font-mono">{stats?.failureCount ?? 0}</p>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Left: Grid & Controls */}
        <div className="lg:col-span-2 flex flex-col gap-6 min-h-0">
          <section className="bg-card-bg border border-border-theme rounded-lg overflow-hidden flex flex-col flex-1">
            <div className="px-5 py-4 border-b border-border-theme bg-white font-semibold text-sm flex justify-between items-center">
              <div className="flex items-center gap-4">
                <span>Sudoku Matrix</span>
                <div className="h-4 w-[1px] bg-slate-200" />
                <div className="flex gap-2">
                  {(Object.keys(BOARDS) as Array<keyof typeof BOARDS>).map((key) => (
                    <button
                      key={key}
                      onClick={() => setSelectedBoard(key)}
                      className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${
                        selectedBoard === key
                          ? 'bg-primary text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {key.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".txt"
                  className="hidden"
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold hover:bg-slate-200 transition-all border border-slate-200"
                >
                  <Upload className="w-3 h-3" />
                  UPLOAD .TXT
                </button>
                <button 
                  onClick={() => setShowInputModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold hover:bg-slate-200 transition-all border border-slate-200"
                >
                  <FileText className="w-3 h-3" />
                  MANUAL INPUT
                </button>
              </div>
            </div>
            <div className="p-8 flex-1 flex items-center justify-center bg-slate-50/50">
              <div className="bg-slate-900 p-1 rounded-lg shadow-xl border-2 border-slate-800">
                <div className="grid grid-cols-9 bg-slate-800 gap-[1px]">
                  {grid.map((row, r) =>
                    row.map((cell, c) => {
                      const isInitial = selectedBoard !== 'custom' ? BOARDS[selectedBoard][r][c] !== 0 : cell !== 0;
                      const borderRight = (c + 1) % 3 === 0 && c !== 8 ? 'border-r-2 border-slate-600' : '';
                      const borderBottom = (r + 1) % 3 === 0 && r !== 8 ? 'border-b-2 border-slate-600' : '';
                      
                      return (
                        <div
                          key={`${r}-${c}`}
                          className={`w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center bg-white text-base font-bold transition-all ${borderRight} ${borderBottom} ${
                            isInitial ? 'text-slate-900' : 'text-primary bg-blue-50/30'
                          }`}
                        >
                          {cell !== 0 ? cell : ''}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-border-theme bg-white flex gap-3">
              <button
                onClick={handleSolve}
                disabled={isSolving || solved}
                className="flex-1 bg-primary text-white py-2.5 rounded-md font-bold text-xs flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                {isSolving ? 'SOLVING...' : 'AUTO-APPLY SOLVER'}
              </button>
              <button
                onClick={handleReset}
                className="px-4 bg-white border border-border-theme text-text-main py-2.5 rounded-md font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                RESET
              </button>
            </div>
          </section>
        </div>

        {/* Right: Logs & AI Diagnosis */}
        <div className="flex flex-col gap-6 min-h-0">
          <section className="bg-card-bg border border-border-theme rounded-lg overflow-hidden flex flex-col h-1/2">
            <div className="px-5 py-4 border-b border-border-theme bg-white font-semibold text-sm flex justify-between items-center">
              <span>Real-time Solver Logs</span>
              <span className="text-warning-theme text-[10px] font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-warning-theme rounded-full animate-pulse" />
                STREAMING
              </span>
            </div>
            <div className="bg-code-bg p-4 flex-1 font-mono text-[11px] overflow-auto text-slate-300 leading-relaxed">
              {logs.map((log, i) => (
                <div key={i} className="mb-1">
                  <span className="text-slate-500 mr-2">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
                  <span className={
                    log.includes('SUCCESS') ? 'text-success-theme' : 
                    log.includes('ERROR') ? 'text-error-theme' : 
                    log.includes('INFO') ? 'text-blue-400' : ''
                  }>
                    {log}
                  </span>
                </div>
              ))}
              <div className="mt-2 border-t border-slate-800 pt-2 text-slate-500 italic">
                Waiting for next operation...
              </div>
            </div>
          </section>

          <section className="bg-card-bg border border-border-theme rounded-lg overflow-hidden flex flex-col h-1/2">
            <div className="px-5 py-4 border-b border-border-theme bg-white font-semibold text-sm">
              AI Diagnosis & Heuristics
            </div>
            <div className="p-5 flex flex-col gap-4 flex-1 overflow-auto">
              <div className="p-3 bg-blue-50 border-l-4 border-primary rounded-r">
                <p className="text-[11px] font-bold text-blue-900 mb-1">MRV Heuristic Active</p>
                <p className="text-[10px] text-blue-800">Prioritizing cells with minimum remaining values to minimize branching factor.</p>
              </div>
              <div className="p-3 bg-emerald-50 border-l-4 border-success-theme rounded-r">
                <p className="text-[11px] font-bold text-emerald-900 mb-1">Arc Consistency (AC-3)</p>
                <p className="text-[10px] text-emerald-800">Pre-processing active. Pruning domains before search phase.</p>
              </div>
              <div className="mt-auto pt-4 border-t border-border-theme">
                <p className="text-[10px] text-text-muted mb-2 font-bold uppercase tracking-wider">Suggested Strategy</p>
                <div className="bg-slate-100 p-3 rounded font-mono text-[10px] text-slate-700 mb-4">
                  backtrack(assignment, domains, csp)
                </div>
                <button className="w-full bg-primary text-white py-2 rounded font-bold text-[10px] hover:bg-blue-700 transition-all">
                  VIEW FULL TRACE
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default SudokuSolver;
