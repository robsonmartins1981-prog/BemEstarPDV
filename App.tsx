
import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { db, initDB } from './services/databaseService';
import type { CashSession } from './types';
import POSScreen from './components/pos/POSScreen';
import CloseCashScreen from './components/cash/CloseCashScreen';
import ERPScreen from './components/erp/ERPScreen';
import CRMScreen from './components/crm/CRMScreen';
import FiscalScreen from './components/fiscal/FiscalScreen'; // Importado da nova localização
import Sidebar from './components/shared/Sidebar';
import { startSyncService } from './services/syncService'; // Importa o serviço de sincronização

// --- THEME MANAGEMENT ---
type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) || 'system';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const currentTheme = theme === 'system' ? systemTheme : theme;

    root.classList.remove('light', 'dark');
    root.classList.add(currentTheme);
    localStorage.setItem('theme', theme);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        const newSystemTheme = mediaQuery.matches ? 'dark' : 'light';
        root.classList.remove('light', 'dark');
        root.classList.add(newSystemTheme);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};


// Contexto para compartilhar o estado da sessão de caixa com componentes filhos.
// Isso evita passar props por múltiplos níveis (prop drilling).
export const CashSessionContext = React.createContext<{
  session: CashSession | null;
  setSession: React.Dispatch<React.SetStateAction<CashSession | null>>;
  showCloseScreen: boolean;
  setShowCloseScreen: React.Dispatch<React.SetStateAction<boolean>>;
  handleOpenSession: (initialAmount: number) => Promise<void>;
}>({
  session: null,
  setSession: () => {},
  showCloseScreen: false,
  setShowCloseScreen: () => {},
  handleOpenSession: async () => {},
});


// Componente principal da aplicação (App).
// Gerencia o estado global, como a sessão de caixa ativa, e decide qual tela renderizar.
function AppContent() {
  // Estado para armazenar a sessão de caixa ativa. Se for null, significa que nenhum caixa está aberto.
  const [session, setSession] = useState<CashSession | null>(null);
  // Estado para controlar a exibição da tela de fechamento de caixa.
  const [showCloseScreen, setShowCloseScreen] = useState<boolean>(false);
  // Estado para verificar se o banco de dados local (IndexedDB) está inicializado.
  const [dbReady, setDbReady] = useState<boolean>(false);
  // Estado para controlar a visualização entre PDV, ERP, CRM e Fiscal.
  const [view, setView] = useState<'pos' | 'erp' | 'crm' | 'fiscal'>('pos');

  // useEffect para inicializar o banco de dados e verificar se existe uma sessão de caixa aberta.
  // Roda apenas uma vez quando o componente é montado.
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initDB(); // Garante que o DB e as tabelas (object stores) estão criados.
        startSyncService(); // Inicia o serviço de sincronização em background.
        
        // Procura por uma sessão de caixa que não foi fechada.
        const activeSession = await db.get('cashSessions', 'active');
        if (activeSession) {
          setSession(activeSession);
        }
        setDbReady(true); // Marca o DB como pronto.
      } catch (error) {
        console.error("Erro ao inicializar a aplicação:", error);
        // Em um app real, aqui poderia ser exibida uma mensagem de erro para o usuário.
      }
    };

    initializeApp();
  }, []);

  // Função para lidar com a abertura de uma nova sessão de caixa.
  const handleOpenSession = useCallback(async (initialAmount: number) => {
    // Cria um novo objeto de sessão.
    const newSession: CashSession = {
      id: 'active', // Usamos um ID fixo para encontrar facilmente a sessão ativa.
      startDate: new Date(),
      initialAmount,
      transactions: [{ type: 'SUPRIMENTO', amount: initialAmount, date: new Date(), description: 'Abertura de Caixa' }],
      sales: [],
      status: 'OPEN',
    };
    // Salva a nova sessão no banco de dados local.
    await db.put('cashSessions', newSession);
    // Atualiza o estado da aplicação para refletir a nova sessão.
    setSession(newSession);
  }, []);

  // Função para lidar com o fechamento da sessão de caixa.
  const handleCloseSession = useCallback(async () => {
    if (!session) return; // Não faz nada se não houver sessão.

    // Cria um objeto de sessão finalizada.
    const closedSession: CashSession = {
      ...session,
      endDate: new Date(),
      status: 'CLOSED',
    };

    // Deleta a sessão ativa do índice 'active'.
    await db.delete('cashSessions', 'active');
    // Adiciona a sessão fechada com um ID baseado em timestamp para histórico.
    await db.put('cashSessions', closedSession, `closed-${closedSession.startDate.getTime()}`);
    
    // Reseta os estados para a tela inicial.
    setSession(null);
    setShowCloseScreen(false);
  }, [session]);
  
  // Renderização condicional baseada no estado da aplicação.
  if (!dbReady) {
    // Tela de carregamento enquanto o banco de dados inicializa.
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <p className="text-xl">Inicializando sistema...</p>
      </div>
    );
  }
  
  // Função para renderizar o conteúdo principal da aplicação.
  const renderContent = () => {
    switch(view) {
      case 'erp':
        return <ERPScreen setView={setView} />;
      case 'crm':
        return <CRMScreen setView={setView} />;
      case 'fiscal':
        return <FiscalScreen setView={setView} />;
      case 'pos':
      default:
        return <POSScreen setView={setView} />;
    }
  }

  return (
    // Provedor de Contexto para que os componentes filhos possam acessar e modificar a sessão de caixa.
    <CashSessionContext.Provider value={{ session, setSession, showCloseScreen, setShowCloseScreen, handleOpenSession }}>
      {showCloseScreen && session ? (
        <CloseCashScreen session={session} onClose={handleCloseSession} />
      ) : (
        // Alterado layout para mobile-first (flex-col-reverse ou apenas manipulação via Sidebar fixed)
        // O Sidebar agora é fixo no mobile, então precisamos de padding no main
        <div className="flex flex-col md:flex-row h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans overflow-hidden">
          {/* O Sidebar no mobile é fixed bottom, no desktop é relative left */}
          <Sidebar currentView={view} setView={setView} />
          
          <main className="flex-1 flex flex-col overflow-hidden relative mb-16 md:mb-0">
              {renderContent()}
          </main>
        </div>
      )}
    </CashSessionContext.Provider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
