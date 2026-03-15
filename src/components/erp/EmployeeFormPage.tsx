
import React from 'react';
import Button from '../shared/Button';
import { Save, ArrowLeft } from 'lucide-react';

interface EmployeeFormPageProps {
  employeeId?: string;
  onBack: () => void;
}

const EmployeeFormPage: React.FC<EmployeeFormPageProps> = ({ employeeId, onBack }) => {
  return (
    <div className="p-8 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-theme-primary">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-3xl font-black uppercase tracking-tight text-gray-800 dark:text-white">
          {employeeId ? 'Editar Funcionário' : 'Novo Funcionário'}
        </h1>
      </div>
      
      <form className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Nome Completo</label>
            <input type="text" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:border-theme-primary" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1">Cargo</label>
            <input type="text" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none focus:border-theme-primary" />
          </div>
        </div>
        
        <div className="flex justify-end gap-3 pt-8 border-t dark:border-gray-700">
          <Button variant="secondary" onClick={onBack}>Cancelar</Button>
          <Button variant="primary">
            <Save size={18} className="mr-2" /> Salvar Funcionário
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EmployeeFormPage;
