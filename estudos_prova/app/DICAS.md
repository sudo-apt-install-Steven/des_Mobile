# Dicas de React Native e TypeScript

Aqui estão os conceitos fundamentais para a sua prova:

## 1. TS vs TSX
- **`.ts` (TypeScript)**: Arquivo focado em lógica, funções, tipos e estilos (ex: `styles.ts`). **Não renderiza componentes na tela** (não aceita sintaxe HTML/XML).
- **`.tsx` (TypeScript JSX)**: O "cérebro da interface". Mistura lógica TypeScript com componentes visuais JSX. **É aqui que você renderiza a tela** usando tags como `<View>`, `<Text>`, etc.

## 2. Componentes Fundamentais
Lembre-se que no React Native, tudo começa com letra **Maiúscula**.
- `<View>`: Como uma `div` no HTML. É o contêiner principal para agrupar outros elementos.
- `<Text>`: Usado para exibir qualquer tipo de texto. (`text` minúsculo dará erro de importação).
- `<TextInput>`: Campo para o usuário digitar. Principais propriedades (props):
  - `placeholder="Digite aqui"`
  - `placeholderTextColor="#999"`
  - `value={variavel}`
  - `onChangeText={funcao}`
- `<Image>`: Exibe imagens. Precisa da prop `source`.
  - Imagem local: `source={require('./caminho/img.png')}`
  - Imagem da web: `source={{ uri: 'https://site.com/img.png' }}`

## 3. Botões e Toques
- `<TouchableOpacity>`: Botão clássico. Ao ser pressionado, reduz a opacidade levemente.
- `<Pressable>`: Componente mais moderno para toques. Permite customizações mais finas dependendo do estado (pressionado ou não).
- **Eventos:** O principal evento é o `onPress` (disparado ao soltar o clique). Outros incluem `onPressIn` (ao tocar) e `onPressOut` (ao soltar).
  - Ex: `<TouchableOpacity onPress={() => console.log('Clicou')}>`

## 4. Estilização (StyleSheet)
- Estilos no React Native usam **camelCase**, diferente do CSS web.
  - Web: `background-color` -> RN: `backgroundColor`
  - Web: `border-radius` -> RN: `borderRadius`
- **Flexbox**: O padrão do RN é `flexDirection: 'column'` (de cima para baixo).
  - `justifyContent`: Alinha itens no eixo principal (vertical por padrão).
  - `alignItems`: Alinha itens no eixo secundário (horizontal por padrão).
- Exportação: O arquivo de estilos deve exportar o objeto criado.
  - `export const styles = StyleSheet.create({ ... })`
  - Importação na tela: `import { styles } from './styles'`

## 5. Componentização e Props
Você pode criar componentes personalizados para não repetir código.
```tsx
type MeuBotaoProps = {
  titulo: string;
}

export function MeuBotao({ titulo }: MeuBotaoProps) {
  return (
    <TouchableOpacity>
      <Text>{titulo}</Text>
    </TouchableOpacity>
  )
}
```
Uso: `<MeuBotao titulo="Salvar" />`
