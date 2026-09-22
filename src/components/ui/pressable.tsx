import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

type Props = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
};

export function PressableOpacity({ style, children, ...rest }: Props) {
  return (
    <Pressable
      {...rest}
      style={({ pressed }) => [style, pressed && !rest.disabled ? { opacity: 0.72 } : null]}
    >
      {children}
    </Pressable>
  );
}
