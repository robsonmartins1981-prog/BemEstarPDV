
import React, { useMemo } from 'react';
import type { CashSession, Payment, Sale } from '../../types';
import { PaymentMethod } from '../../types';
import Button from '../shared/Button';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface CloseCashScreenProps {
  session: CashSession;
  onClose: () => void;
}

// Cores para o gráfico, alinhadas com a identidade visual.
const COLORS = {
  [PaymentMethod.DINHEIRO]: '#E87722', // theme-secondary (Orange)
  [PaymentMethod.PIX]: '#9FCB3B',      // theme-green (Light Green)
  [PaymentMethod.DEBITO]: '#1E3A63',   // theme-darkblue (Navy Blue)
  [PaymentMethod.CREDITO]: '#F9B208', // theme-yellow (Mustard Yellow)
  [PaymentMethod.NOTINHA]: '#ef4444',     // Red
};


// Componente para a tela de Fechamento de Caixa.
// Apresenta um resumo completo do turno do operador.
const CloseCashScreen: React.FC<CloseCashScreenProps> = ({ session, onClose }) => {

  // useMemo é usado para calcular os totais apenas quando a sessão mudar.
  // Isso otimiza a performance, evitando recálculos a cada renderização.
  const summary = useMemo(() => {
    // Inicializa um mapa para armazenar o total de cada método de pagamento.
    const paymentsByMethod = new Map<PaymentMethod, number>();
    Object.values(PaymentMethod).forEach(method => paymentsByMethod.set(method, 0));

    // Itera sobre todas as vendas da sessão para somar os pagamentos.
    session.sales.forEach((sale: Sale) => {
      sale.payments.forEach((payment: Payment) => {
        const currentTotal = paymentsByMethod.get(payment.method) || 0;
        paymentsByMethod.set(payment.method, currentTotal + payment.amount);
      });
    });

    // Calcula os totais de sangrias e reforços.
    const totalSuprimento = session.transactions.filter(t => t.type === 'SUPRIMENTO' || t.type === 'REFORCO').reduce((sum, t) => sum + t.amount, 0);
    const totalSangria = session.transactions.filter(t => t.type === 'SANGRIA').reduce((sum, t) => sum + t.amount, 0);
    
    // Calcula o valor total de vendas.
    const totalSales = session.sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    
    // Calcula o valor esperado em dinheiro no caixa.
    const expectedCash = (paymentsByMethod.get(PaymentMethod.DINHEIRO) || 0) + totalSuprimento - totalSangria;

    // Formata os dados para o gráfico.
    const chartData = Array.from(paymentsByMethod.entries()).map(([name, value]) => ({ name, value }));

    return { paymentsByMethod, totalSuprimento, totalSangria, totalSales, expectedCash, chartData };
  }, [session]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800 dark:text-gray-100">Fechamento de Caixa</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Coluna de Resumo Financeiro */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold border-b pb-2 dark:border-gray-600">Resumo Financeiro</h2>
            
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="font-bold mb-2">Vendas por Método de Pagamento</h3>
              <ul className="space-y-1">
                {Array.from(summary.paymentsByMethod.entries()).map(([method, total]) => (
                  <li key={method} className="flex justify-between">
                    <span>{method}:</span>
                    <span className="font-mono">{formatCurrency(total)}</span>
                  </li>
                ))}
              </ul>
              <hr className="my-2 border-gray-200 dark:border-gray-600"/>
              <div className="flex justify-between font-bold text-lg">
                <span>Total de Vendas:</span>
                <span className="font-mono">{formatCurrency(summary.totalSales)}</span>
              </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="font-bold mb-2">Movimentações de Caixa</h3>
               <ul className="space-y-1">
                 <li className="flex justify-between text-green-600 dark:text-green-400">
                    <span>(+) Suprimentos / Reforços:</span>
                    <span className="font-mono">{formatCurrency(summary.totalSuprimento)}</span>
                 </li>
                 <li className="flex justify-between text-red-600 dark:text-red-400">
                    <span>(-) Sangrias:</span>
                    <span className="font-mono">{formatCurrency(summary.totalSangria)}</span>
                 </li>
               </ul>
            </div>

            <div className="p-4 bg-theme-primary/10 dark:bg-theme-primary/20 rounded-lg text-theme-primary dark:text-theme-primary/90">
              <div className="flex justify-between font-bold text-xl">
                <span>Valor Esperado em Caixa:</span>
                <span className="font-mono">{formatCurrency(summary.expectedCash)}</span>
              </div>
              <p className="text-sm mt-1">Total em Dinheiro + Suprimentos - Sangrias</p>
            </div>
          </div>
          
          {/* Coluna do Gráfico */}
          <div className="flex flex-col">
            <h2 className="text-xl font-semibold border-b pb-2 dark:border-gray-600 mb-4">Visualização das Vendas</h2>
            <div className="flex-grow min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value: number) => `R$${value}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '0.5rem' }}
                    labelStyle={{ color: '#d1d5db' }}
                    itemStyle={{ fontWeight: 'bold' }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend wrapperStyle={{fontSize: "14px"}}/>
                  <Bar dataKey="value" name="Total" radius={[4, 4, 0, 0]}>
                    {summary.chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.name as PaymentMethod]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Botões de Ação */}
        <div className="mt-8 flex justify-center gap-4">
          <Button onClick={() => window.location.reload()} variant="secondary">Voltar ao PDV</Button>
          <Button onClick={onClose} variant="primary">Confirmar e Fechar Caixa</Button>
        </div>
      </div>
    </div>
  );
};

export default CloseCashScreen;
