import { CSP, SolverStats, Constraint } from '../types';

export class CSPSolver {
  private stats: SolverStats = { backtrackCount: 0, failureCount: 0 };
  private constraintMap: Record<string, Constraint[]> = {};

  getStats(): SolverStats {
    return { ...this.stats };
  }

  resetStats() {
    this.stats = { backtrackCount: 0, failureCount: 0 };
  }

  private initConstraintMap(csp: CSP) {
    this.constraintMap = {};
    for (const v of csp.variables) {
      this.constraintMap[v] = [];
    }
    for (const constraint of csp.constraints) {
      for (const v of constraint.variables) {
        this.constraintMap[v].push(constraint);
      }
    }
  }

  /**
   * AC-3 Algorithm for Arc Consistency
   */
  ac3(csp: CSP, domains: Record<string, number[]>): boolean {
    this.initConstraintMap(csp);
    const queue: [string, string][] = [];
    
    // Initial queue with all arcs
    for (const constraint of csp.constraints) {
      if (constraint.variables.length === 2) {
        const [u, v] = constraint.variables;
        queue.push([u, v]);
        queue.push([v, u]);
      }
    }

    while (queue.length > 0) {
      const [xi, xj] = queue.shift()!;
      if (this.revise(csp, domains, xi, xj)) {
        if (domains[xi].length === 0) return false;
        
        // Add neighbors to queue
        for (const constraint of this.constraintMap[xi]) {
          if (constraint.variables.length === 2) {
            const xk = constraint.variables.find(v => v !== xi)!;
            if (xk !== xj) {
              queue.push([xk, xi]);
            }
          }
        }
      }
    }
    return true;
  }

  private revise(csp: CSP, domains: Record<string, number[]>, xi: string, xj: string): boolean {
    let revised = false;
    const domainXi = [...domains[xi]];
    
    // Find constraints between xi and xj
    const relevantConstraints = this.constraintMap[xi].filter(c => 
      c.variables.length === 2 && c.variables.includes(xj)
    );

    for (const x of domainXi) {
      const hasSupport = domains[xj].some(y => {
        return relevantConstraints.every(c => c.isSatisfied({ [xi]: x, [xj]: y }));
      });

      if (!hasSupport) {
        domains[xi] = domains[xi].filter(val => val !== x);
        revised = true;
      }
    }
    return revised;
  }

  /**
   * Backtracking Search with Forward Checking
   */
  solve(csp: CSP, domains: Record<string, number[]> = { ...csp.domains }): Record<string, number> | null {
    this.resetStats();
    this.initConstraintMap(csp);
    
    // Initial assignment from domains with size 1
    const assignment: Record<string, number> = {};
    for (const v of csp.variables) {
      if (domains[v].length === 1) {
        assignment[v] = domains[v][0];
      }
    }

    return this.backtrack(assignment, domains, csp);
  }

  private backtrack(
    assignment: Record<string, number>,
    domains: Record<string, number[]>,
    csp: CSP
  ): Record<string, number> | null {
    if (Object.keys(assignment).length === csp.variables.length) {
      return assignment;
    }

    this.stats.backtrackCount++;
    const varName = this.selectUnassignedVariable(assignment, csp, domains);
    const values = this.orderDomainValues(varName, assignment, domains);

    for (const value of values) {
      if (this.isConsistent(varName, value, assignment, csp)) {
        const newAssignment = { ...assignment, [varName]: value };
        const newDomains = this.forwardCheck(varName, value, domains, csp);

        if (newDomains) {
          const result = this.backtrack(newAssignment, newDomains, csp);
          if (result) return result;
        }
      }
    }

    this.stats.failureCount++;
    return null;
  }

  private selectUnassignedVariable(
    assignment: Record<string, number>,
    csp: CSP,
    domains: Record<string, number[]>
  ): string {
    const unassigned = csp.variables.filter(v => !(v in assignment));
    // MRV + Degree Heuristic (tie breaker)
    return unassigned.reduce((a, b) => {
      if (domains[a].length < domains[b].length) return a;
      if (domains[a].length > domains[b].length) return b;
      return this.constraintMap[a].length > this.constraintMap[b].length ? a : b;
    });
  }

  private orderDomainValues(varName: string, assignment: Record<string, number>, domains: Record<string, number[]>): number[] {
    return domains[varName];
  }

  private isConsistent(varName: string, value: number, assignment: Record<string, number>, csp: CSP): boolean {
    const newAssignment = { ...assignment, [varName]: value };
    // Only check constraints involving varName
    return this.constraintMap[varName].every(c => {
      if (c.variables.every(v => v in newAssignment)) {
        return c.isSatisfied(newAssignment);
      }
      return true;
    });
  }

  private forwardCheck(
    varName: string,
    value: number,
    domains: Record<string, number[]>,
    csp: CSP
  ): Record<string, number[]> | null {
    const newDomains: Record<string, number[]> = {};
    for (const v in domains) {
      newDomains[v] = [...domains[v]];
    }
    newDomains[varName] = [value];

    // Only check neighbors of varName
    for (const constraint of this.constraintMap[varName]) {
      if (constraint.variables.length === 2) {
        const otherVar = constraint.variables.find(v => v !== varName)!;
        // Only prune unassigned variables
        if (newDomains[otherVar].length > 1) {
          newDomains[otherVar] = newDomains[otherVar].filter(val => {
            return constraint.isSatisfied({ [varName]: value, [otherVar]: val });
          });
          if (newDomains[otherVar].length === 0) return null;
        }
      }
    }
    return newDomains;
  }
}
