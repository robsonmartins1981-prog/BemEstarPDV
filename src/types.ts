export type TransactionType = 'INCOME' | 'FIXED_EXPENSE' | 'VARIABLE_EXPENSE' | 'CREDIT_CARD';

export interface CategoryNature {
  id: string;
  name: string; // e.g., Housing, Transport
  color: string;
  icon: string;
}

export interface CategoryType {
  id: string;
  natureId: string; // Reference to CategoryNature
  name: string; // e.g., Electricity, Uber
}

export interface CreditCardItem {
  id: string;
  date: string;
  description: string;
  amount: number;
  categoryId?: string; // Reference to CategoryType
}

export interface Transaction {
  id: string;
  monthYear: string; // e.g., '2026-03'
  date: string; // '2026-03-15'
  description: string;
  amount: number;
  type: TransactionType;
  categoryId?: string; // Reference to CategoryType
  isPaid: boolean;
  
  // For Credit Card Detailed Mode
  creditCardItems?: CreditCardItem[];
}

export interface Account {
  id: string;
  name: string; // e.g., Nubank, Savings
  balance: number;
  type: 'CHECKING' | 'SAVINGS' | 'INVESTMENT';
}
