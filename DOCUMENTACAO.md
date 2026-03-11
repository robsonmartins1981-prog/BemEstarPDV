# Documentação do Sistema de Gestão (ERP/PDV/Estoque)

Este documento detalha as funcionalidades e a estrutura do sistema de gestão desenvolvido.

## 1. Visão Geral
O sistema é uma Single Page Application (SPA) focada em agilidade operacional para comércios, integrando Frente de Caixa (PDV), Gestão de Estoque, ERP e CRM.

## 2. Módulos Principais

### 2.1. Frente de Caixa (PDV)
- **Venda Ágil:** Interface otimizada para teclado e leitura de código de barras.
- **Múltiplas Formas de Pagamento:** Suporte a Dinheiro, Cartão, PIX e Convênio.
- **Gestão de Itens:** Adição, remoção e alteração de quantidade de itens na venda.
- **Finalização de Venda:** Registro automático no banco de dados e atualização de estoque.

### 2.2. Gestão de Estoque (Módulo Independente)
- **Painel de Controle:** Visão geral do valor total em estoque e alertas.
- **Alertas de Estoque Baixo:** Notificações automáticas para produtos abaixo do estoque mínimo.
- **Histórico de Movimentações:** Registro detalhado de todas as entradas e saídas (vendas, ajustes, perdas).
- **Gestão de Lotes:** Controle de validade e lotes de entrada.

### 2.3. ERP (Enterprise Resource Planning)
O ERP está dividido em seções estratégicas e operacionais:

#### Operações e Caixa
- **Gestão de Caixa (CRUD):** Visualização de todas as sessões de caixa (abertas/fechadas), com possibilidade de editar ou excluir movimentações (suprimentos e sangrias).
- **Equipe e RH:** Cadastro de colaboradores e gestão de permissões.

#### Estoque e Compras
- **Cadastro de Produtos:** Ficha técnica completa, incluindo:
    - **Histórico de Preços:** Rastreamento automático de alterações nos preços de compra e venda.
    - **Kits e Composições:** Criação de cestas ou combos baseados em outros produtos.
    - **Dados Fiscais:** NCM, CFOP e CSOSN para emissão de notas.
- **Categorias:** Organização hierárquica de produtos.
- **Sugestão de Pedidos:** Lógica inteligente para reposição baseada em giro e estoque mínimo.
- **Importação de XML:** Entrada de mercadorias via arquivo XML da NF-e.

#### Clientes e Logística
- **Base de Clientes:** Cadastro completo para CRM e convênios.
- **Bairros e Fretes:** Configuração de zonas de entrega e taxas de serviço.

#### Sistema e Acessos
- **Usuários e Permissões:** Controle granular de quem pode acessar cada módulo.
- **Configurações Gerais:** Ferramentas de backup e integração com WhatsApp.

## 3. Tecnologia e Arquitetura
- **Frontend:** React + TypeScript + Tailwind CSS.
- **Ícones:** Lucide React.
- **Banco de Dados:** IndexedDB (via biblioteca `idb`) para persistência local e funcionamento offline.
- **Estado Global:** Context API para Autenticação, Tema e Sessão de Caixa.

## 4. Diferenciais Operacionais
- **Edição Inline:** Tabelas que permitem edição direta para maior velocidade.
- **Local-First:** O sistema prioriza o armazenamento local, garantindo que a operação não pare por falta de internet.
- **Interface Responsiva:** Adaptado para uso em desktops e tablets.

---
*Documento gerado em 10 de Março de 2026.*
