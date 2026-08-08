import { Text, Pressable, PressableProps } from "react-native";
import { styles } from "./styles";

type BotaoProps = PressableProps & {
    titulo: string
}

export default function Botao({ titulo, ...rest }: BotaoProps) {
    return (
        <Pressable style={styles.btn} {...rest}>
            <Text style={styles.btntxt}>{titulo}</Text>
        </Pressable>
    )
}