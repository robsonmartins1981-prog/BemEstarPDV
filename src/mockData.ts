import { CategoryNature, CategoryType, Transaction, Account } from './types';

export const mockNatures: CategoryNature[] = [
  { id: 'n1', name: 'Moradia', color: 'bg-blue-500', icon: 'Home' },
  { id: 'n2', name: 'Transporte', color: 'bg-yellow-500', icon: 'Car' },
  { id: 'n3', name: 'Alimentação', color: 'bg-orange-500', icon: 'Utensils' },
  { id: 'n4', name: 'Renda', color: 'bg-green-500', icon: 'Briefcase' },
  { id: 'n5', name: 'Cartão', color: 'bg-purple-500', icon: 'CreditCard' },
];

export const mockTypes: CategoryType[] = [
  { id: 't1', natureId: 'n1', name: 'Aluguel' },
  { id: 't2', natureId: 'n1', name: 'Luz' },
  { id: 't3', natureId: 'n2', name: 'Uber' },
  { id: 't4', natureId: 'n2', name: 'Gasolina' },
  { id: 't5', natureId: 'n3', name: 'Mercado' },
  { id: 't6', natureId: 'n3', name: 'Ifood' },
  { id: 't7', natureId: 'n4', name: 'Salário' },
  { id: 't8', natureId: 'n5', name: 'Fatura Nubank' },
];

export const mockTransactions: Transaction[] = [
  {
    id: 'tx1',
    monthYear: '2026-03',
    date: '2026-03-05',
    description: 'Salário',
    amount: 10000,
    type: 'INCOME',
    categoryId: 't7',
    isPaid: true,
  },
  {
    id: 'tx2',
    monthYear: '2026-03',
    date: '2026-03-10',
    description: 'Aluguel',
    amount: 2000,
    type: 'FIXED_EXPENSE',
    categoryId: 't1',
    isPaid: false,
  },
  {
    id: 'tx3',
    monthYear: '2026-03',
    date: '2026-03-15',
    description: 'Fatura Nubank',
    amount: 200,
    type: 'CREDIT_CARD',
    categoryId: 't8',
    isPaid: false,
    creditCardItems: [
      { id: 'cc1', date: '2026-03-01', description: 'Uber', amount: 50, categoryId: 't3' },
      { id: 'cc2', date: '2026-03-02', description: 'Ifood', amount: 150, categoryId: 't6' },
    ],
  },
  {
    id: 'tx4',
    monthYear: '2026-03',
    date: '2026-03-20',
    description: 'Mercado',
    amount: 800,
    type: 'VARIABLE_EXPENSE',
    categoryId: 't5',
    isPaid: true,
  },
];

export const mockAccounts: Account[] = [
  { id: 'a1', name: 'Nubank Corrente', balance: 5000, type: 'CHECKING' },
  { id: 'a2', name: 'Reserva Emergência', balance: 20000, type: 'SAVINGS' },
  { id: 'a3', name: 'Tesouro Direto', balance: 50000, type: 'INVESTMENT' },
];
