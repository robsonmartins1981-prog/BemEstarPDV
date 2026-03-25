
import * as React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import Button from './Button';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    (this as any).setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      let errorMessage = "Ocorreu um erro inesperado no aplicativo.";
      let isFirestoreError = false;

      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error && parsed.operationType) {
            isFirestoreError = true;
            errorMessage = `Erro de Banco de Dados: ${parsed.error}`;
            if (parsed.error.includes('insufficient permissions')) {
              errorMessage = "Você não tem permissão para realizar esta operação no banco de dados em nuvem.";
            }
          }
        }
      } catch (e) {
        // Not a JSON error message
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-6 text-center">
          <div className="bg-white dark:bg-gray-800 p-10 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 max-w-lg w-full">
            <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-2xl inline-block mb-6">
              <AlertCircle className="w-12 h-12 text-red-500" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-gray-800 dark:text-white mb-4">
              Ops! Algo deu errado
            </h2>
            <p className="text-gray-500 dark:text-gray-400 font-medium mb-8 leading-relaxed">
              {errorMessage}
            </p>
            
            {isFirestoreError && (
              <div className="mb-8 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-800 text-left">
                <p className="text-xs font-bold text-amber-700 dark:text-amber-500 uppercase tracking-widest mb-1">Dica Técnica</p>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Isso pode ser um problema temporário de conexão ou uma restrição de segurança. 
                  Tente recarregar a página.
                </p>
              </div>
            )}

            <Button onClick={this.handleReset} className="w-full py-4">
              <RefreshCw size={18} className="mr-2" /> Recarregar Aplicativo
            </Button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

export default ErrorBoundary;
