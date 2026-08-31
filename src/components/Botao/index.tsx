import { Text, Pressable, PressableProps } from "react-native";
import { styles } from "./styles";

type BotaoProps = PressableProps & {
    titulo: string;
    corDeFundo?: string;
}

export default function Botao({ titulo, corDeFundo, ...rest }: BotaoProps) {
    return (
        <Pressable 
            style={[styles.btn, corDeFundo ? { backgroundColor: corDeFundo } : {}]} 
            {...rest}
        >
            <Text style={styles.btntxt}>{titulo}</Text>
        </Pressable>
    )
}
