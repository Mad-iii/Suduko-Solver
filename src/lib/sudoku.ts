import { CSP, Constraint } from '../types';

export function createSudokuCSP(grid: number[][]): CSP {
  const variables: string[] = [];
  const domains: Record<string, number[]> = {};
  const constraints: Constraint[] = [];

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const varName = `R${r}C${c}`;
      variables.push(varName);
      if (grid[r][c] !== 0) {
        domains[varName] = [grid[r][c]];
      } else {
        domains[varName] = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      }
    }
  }

  // Row constraints
  for (let r = 0; r < 9; r++) {
    for (let c1 = 0; c1 < 9; c1++) {
      for (let c2 = c1 + 1; c2 < 9; c2++) {
        constraints.push({
          variables: [`R${r}C${c1}`, `R${r}C${c2}`],
          isSatisfied: (values) => values[`R${r}C${c1}`] !== values[`R${r}C${c2}`]
        });
      }
    }
  }

  // Column constraints
  for (let c = 0; c < 9; c++) {
    for (let r1 = 0; r1 < 9; r1++) {
      for (let r2 = r1 + 1; r2 < 9; r2++) {
        constraints.push({
          variables: [`R${r1}C${c}`, `R${r2}C${c}`],
          isSatisfied: (values) => values[`R${r1}C${c}`] !== values[`R${r2}C${c}`]
        });
      }
    }
  }

  // Box constraints
  for (let br = 0; br < 3; br++) {
    for (let bc = 0; bc < 3; bc++) {
      const boxVars: string[] = [];
      for (let r = br * 3; r < br * 3 + 3; r++) {
        for (let c = bc * 3; c < bc * 3 + 3; c++) {
          boxVars.push(`R${r}C${c}`);
        }
      }
      for (let i = 0; i < boxVars.length; i++) {
        for (let j = i + 1; j < boxVars.length; j++) {
          constraints.push({
            variables: [boxVars[i], boxVars[j]],
            isSatisfied: (values) => values[boxVars[i]] !== values[boxVars[j]]
          });
        }
      }
    }
  }

  return { variables, domains, constraints };
}

export function gridToAssignment(grid: number[][]): Record<string, number> {
  const assignment: Record<string, number> = {};
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] !== 0) {
        assignment[`R${r}C${c}`] = grid[r][c];
      }
    }
  }
  return assignment;
}

export function assignmentToGrid(assignment: Record<string, number>): number[][] {
  const grid: number[][] = Array.from({ length: 9 }, () => Array(9).fill(0));
  for (const key in assignment) {
    const r = parseInt(key[1]);
    const c = parseInt(key[3]);
    grid[r][c] = assignment[key];
  }
  return grid;
}
