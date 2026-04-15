export type Domain = number[];

export interface Constraint {
  variables: string[];
  isSatisfied: (values: Record<string, number>) => boolean;
}

export interface CSP {
  variables: string[];
  domains: Record<string, Domain>;
  constraints: Constraint[];
}

export interface SolverStats {
  backtrackCount: number;
  failureCount: number;
}
