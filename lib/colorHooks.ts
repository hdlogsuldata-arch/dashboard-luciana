// Hook de resolução de cores — versão simplificada para HDLOG
// Sem dependência de localStorage (diferente do dash-mkt)
// Usa cores semânticas fixas + paleta HDLOG por fallback

import { useMemo } from "react";
import { resolveColor } from "./colors";

export function useColorResolver() {
  const getColor = useMemo(() => {
    return function getColor(name: string, index: number): string {
      return resolveColor(name, index);
    };
  }, []);

  return { getColor };
}
