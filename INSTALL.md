# MyClubPrime MVP - Manual de Instalação e Deploy de Produção

Este documento detalha o processo completo de configuração, instalação local e deploy em produção do ecossistema de hospitalidade premium **MyClubPrime Enterprise**, agora integrado de forma totalmente operacional ao **Firebase (Authentication, Firestore)**, sistema de e-mails transacionais e gateway simulado do **Mercado Pago (PIX)**.

---

## 🏗️ Arquitetura do Projeto

*   **Frontend**: React 18+ com Vite, estilizado com Tailwind CSS seguindo a linguagem visual **Apple Liquid Glass** (frosted panels, layered transparency).
*   **Backend (API)**: Servidor Node.js integrado com Express, responsável por proxy de faturamento Mercado Pago PIX e logs de e-mails transacionais SMTP.
*   **Banco de Dados & Autenticação**: Firebase Firestore (banco persistente em tempo real) e Firebase Auth (login por e-mail/senha com separação refinada de perfis: Hóspede, Anfitrião, Proprietário, Criador de Conteúdo e Administrador).
*   **Segurança**: Regras de Coleção do Firestore (`firestore.rules`) hiper-robustas aplicando restrições granulares de acesso e blindagem de dados confidenciais (PII).

---

## 🚀 Guia de Instalação Local

Siga os passos abaixo para configurar e rodar o projeto localmente em seu computador ou ambiente de desenvolvimento.

### 1. Pré-requisitos
*   **Node.js**: Versão 18.x ou superior recomendada.
*   **NPM**: Instalador de pacotes incluso com o Node.

### 2. Clonagem e Instalação de Dependências
Navegue até a pasta raiz do projeto e execute a instalação:
```bash
npm install
```

### 3. Configuração das Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto baseado no `.env.example`:
```env
# Chave da API Gemini (para assistentes de concierge)
GEMINI_API_KEY="SUA_CHAVE_GEMINI_AQUI"

# Configurações do Firebase do seu Projeto no Console
VITE_FIREBASE_API_KEY="seu-api-key"
VITE_FIREBASE_AUTH_DOMAIN="seu-projeto.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="seu-projeto"
VITE_FIREBASE_STORAGE_BUCKET="seu-projeto.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="seu-sender-id"
VITE_FIREBASE_APP_ID="seu-app-id"
```

---

## 🔥 Configuração do Firebase no Console

Para fazer o MVP funcionar com o seu próprio banco de dados em nuvem, configure estes itens no console do Firebase:

1.  ### Ativar o Firebase Authentication:
    *   No painel do Firebase Console, vá em **Authentication** > **Sign-in method**.
    *   Ative o provedor **E-mail/Senha** (Email/Password) e salve os ajustes.

2.  ### Configurar o Cloud Firestore:
    *   Vá em **Firestore Database** e clique em **Criar banco de dados** (Active em modo de Produção ou Teste).
    *   Opte por uma região de servidor estável (ex: `southamerica-east1` para o Brasil ou `us-east1`).

3.  ### Estrutra dos Dados (Blueprint):
    O banco de dados do MyClubPrime cria dinamicamente e gerencia as seguintes coleções ao interagir com a interface:
    *   `users`: Perfis dos usuários associados ao `uid` (nome, e-mail, função/perfil autorizada).
    *   `properties`: Imóveis cadastrados por anfitriões com URLs do Kuula 360 e links de imagem.
    *   `bookings`: Histórico em tempo real de reservas associadas a garantias financeiras e hashes de auditoria.
    *   `legal`: Registro imutável de versões de assinaturas digitais de termos de proteção.

---

## 🛠️ Executando a Aplicação e Servidor de Desenvolvimento

O projeto roda sob uma arquitetura full-stack integrada. Para iniciar o servidor local com recarregamento rápido e integração de APIs, digite o seguinte comando:

```bash
npm run dev
```

*   O servidor de desenvolvimento do Vite e Express será iniciado no endereço: **`http://localhost:3000`**
*   **O que ele faz**: Serve o frontend React na porta de renderização e ativa as rotas REST locais (`/api/mp/pix` para a geração de QR Codes e `/api/notifications/logs` para o simulador de caixa de entrada do provedor de e-mail).

---

## 📦 Compilação e Deploy de Produção

Para preparar o projeto final empacotado para o deploy comercial estável, utilize os passos abaixo.

### 1. Compilação (Build)
Rode o comando de compactação na raiz do repositório:
```bash
npm run build
```
*   **Frontend**: O processo compila o código fonte SPA do React e exporta arquivos estáticos rápidos otimizados para produção na pasta `/dist`.
*   **Backend**: O compilador empacota o arquivo `server.ts` de backend utilizando `esbuild` gerando o arquivo otimizado `dist/server.cjs` à prova de incompatibilidades de módulos relativos CJS/ESM.

### 2. Implantando Regras de Segurança do Firestore
Utilize a CLI do Firebase ou a interface Web para implantar as políticas de segurança. Copie o conteúdo de `firestore.rules` (na pasta raiz) e cole na aba de Regras do painel Firestore. Estas regras garantem:
*   Usuários comuns só lerem dados públicos e criarem suas próprias reservas.
*   Anfitriões gerenciarem os preços de seus imóveis.
*   Administradores e o sistema atualizarem disputas e termos legais.

### 3. Executando o Servidor em Produção
Após compilar o projeto em sua VPS ou container no Docker, inicie o app de modo consolidado usando a trigger nativa para produção:
```bash
npm start
```
Isso inicia diretamente o servidor compilado na porta `3000` em alta velocidade, configurado para produção.

---

## 🏷️ Testando os Fluxos do MVP na Interface

Para realizar um teste completo de ponta a ponta dos novos recursos persistentes:
1.  **Acesso VIP (Login/Cadastro)**: Clique em "Acesso VIP" no topo. Cadastre um novo usuário escolhendo "Hóspede VIP" ou "Anfitrião Prime". Verifique os dados em tempo real no Firestore e na caixa flutuante do simulador de e-mails (`HelpCircle` no topo direito).
2.  **Cadastrar Imóvel**: Logado como Anfitrião, alterne para o painel "Host", clique em **➕ Cadastrar Imóvel (Kuula 360)**, insira uma foto e link do Kuula, e clique em salvar. O imóvel ficará disponível no feed de buscas.
3.  **Reservar com Pix**: Logado como Hóspede, selecione qualquer imóvel, clique em checkout, selecione **PIX** e finalize. O simulador oficial Mercado Pago gerará o QR Code e chave copia/cola de transações da API. Confirme o pagamento simulado para gerar o recibo e notificar as partes!
