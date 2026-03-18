import { useState, useEffect, useCallback } from 'react';

/**
 * Hook para integração com a balança via Electron IPC.
 * Inclui modo simulado para desenvolvimento no navegador.
 */
export function useScale() {
  const [weight, setWeight] = useState<number>(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    // Verifica se estamos no Electron
    const isElectronEnv = !!(window as any).require && !!(window as any).require('electron');
    setIsElectron(isElectronEnv);

    if (isElectronEnv) {
      const { ipcRenderer } = (window as any).require('electron');

      // Listener para o peso vindo do processo principal
      const handleWeight = (_event: any, newWeight: number) => {
        setWeight(newWeight);
      };

      ipcRenderer.on('scale-weight', handleWeight);
      setIsConnected(true);

      return () => {
        ipcRenderer.removeListener('scale-weight', handleWeight);
      };
    }
  }, []);

  // Função para conectar em uma porta específica (apenas Electron)
  const connect = useCallback(async (portPath: string, baudRate: number = 9600) => {
    if (!isElectron) {
      console.warn('[Scale] Tentativa de conexão fora do Electron.');
      return { success: false, error: 'Ambiente não suportado' };
    }

    const { ipcRenderer } = (window as any).require('electron');
    const result = await ipcRenderer.invoke('connect-scale', portPath, baudRate);
    
    if (result.success) {
      setIsConnected(true);
    }
    
    return result;
  }, [isElectron]);

  // Função para listar portas disponíveis (apenas Electron)
  const listPorts = useCallback(async () => {
    if (!isElectron) return [];
    const { ipcRenderer } = (window as any).require('electron');
    return await ipcRenderer.invoke('list-ports');
  }, [isElectron]);

  // Simulação manual para testes no navegador
  const simulateWeight = (val: number) => {
    if (!isElectron) {
      setWeight(val);
    }
  };

  return {
    weight,
    isConnected,
    isElectron,
    connect,
    listPorts,
    simulateWeight
  };
}
