
// src/services/sqliteService.ts

/**
 * Serviço de integração com o SQLite via Electron IPC.
 * Este serviço permite que o frontend React execute comandos SQL no banco de dados local/rede.
 */

const getIpc = () => {
  if ((window as any).require) {
    return (window as any).require('electron').ipcRenderer;
  }
  return null;
};

export const sqlite = {
  /**
   * Executa uma consulta SQL que retorna múltiplos resultados (SELECT).
   */
  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const ipc = getIpc();
    if (!ipc) {
      console.warn('[SQLite] Ambiente não-Electron. Ignorando query.');
      return [];
    }
    return await ipc.invoke('db-query', sql, params);
  },

  /**
   * Executa um comando SQL que modifica dados (INSERT, UPDATE, DELETE).
   */
  async run(sql: string, params: any[] = []): Promise<{ changes: number; lastInsertRowid: number | bigint }> {
    const ipc = getIpc();
    if (!ipc) {
      console.warn('[SQLite] Ambiente não-Electron. Ignorando comando.');
      return { changes: 0, lastInsertRowid: 0 };
    }
    return await ipc.invoke('db-run', sql, params);
  },

  /**
   * Verifica se o banco de dados está configurado e pronto.
   */
  async isReady(): Promise<boolean> {
    const ipc = getIpc();
    if (!ipc) return false;
    const config = await ipc.invoke('get-db-config');
    return !!config.dbPath;
  }
};

/**
 * Métodos de conveniência para o PDV
 */
export const sqliteStore = {
  async saveSale(sale: any) {
    const sql = `
      INSERT INTO sales (id, date, total, items)
      VALUES (?, ?, ?, ?)
    `;
    return await sqlite.run(sql, [
      sale.id,
      sale.date || new Date().toISOString(),
      sale.total,
      JSON.stringify(sale.items)
    ]);
  },

  async getSales() {
    return await sqlite.query('SELECT * FROM sales ORDER BY date DESC');
  },

  async syncProducts(products: any[]) {
    // Exemplo de sincronização em massa
    for (const p of products) {
      await sqlite.run(`
        INSERT OR REPLACE INTO products (id, name, price, stock)
        VALUES (?, ?, ?, ?)
      `, [p.id, p.name, p.price, p.stock || 0]);
    }
  }
};
