export const FUNCOES = [
  "Administrador",
  "Gerente",
  "Analista",
  "Operador",
  "Visualizador",
] as const;

export type Funcao = (typeof FUNCOES)[number];

export const FUNCAO_TO_ROLE: Record<Funcao, string> = {
  Administrador: "ADMIN",
  Gerente:       "MANAGER",
  Analista:      "ANALYST",
  Operador:      "OPERATOR",
  Visualizador:  "VIEWER",
};

export const ROLE_TO_FUNCAO: Record<string, Funcao> = {
  ADMIN:    "Administrador",
  MANAGER:  "Gerente",
  ANALYST:  "Analista",
  OPERATOR: "Operador",
  VIEWER:   "Visualizador",
};
