
# Documentação do Sistema UseNatural PDV

## 1. Visão Geral

O UseNatural PDV é um sistema completo de Ponto de Venda (PDV) e gestão (ERP/CRM) projetado para ser robusto, rápido e funcional mesmo sem conexão com a internet. Sua arquitetura "local-first" garante que todas as operações essenciais, como vendas, controle de caixa e gestão de produtos, continuem operando de forma independente, com dados armazenados de forma segura no próprio dispositivo.

O sistema é dividido em três módulos principais, acessíveis através da barra de navegação lateral:

- **PDV (Ponto de Venda):** A interface principal para realizar vendas.
- **ERP (Gestão):** O painel de retaguarda para gerenciar produtos, estoque, clientes, finanças e configurações fiscais.
- **CRM (Marketing):** Ferramentas para gerenciar o relacionamento com clientes, incluindo segmentação, campanhas e cupons de desconto.

---

## 2. Módulo PDV (Ponto de Venda)

Esta é a tela principal para o operador de caixa.

### 2.1. Abertura e Fechamento de Caixa

- **Abertura de Caixa:** Antes de iniciar as vendas, o sistema exige a abertura do caixa. O operador deve informar um valor inicial (suprimento), que servirá como troco.
- **Fechamento de Caixa:** Ao final do turno, o operador pode fechar o caixa. Uma tela de resumo detalhada é exibida, mostrando:
  - **Resumo Financeiro:** Vendas totais, discriminadas por método de pagamento (Dinheiro, PIX, Débito, Crédito, Notinha).
  - **Movimentações de Caixa:** Soma de todos os suprimentos/reforços e sangrias.
  - **Valor Esperado em Caixa:** O cálculo final do dinheiro que deve estar na gaveta.
  - **Gráfico Visual:** Um gráfico de barras para facilitar a visualização das vendas por método.

### 2.2. Tela Principal de Venda

A tela é dividida em uma área de lançamento de produtos (esquerda/centro) e uma área de resumo da venda (direita).

#### Funcionalidades da Venda:

- **Busca de Produtos:**
  - **Por Nome:** Digite o nome do produto para uma busca rápida.
  - **Por Código de Barras:** Use um leitor de código de barras. O sistema identifica o "Enter" do leitor e adiciona o produto automaticamente.
  - **Produtos a Granel (Pesáveis):**
    - Se um produto for a granel, o sistema solicita o peso (em kg, ex: `0.250`).
    - **Integração com Balança (via Etiqueta):** O sistema decodifica códigos de barras de balança no formato `2_CCCCCC_PPPPP_V`, onde `C` é o código do produto e `P` é o peso.

- **Carrinho de Compras:**
  - Exibe todos os itens adicionados à venda.
  - Permite alterar a **quantidade** de cada item.
  - Permite remover itens individualmente.
  - Permite aplicar um **desconto específico (em R$)** por item.

- **Resumo da Venda (Painel Direito):**
  - **Identificação do Cliente:** É possível buscar e associar um cliente cadastrado à venda.
  - **CPF na Nota:** Opção para incluir o CPF do consumidor na nota fiscal. Se um cliente for selecionado, seu CPF é preenchido automaticamente.
  - **Descontos:**
    - **Desconto Manual (% ou R$):** Aplica um desconto sobre o valor total da venda. **Requer senha de gerente** (senha padrão: `1234`) para autorização.
    - **Cupom de Desconto:** Aplica um desconto com base em um código de cupom previamente cadastrado no módulo CRM.
    - _Nota: Apenas um tipo de desconto (manual ou cupom) pode ser aplicado por vez._
  - **Total:** Exibe o subtotal, o valor total dos descontos e o valor final a ser pago.

### 2.3. Janela de Pagamento (Modal)

- Ativada pelo botão "PAGAR (F12)".
- **Múltiplos Pagamentos:** Permite que uma única venda seja paga com diferentes métodos (ex: parte em dinheiro, parte em PIX, parte em Notinha).
- **Cálculo de Restante e Troco:** Mostra em tempo real o valor que ainda falta pagar ou o troco a ser devolvido.
- **Botões de Acesso Rápido:** Para pagamentos em dinheiro, exibe botões com valores de notas comuns (ex: R$ 50,00, R$ 100,00) para agilizar o processo.
- **Finalização da Venda:** Após o pagamento completo, finaliza a venda, limpa a tela para a próxima e **tenta emitir a NFC-e (Nota Fiscal de Consumidor Eletrônica)** através do serviço fiscal configurado.

### 2.4. Outras Operações do PDV

- **Movimentar Caixa:** Abre uma janela para registrar **Sangrias** (retiradas de dinheiro) ou **Reforços** (adições de dinheiro), exigindo uma descrição para cada operação.
- **Recuperar Pedido:** Permite carregar um carrinho de compras que foi salvo anteriormente para finalização posterior.
- **Salvar Pedido:** Salva o carrinho atual para ser finalizado mais tarde.

---

## 3. Módulo ERP (Gestão)

Painel administrativo para controle total da operação da loja.

### 3.1. Estoque

- **Produtos:**
  - Cadastro completo de produtos (criar, editar, excluir).
  - O formulário é dividido em abas:
    - **Dados Principais:** Nome, código de barras (ID), preço de venda e custo, categoria, se é a granel, código de balança e imagem.
    - **Tributação:** Informações fiscais essenciais para a emissão de notas (NCM, CFOP, Origem, CSOSN/CST).
- **Categorias:** Gerenciamento simples de categorias de produtos.
- **Inventário e Validade:**
  - Relatório que lista todos os produtos e seus respectivos **lotes de estoque**.
  - Cada lote mostra quantidade, data de entrada e **data de validade**.
  - O sistema destaca visualmente lotes próximos do vencimento ou já vencidos.
  - Permite **Ajustes Manuais** de estoque (entrada ou saída) por lote, com registro de motivo.
  - É possível visualizar o **histórico de ajustes** para cada produto.

### 3.2. Compras

- **Importar Compra (NF-e):**
  - Funcionalidade poderosa para dar entrada em mercadorias a partir do **arquivo XML da nota fiscal** do fornecedor.
  - O sistema lê o XML e tenta vincular automaticamente os itens da nota aos produtos já cadastrados.
  - **Interface de Vinculação:** Para itens não encontrados, o operador pode:
    - **Vincular** a um produto existente.
    - Marcar como **Novo Produto** para cadastrá-lo automaticamente.
  - **Fator de Conversão:** Permite tratar casos como "1 caixa (fator 12) = 12 unidades no estoque".
  - Ao confirmar, o sistema:
    - Cadastra novos produtos.
    - Cria novos lotes de estoque, atualizando a quantidade e o preço de custo.
    - Cadastra o fornecedor, se for novo.
    - Lança a fatura no "Contas a Pagar".

### 3.3. Clientes

- Gerenciamento completo (CRUD) do cadastro de clientes, com informações como nome, CPF, contato e endereço.

### 3.4. Fiscal

- **Configurações:** Tela essencial para habilitar a emissão de NFC-e.
  - **Aba 1 - Emitente:** Dados completos da empresa (CNPJ, Razão Social, Endereço, etc.).
  - **Aba 2 - Conexão e Certificado:** Configuração do provedor de API fiscal e upload do Certificado Digital A1.
  - **Aba 3 - Padrões da NFC-e:** Configuração do ambiente (Homologação/Produção), série e número da nota, e o CSC (token de segurança da SEFAZ).

---

## 4. Módulo CRM (Marketing)

Ferramentas para criar e gerenciar ações de marketing e relacionamento.

### 4.1. Segmentação

- Permite criar **grupos de clientes** com base em regras dinâmicas. Exemplos de regras implementadas:
  - **Clientes Inativos:** Clientes que não compram há um determinado número de dias.
  - **Aniversariantes do Mês:** Clientes que fazem aniversário no mês corrente.
- Cada segmento mostra a contagem de clientes que se encaixam nos critérios.

### 4.2. Campanhas

- Permite criar campanhas de marketing direcionadas aos segmentos criados.
- **Configuração:**
  - Define um nome, seleciona o público-alvo (segmento) e o canal (E-mail ou WhatsApp).
  - Cria uma **mensagem template** usando variáveis como `[Nome do Cliente]` para personalização.
- **Disparo:**
  - Ao disparar, o sistema (atualmente) **simula o envio** das mensagens, exibindo os resultados no console do navegador. Isso permite testar a lógica sem custos.

### 4.3. Cupons de Desconto

- Gerenciamento completo (CRUD) de cupons de desconto.
- **Configurações do Cupom:**
  - **Código:** O código que o cliente usará no PDV (ex: `PROMO10`).
  - **Tipo:** Percentual (%) ou Valor Fixo (R$).
  - **Valor:** O valor do desconto.
  - **Validade:** Data de expiração do cupom.
  - **Limite de Usos:** Número máximo de vezes que o cupom pode ser utilizado.
  - **Status:** Permite ativar ou desativar um cupom a qualquer momento.
- O sistema monitora o status do cupom (ativo, expirado, limite de usos atingido) e exibe na tela.
