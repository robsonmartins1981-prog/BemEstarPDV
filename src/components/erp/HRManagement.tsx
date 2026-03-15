
import React from 'react';
import { Users, UserPlus, Search, Briefcase } from 'lucide-react';
import Button from '../shared/Button';

interface HRManagementProps {
  onNewEmployee: () => void;
  onEditEmployee: (id: string) => void;
}

const HRManagement: React.FC<HRManagementProps> = ({ onNewEmployee }) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nome do funcionário..."
            className="w-full pl-10 pr-4 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700"
          />
        </div>
        <Button onClick={onNewEmployee}>
          <UserPlus size={20} className="mr-2" /> Novo Funcionário
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border dark:border-gray-700 p-12 text-center">
        <Briefcase size={64} className="mx-auto text-gray-200 mb-4" />
        <p className="text-gray-400 font-bold uppercase text-sm">Nenhum funcionário cadastrado</p>
      </div>
    </div>
  );
};

export default HRManagement;
