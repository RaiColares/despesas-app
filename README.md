# Registro de Despesas

Sistema web de registro de despesas com integracao ao Google Sheets.

## Estrutura

```
despesas-app/
├── backend/
│   ├── Code.gs        # Google Apps Script (backend API + servidor do frontend)
│   ├── App.html        # HTML principal do sistema
│   ├── Js.html         # JavaScript (usa google.script.run)
│   ├── Css.html        # Estilos CSS
│   └── Setup.html      # Pagina de configuracao de credenciais
├── .gitignore
└── README.md
```

## Deploy

### 1. Google Apps Script

1. Crie um projeto no [Google Apps Script](https://script.google.com/)
2. Crie os 5 arquivos abaixo no editor (usando os arquivos da pasta `backend/`):
   - `Code.gs` (arquivo de script)
   - `App.html` (HTML)
   - `Js.html` (HTML)
   - `Css.html` (HTML)
   - `Setup.html` (HTML)
3. Va em **Implantar > Gerenciar implantacoes > Nova implantacao**
   - Tipo: **Aplicativo web**
   - Executar como: **Eu**
   - Quem tem acesso: **Qualquer pessoa**
4. Copie a URL gerada (ex: `https://script.google.com/macros/s/.../exec`)

### 2. Configurar Credenciais

1. Acesse no navegador: `[URL_DO_GAS]?action=setup`
2. Preencha o usuario e senha (padrao: Aline)
3. Clique em "Salvar Credenciais"

As credenciais ficam armazenadas no `PropertiesService` do GAS, fora do codigo-fonte.

### 3. Usar o sistema

1. Acesse a URL do GAS diretamente no navegador
2. Faca login com as credenciais configuradas
3. O sistema funciona 100% via `google.script.run` (sem CORS, sem iframe)

## Funcionalidades

- Login com credenciais configuradas via setup
- Navegacao entre meses
- Painel de resumo financeiro (Saldo, Debito Atual, Debito Geral, Total Pago, Saldo Pendente)
- Cadastro de compras com parcelamento automatico
- Controle de pagamento de parcelas
- Valores avulsos
- Edicao e exclusao de registros
- Visualizar senha (botao olho)

## Como funciona

- O sistema e servido inteiramente pelo Google Apps Script (HtmlService)
- O frontend usa `google.script.run` para chamar funcoes do backend diretamente
- Nao ha problemas de CORS, cookies ou iframes porque tudo esta no mesmo dominio
- Os dados sao armazenados em abas de uma planilha Google Sheets
