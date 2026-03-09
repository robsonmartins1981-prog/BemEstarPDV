
import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { db, initDB } from './services/databaseService';
import type { CashSession, User } from './types';
import POSScreen from './components/pos/POSScreen';
import CloseCashScreen from './components/cash/CloseCashScreen';
import ERPScreen from './components/erp/ERPScreen';
import CRMScreen from './components/crm/CRMScreen';
import FiscalScreen from './components/fiscal/FiscalScreen'; 
import Dashboard from './src/components/Dashboard';
import Sidebar from './components/shared/Sidebar';
import LoginScreen from './components/auth/LoginScreen';
import { startSyncService } from './services/syncService'; 

// --- AUTH CONTEXT ---
interface AuthContextType {
    user: User | null;
    login: (user: User) => void;
    logout: () => void;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};

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
  const { user } = useAuth();
  const [session, setSession] = useState<CashSession | null>(null);
  const [showCloseScreen, setShowCloseScreen] = useState<boolean>(false);
  const [dbReady, setDbReady] = useState<boolean>(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [view, setView] = useState<'pos' | 'erp' | 'crm' | 'fiscal' | 'finance'>('finance');

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initDB(); 
        startSyncService(); 
        const activeSession = await db.get('cashSessions', 'active');
        if (activeSession) setSession(activeSession);
        setDbReady(true); 
      } catch (error: any) {
        console.error("Erro ao inicializar:", error);
        setDbError(error.message || "Erro desconhecido ao inicializar o banco de dados.");
      }
    };
    initializeApp();
  }, []);

  const handleOpenSession = useCallback(async (initialAmount: number, shiftName: string) => {
    const newSession: CashSession = {
      id: 'active', startDate: new Date(), initialAmount, shiftName, 
      transactions: [{ type: 'SUPRIMENTO', amount: initialAmount, date: new Date(), description: `Abertura - ${shiftName}` }],
      sales: [], status: 'OPEN',
    };
    await db.put('cashSessions', newSession);
    setSession(newSession);
  }, []);

  const handleCloseSession = useCallback(async () => {
    if (!session) return; 
    const closedSession: CashSession = { ...session, id: `closed-${session.startDate.getTime()}`, endDate: new Date(), status: 'CLOSED' };
    await db.delete('cashSessions', 'active');
    await db.put('cashSessions', closedSession);
    setSession(null);
    setShowCloseScreen(false);
  }, [session]);
  
  if (dbError) return <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4"><p className="text-xl font-black text-red-500 uppercase mb-4">Erro ao Iniciar</p><p className="text-center bg-gray-800 p-4 rounded-lg font-mono text-sm max-w-2xl overflow-auto">{dbError}</p><button onClick={() => window.location.reload()} className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold">Tentar Novamente</button></div>;
  if (!dbReady) return <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white"><p className="text-xl animate-pulse font-black uppercase">Iniciando Bem Estar...</p></div>;
  if (!user) return <LoginScreen />;
  
  const renderContent = () => {
    const hasPermission = (module: string) => {
        if (module === 'finance') return true;
        return user.permissions.includes(module) || user.permissions.some(p => p.startsWith(`${module}:`));
    };

    if (!hasPermission(view)) {
        const availableModules = ['pos', 'erp', 'crm', 'fiscal', 'finance'].filter(hasPermission);
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
      case 'finance': return <Dashboard />;
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
  const [user, setUser] = useState<User | null>(() => {
      const saved = localStorage.getItem('current_user');
      try { return saved ? JSON.parse(saved) : null; } catch { return null; }
  });

  const login = (userData: User) => {
      localStorage.setItem('current_user', JSON.stringify(userData));
      setUser(userData);
  };

  const logout = useCallback(() => {
      localStorage.removeItem('current_user');
      setUser(null);
      // Opcional: recarrega a página para limpar qualquer lixo de memória
      // window.location.reload(); 
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
        <ThemeProvider>
            <AppContent />
        </ThemeProvider>
    </AuthContext.Provider>
  );
}

export default App;
