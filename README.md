# 📱 Desenvolvimento Mobile (React Native + Expo)

Repositório dedicado às atividades e projetos práticos desenvolvidos na disciplina de Desenvolvimento Mobile (IFRO).

---

## 🚀 Tecnologias Utilizadas

- **[React Native](https://reactnative.dev/)** `0.81.5`
- **[React](https://react.dev/)** `19.1.0`
- **[Expo](https://expo.dev/)** `~54.0.35`
- **[Expo Router](https://docs.expo.dev/router/introduction/)** `~6.0.24` (File-based Routing)
- **[TypeScript](https://www.typescriptlang.org/)** `~5.9.2`
- **[React Native Safe Area Context](https://github.com/th3rdwave/react-native-safe-area-context)**

---

## 📂 Estrutura do Projeto

```text
des_Mobile/
├── assets/                       # Imagens, ícones e assets estáticos
├── src/
│   ├── app/                      # Rotas e telas do aplicativo (Expo Router)
│   │   ├── _layout.tsx           # Layout raiz com Stack Navigation (sem header)
│   │   ├── index.tsx             # Hub principal com menu de navegação
│   │   ├── Atividade1/           # Atividade 1: Exibição de Imagens e Botões
│   │   ├── Atividade2/           # Atividade 2: Tela de Login
│   │   ├── Atividade3_Aluno/     # Atividade 3: Formulário de Cadastro de Aluno
│   │   ├── Atividade3_Contato/   # Atividade 3: Formulário de Cadastro de Contato
│   │   ├── Atividade4/           # Atividade 4: Contador Interativo com useState
│   │   ├── Atividade5/           # Atividade 5: Cadastro de Usuário e exibição de dados
│   │   ├── Atividade6/           # Atividade 6: Calculadora de Consumo de Ração
│   │   └── Atividade7/           # Atividade 7: Simulador de Seguro Veicular
│   ├── components/               # Componentes reutilizáveis
│   │   ├── Botao/                # Componente customizado de Botão
│   │   └── EntradaTexto/         # Componente customizado de Campo de Texto
│   └── styles/                   # Folhas de estilo modularizadas (StyleSheet)
│       ├── atividade1_styles.ts
│       ├── atividade2_styles.ts
│       ├── atividade3_styles.ts
│       ├── atividade4_styles.ts
│       ├── atividade5_styles.ts
│       ├── atividade6_styles.ts
│       ├── atividade7_styles.ts
│       └── hub_styles.ts
├── estudos_prova/                # Material e exercícios práticos de fixação
│   ├── app/
│   ├── components/
│   ├── styles/
│   └── DICAS.md                  # Resumo teórico de React Native e TypeScript
├── app.json                      # Configurações do Expo e Expo Router
├── package.json                  # Dependências e scripts do projeto
└── tsconfig.json                 # Configuração do TypeScript
```

---

## 🎯 Atividades Desenvolvidas

| Atividade | Descrição | Rota |
| :--- | :--- | :--- |
| **Hub Principal** | Menu de seleção para navegar por todas as atividades | `/` |
| **Atividade 1** | Exibição de imagem (Totodile) e botões de ação | `/Atividade1` |
| **Atividade 2** | Tela de autenticação e login | `/Atividade2` |
| **Atividade 3 (Contato)** | Formulário para cadastro de contatos | `/Atividade3_Contato` |
| **Atividade 3 (Aluno)** | Formulário para cadastro de dados do aluno | `/Atividade3_Aluno` |
| **Atividade 4** | Contador interativo com manipulação de estado (`useState`) | `/Atividade4` |
| **Atividade 5** | Cadastro de usuário com validação e feedback visual | `/Atividade5` |
| **Atividade 6** | Cálculo e projeção de consumo de ração animal | `/Atividade6` |
| **Atividade 7** | Simulação e cálculo de proposta para seguro veicular | `/Atividade7` |

---

## 🛠️ Como Executar o Projeto

### Pré-requisitos
- [Node.js](https://nodejs.org/) (versão LTS recomendada)
- Aplicativo [Expo Go](https://expo.dev/go) instalado no seu dispositivo móvel (Android/iOS)

### Passo a passo

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/sudo-apt-install-Steven/des_Mobile.git
   cd des_Mobile
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Inicie o servidor de desenvolvimento:**
   ```bash
   npx expo start -c
   ```

4. **Abra no dispositivo:**
   - No **Android**: Abra o aplicativo Expo Go e escaneie o QR Code exibido no terminal.
   - No **iOS**: Abra o aplicativo Câmera e escaneie o QR Code exibido no terminal.

---

## 👤 Autor

- **Steven** - [sudo-apt-install-Steven](https://github.com/sudo-apt-install-Steven)
- Email institucional: [melos.s@estudante.ifro.edu.br](mailto:melos.s@estudante.ifro.edu.br)
