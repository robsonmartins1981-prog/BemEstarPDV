
import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { db, initDB } from './services/databaseService';
import { v4 as uuidv4 } from 'uuid';
import type { CashSession, CashOperation, User } from './types';
import POSScreen from './components/pos/POSScreen';
import CloseCashScreen from './components/cash/CloseCashScreen';
import ERPScreen from './components/erp/ERPScreen';
import CRMScreen from './components/crm/CRMScreen';
import FiscalScreen from './components/fiscal/FiscalScreen'; 
import StockScreen from './components/stock/StockScreen';
import Sidebar from './components/shared/Sidebar';
import LoginScreen from './components/auth/LoginScreen';
import { startSyncService } from './services/syncService'; 
import { AuthProvider, useAuth } from './contexts/AuthContext';

// --- THEME MANAGEMENT ---
type Theme = 'light' | 'dark' | 'system';
interface ThemeContextType { theme: Theme; setTheme: (theme: Theme) => void; }
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};

const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'system');
  useEffect(() => {
    const root = window.document.documentElement;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const currentTheme = theme === 'system' ? systemTheme : theme;
    root.classList.remove('light', 'dark');
    root.classList.add(currentTheme);
    localStorage.setItem('theme', theme);
  }, [theme]);
  const setTheme = (newTheme: Theme) => setThemeState(newTheme);
  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
};

export const CashSessionContext = React.createContext<{
  session: CashSession | null;
  setSession: React.Dispatch<React.SetStateAction<CashSession | null>>;
  showCloseScreen: boolean;
  setShowCloseScreen: React.Dispatch<React.SetStateAction<boolean>>;
  handleOpenSession: (initialAmount: number, shiftName: string) => Promise<void>;
}>({
  session: null, setSession: () => {}, showCloseScreen: false, setShowCloseScreen: () => {}, handleOpenSession: async () => {},
});

function AppContent() {
  const { user, hasPermission } = useAuth();
  const [session, setSession] = useState<CashSession | null>(null);
  const [showCloseScreen, setShowCloseScreen] = useState<boolean>(false);
  const [dbReady, setDbReady] = useState<boolean>(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [view, setView] = useState<'pos' | 'erp' | 'crm' | 'fiscal' | 'stock'>('pos');

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initDB(); 
        startSyncService(); 
        const allSessions = await db.getAll('cashSessions');
        const activeSession = allSessions.find(s => s.status === 'OPEN');
        if (activeSession) setSession(activeSession);
        setDbReady(true); 
      } catch (error: any) {
        console.error("Erro ao inicializar:", error);
        setDbError(error.message || "Erro desconhecido ao inicializar o banco de dados.");
      }
    };
    initializeApp();
  }, []);

  /**
   * Abre uma nova sessão de caixa
   */
  const handleOpenSession = useCallback(async (initialAmount: number, shiftName: string) => {
    const sessionId = uuidv4();
    const newSession: CashSession = {
      id: sessionId,
      openedAt: new Date().toISOString(),
      openedBy: user?.username || 'Sistema',
      terminalId: shiftName,
      initialAmount,
      status: 'OPEN',
      sales: [],
    };
    
    await db.put('cashSessions', newSession);
    
    setSession(newSession);
  }, [user]);

  /**
   * Fecha a sessão de caixa ativa
   */
  const handleCloseSession = useCallback(async (finalAmount: number, notes?: string) => {
    if (!session) return;
    
    // Buscar a sessão real no banco (não a 'active' do estado)
    const allSessions = await db.getAll('cashSessions');
    const realSession = allSessions.find(s => s.status === 'OPEN');
    
    if (realSession) {
      const updatedSession: CashSession = {
        ...realSession,
        closedAt: new Date().toISOString(),
        finalAmount,
        status: 'CLOSED',
        notes
      };
      await db.put('cashSessions', updatedSession);
    }
    
    setSession(null);
    setShowCloseScreen(false);
  }, [session]);
  
  if (dbError) return <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4"><p className="text-xl font-black text-red-500 uppercase mb-4">Erro ao Iniciar</p><p className="text-center bg-gray-800 p-4 rounded-lg font-mono text-sm max-w-2xl overflow-auto">{dbError}</p><button onClick={() => window.location.reload()} className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold">Tentar Novamente</button></div>;
  if (!dbReady) return <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white"><p className="text-xl animate-pulse font-black uppercase">Iniciando Bem Estar...</p></div>;
  if (!user) return <LoginScreen />;
  
  /**
   * Renderiza o conteúdo principal com base na view selecionada e permissões
   */
  const renderContent = () => {
    if (!hasPermission(view)) {
        const availableModules = ['pos', 'erp', 'crm', 'fiscal', 'stock'].filter(hasPermission);
        if (availableModules.length > 0) {
            setView(availableModules[0] as any);
            return null;
        }
        return <div className="p-20 text-center font-black text-red-500 uppercase">Usuário sem permissões de acesso.</div>;
    }
    switch(view) {
      case 'erp': return <ERPScreen setView={setView} />;
      case 'crm': return <CRMScreen setView={setView} />;
      case 'fiscal': return <FiscalScreen setView={setView} />;
      case 'stock': return <StockScreen setView={setView} />;
      case 'pos':
      default: return <POSScreen setView={setView} />;
    }
  }

  return (
    <CashSessionContext.Provider value={{ session, setSession, showCloseScreen, setShowCloseScreen, handleOpenSession }}>
      {showCloseScreen && session ? (
        <CloseCashScreen session={session} onClose={handleCloseSession} />
      ) : (
        <div className="flex flex-col md:flex-row h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans overflow-hidden">
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
    <AuthProvider>
        <ThemeProvider>
            <AppContent />
        </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
