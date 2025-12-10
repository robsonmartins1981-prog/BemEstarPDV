
# UseNatural PDV - Sistema de Gestão Local-First

## 1. Visão Geral

O **UseNatural PDV** é uma aplicação desktop de Ponto de Venda (PDV) e gestão empresarial (ERP/CRM) desenvolvida com arquitetura "local-first". Ele foi projetado para operar com alta performance, segurança e total independência de conexão com a internet. Todos os dados (vendas, clientes, estoque) são armazenados localmente no dispositivo utilizando IndexedDB.

### Stack Tecnológica
- **Frontend:** React 18, TypeScript, Tailwind CSS.
- **Ícones:** Lucide React.
- **Gráficos:** Recharts.
- **Banco de Dados:** IndexedDB (via biblioteca `idb`).
- **Arquitetura:** Single Page Application (SPA) pronta para encapsulamento Desktop (Electron/Tauri).

---

## 2. Módulos e Funcionalidades

O sistema é dividido em quatro pilares principais acessíveis pela barra lateral.

### 2.1. PDV (Ponto de Venda)
Focado na agilidade do operador de caixa.

*   **Gestão de Turno (Caixa):**
    *   **Abertura:** Exige suprimento inicial para troco.
    *   **Movimentação:** Registro de Sangrias (retiradas) e Reforços (aportes) com justificativa.
    *   **Fechamento:** Relatório completo com soma por método de pagamento, gráfico de desempenho e cálculo de valor esperado na gaveta.
*   **Processo de Venda:**
    *   **Busca Inteligente:** Por nome ou código de barras.
    *   **Produtos a Granel:** Detecta produtos pesáveis e solicita a quantidade em Kg. Suporta leitura de etiquetas de balança (padrão `2_CCCCCC_PPPPP_V`).
    *   **Carrinho:** Edição de quantidade, descontos por item e remoção rápida.
    *   **Cliente na Venda:** Associação rápida de cliente e inserção de CPF na nota.
    *   **Descontos:** Suporta descontos manuais (R$ ou %, com senha de gerente) e Cupons promocionais.
    *   **Pagamento:** Múltiplos métodos na mesma venda (ex: R$ 50 em Dinheiro + Restante no Débito). Cálculo automático de troco e sugestão de cédulas.
*   **Recursos Extras:**
    *   **Salvar Pedido (Park Sale):** Permite deixar uma venda em espera para atender outro cliente.
    *   **Fila de Sincronização:** Vendas são salvas localmente e enviadas para processamento fiscal em background.

### 2.2. ERP (Gestão e Retaguarda)
Painel administrativo para controle da operação.

#### Estoque
*   **Cadastro de Produtos:** Gestão completa com precificação (Custo/Venda), dados fiscais (NCM, CFOP), categorização e definição de estoque mínimo.
*   **Categorias:** Organização hierárquica dos produtos.
*   **Inventário e Validade:** 
    *   Visão detalhada por **Lotes**.
    *   Alertas visuais de produtos vencidos ou próximos ao vencimento.
    *   Histórico de movimentações e ajustes manuais (perdas/sobras).

#### Compras
*   **Gerar Pedidos (NOVO):** 
    *   Algoritmo que analisa o estoque atual vs. estoque mínimo.
    *   Gera listas de sugestão de compra filtradas por Fornecedor ou Categoria.
    *   Impressão da lista de compras.
*   **Importação de NF-e (XML):**
    *   Leitura automática de arquivos XML de fornecedores.
    *   Vínculo inteligente: associa itens da nota a produtos existentes ou cadastra novos automaticamente.
    *   Conversão de unidades (Fator de conversão de caixas para unidades).
    *   Atualização automática de custo médio e quantidade em estoque.

#### Clientes
*   Gestão completa (CRUD) com histórico de compras e dados de contato.

#### Financeiro
*   Visão geral de faturamento (Dashboard em construção).

#### Fiscal
*   Configuração de dados do emitente, certificado digital A1 e parâmetros de emissão NFC-e (Ambiente, Série, CSC).

### 2.3. CRM (Marketing)
Ferramentas para fidelização.

*   **Segmentação:** Criação de públicos dinâmicos (ex: "Clientes Inativos há 30 dias", "Aniversariantes do Mês").
*   **Campanhas:** Criação de templates de mensagens (E-mail/WhatsApp) personalizadas com variáveis. Simulação de disparo.
*   **Cupons:** Gerador de códigos promocionais com limites de uso, validade e regras de valor (Fixo ou Percentual).

---

## 3. Guia de Instalação e Execução

### Pré-requisitos
*   Node.js instalado (versão 18+).

### Instalação
1.  Clone o repositório.
2.  Execute `npm install` para instalar as dependências.

### Execução (Desenvolvimento)
Execute `npm run dev` para iniciar o servidor local.

### Build (Produção Web)
Execute `npm run build` para gerar os arquivos estáticos na pasta `dist`.

---

## 4. Estrutura de Banco de Dados (IndexedDB)

O sistema utiliza o banco `UseNaturalPDV` com as seguintes Stores:
*   `products`: Catálogo de itens.
*   `sales`: Histórico de vendas.
*   `cashSessions`: Turnos de caixa.
*   `inventoryLots`: Rastreabilidade de lotes e validade.
*   `suppliers` / `customers`: Entidades.
*   `campaigns` / `segments` / `coupons`: Dados de CRM.
*   `syncQueue`: Fila para operações assíncronas (ex: emissão fiscal).
