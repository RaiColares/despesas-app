# Registro de Despesas

Sistema web de registro de despesas com integracao ao Google Sheets.

## Estrutura

```
despesas-app/
├── backend/
│   └── Code.gs            # Google Apps Script (backend API)
├── public/
│   ├── css/
│   │   └── style.css      # Estilos
│   └── js/
│       └── app.js         # Logica do frontend
├── index.html              # Frontend principal (raiz para GitHub Pages)
├── .gitignore
└── README.md
```

## Deploy

### 1. Backend (Google Apps Script)

1. Copie o conteudo de `backend/Code.gs` para o editor do Google Apps Script
2. Salve (Ctrl+S) e va em **Publicar > Implantar como aplicativo web**
   - Executar como: **Eu**
   - Quem tem acesso: **Qualquer pessoa**
3. Copie a URL gerada (ex: `https://script.google.com/macros/s/.../exec`)

### 2. Configurar Credenciais

1. Acesse no navegador: `[URL_DO_GAS]?action=setup`
2. Preencha o usuario e senha (padrao: Aline)
3. Clique em "Salvar Credenciais"

As credenciais ficam armazenadas no `PropertiesService` do GAS, fora do codigo-fonte e da planilha.

### 3. Frontend (GitHub Pages)

1. Edite `public/js/app.js` e altere a variavel `GAS_URL` para a URL do seu deploy
2. No repositório: **Settings > Pages > Source > Deploy from a branch**
   - Branch: `main`, pasta: **`/` (root)**
3. Apos alguns minutos, o frontend estara disponivel em `https://[seuuser].github.io/[repositorio]/`

## Funcionalidades

- Login com credenciais configuradas via setup
- Navegacao entre meses
- Painel de resumo financeiro (Saldo, Debito Atual, Debito Geral, Total Pago, Saldo Pendente)
- Cadastro de compras com parcelamento automatico
- Controle de pagamento de parcelas
- Valores avulsos
- Edicao e exclusao de registros

## Como funciona

- O frontend (HTML/CSS/JS puro) se comunica com o backend GAS via um iframe invisivel (bridge)
- A bridge usa `google.script.run` + `postMessage` para contornar restricoes de CORS
- O backend armazena os dados em abas de uma planilha Google Sheets
