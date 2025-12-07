# Testes de Integração - Floricultura 4 Estações

Este diretório contém testes de integração E2E (End-to-End) para o site da Floricultura 4 Estações, implementados com o Playwright.

## 📋 Estrutura dos Testes

Os testes estão organizados em arquivos específicos por funcionalidade:

### 1. **home.spec.ts** - Página Inicial
Testa a página principal do site:
- Carregamento correto da página
- Exibição de logo e breadcrumb
- Funcionalidade de pesquisa de produtos
- Filtros de categoria e preço
- Botões de ordenação
- Carrinho de compras no header
- Navegação para login
- Footer com links e informações

### 2. **auth.spec.ts** - Autenticação
Testa as funcionalidades de login e cadastro:
- **Login**
  - Carregamento da página
  - Validação de campos
  - Tratamento de erros
  - Link para cadastro
- **Cadastro**
  - Validação de campos obrigatórios
  - Validação de senhas diferentes
  - Verificação de email já cadastrado
  - Fluxo completo de cadastro

### 3. **carrinho.spec.ts** - Carrinho de Compras
Testa o carrinho de compras:
- Ícone do carrinho no header
- Abertura do popup do carrinho
- Mensagem de carrinho vazio
- Contador de itens
- Adição de produtos
- Navegação para página do carrinho
- Persistência no localStorage
- Redirecionamento para login ao finalizar sem autenticação

### 4. **admin.spec.ts** - Painel Administrativo
Testa as páginas administrativas (requer autenticação como admin):
- **Catálogo**
  - Gerenciamento de produtos
  - Pesquisa e filtros
  - Botões de editar e excluir
  - Status ativo/inativo
  - Habilitar/desabilitar em lote
  - Adição de novos produtos
- **Pedidos**
  - Listagem de pedidos
  - Pesquisa por cliente/produto/ID
  - Filtros de status e data
  - Ordenação por hora
  - Informações do cliente
  - Botão do WhatsApp
- **Acesso**
  - Proteção de rotas admin
  - Navegação entre páginas

## 🚀 Como Executar os Testes

### Pré-requisitos
1. Servidor backend rodando
2. Aplicação frontend rodando (`npm run dev`)
3. Usuário admin configurado no banco de dados:
   - Email: `admin@floricultura.com`
   - Senha: `admin123`

### Comandos Disponíveis

```bash
# Executar todos os testes (modo headless)
npm test

# Executar testes com interface visual
npm run test:ui

# Executar testes mostrando o navegador
npm run test:headed

# Executar testes em modo debug
npm run test:debug

# Ver relatório dos últimos testes
npm run test:report
```

### Executar Testes Específicos

```bash
# Executar apenas testes da home
npx playwright test home

# Executar apenas testes de autenticação
npx playwright test auth

# Executar apenas testes do carrinho
npx playwright test carrinho

# Executar apenas testes admin
npx playwright test admin

# Executar um teste específico por nome
npx playwright test -g "deve carregar a página inicial"
```

## ⚙️ Configuração

A configuração dos testes está no arquivo `playwright.config.ts` na raiz do projeto.

### Configurações Principais:
- **URL Base**: `http://localhost:3000`
- **Timeout**: 30 segundos por teste
- **Navegador**: Chromium (Chrome)
- **Servidor**: Inicia automaticamente o `npm run dev`
- **Screenshots**: Capturados em caso de falha
- **Vídeos**: Gravados em caso de falha
- **Traces**: Coletados na primeira tentativa após falha

## 📊 Relatórios

Após executar os testes, um relatório HTML é gerado automaticamente. Para visualizá-lo:

```bash
npm run test:report
```

O relatório inclui:
- Status de cada teste (passou/falhou)
- Tempo de execução
- Screenshots de falhas
- Vídeos das execuções
- Traces para debug

## 🔧 Troubleshooting

### Testes falhando por timeout
- Certifique-se de que o servidor está rodando
- Verifique se a porta 3000 está disponível
- Aumente o timeout no `playwright.config.ts`

### Testes admin falhando
- Verifique se o usuário admin existe no banco
- Confirme as credenciais no arquivo `admin.spec.ts`
- Certifique-se de que o usuário tem role de Admin

### Problemas com navegadores
```bash
# Instalar navegadores do Playwright
npx playwright install
```

## 📝 Notas Importantes

1. **Dados de Teste**: Os testes usam o banco de dados real. Em produção, considere usar um banco de testes separado.

2. **Credenciais Admin**: As credenciais do admin estão hardcoded nos testes. Para produção, use variáveis de ambiente.

3. **Limpeza**: Alguns testes limpam o localStorage. Isso pode afetar testes rodando em paralelo.

4. **Tempo de Execução**: Os testes incluem alguns `waitForTimeout` para garantir que elementos sejam carregados. Esses valores podem precisar de ajuste dependendo da performance do sistema.

## 🎯 Cobertura de Testes

Os testes cobrem as seguintes páginas principais:
- ✅ Página inicial (Home)
- ✅ Login
- ✅ Cadastro
- ✅ Carrinho de compras
- ✅ Admin - Catálogo
- ✅ Admin - Pedidos

## 🔄 CI/CD

Para integrar com CI/CD, adicione ao seu workflow:

```yaml
- name: Install dependencies
  run: npm ci

- name: Install Playwright Browsers
  run: npx playwright install --with-deps

- name: Run tests
  run: npm test
```

## 📚 Recursos Adicionais

- [Documentação do Playwright](https://playwright.dev)
- [API Reference](https://playwright.dev/docs/api/class-playwright)
- [Best Practices](https://playwright.dev/docs/best-practices)
