declare namespace JSX {
  type Element = any;
  interface IntrinsicAttributes {
    key?: string | number | null | undefined;
  }
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

declare namespace NodeJS {
  type Timeout = any;
}

declare namespace React {
  export type ReactNode =
    | string
    | number
    | boolean
    | null
    | undefined
    | JSX.Element
    | Iterable<ReactNode>;

  export interface ReactElement<P = any, T = any> {
    type: T;
    props: P;
    key: any;
  }

  export type FC<P = {}> = (props: P) => JSX.Element | null;
  export type ReactElementConstructor<P> = (props: P) => JSX.Element | null;

  export function useState<T>(initialState: T | (() => T)): [T, (newState: T | ((prevState: T) => T)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: readonly any[]): void;
  export function useMemo<T>(factory: () => T, deps: readonly any[] | undefined): T;
  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: readonly any[]): T;
  export function useRef<T>(initialValue: T): { current: T };
  export function createContext<T>(defaultValue: T): {
    Provider: FC<{ value: T; children?: ReactNode }>;
    Consumer: FC<{ children: (value: T) => ReactNode }>;
  };
  export function useContext<T>(context: { Provider: FC<{ value: T; children?: ReactNode }> }): T;
  export function createElement(type: any, props?: any, ...children: any[]): JSX.Element;
}

declare module 'react' {
  export = React;
  export as namespace React;
}

declare module 'react/jsx-runtime' {
  export function jsx(type: any, props: any, key?: any): JSX.Element;
  export function jsxs(type: any, props: any, key?: any): JSX.Element;
  export const Fragment: any;
}

declare module 'react-native' {
  export type DimensionValue = number | string;

  export interface ViewStyle {
    flex?: number;
    flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
    justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
    alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
    alignSelf?: 'auto' | 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
    backgroundColor?: string;
    padding?: number;
    paddingHorizontal?: number;
    paddingVertical?: number;
    paddingTop?: number;
    paddingBottom?: number;
    paddingLeft?: number;
    paddingRight?: number;
    margin?: number;
    marginHorizontal?: number;
    marginVertical?: number;
    marginTop?: number;
    marginBottom?: number;
    marginLeft?: number;
    marginRight?: number;
    borderRadius?: number;
    borderWidth?: number;
    borderColor?: string;
    borderBottomWidth?: number;
    borderBottomColor?: string;
    width?: DimensionValue;
    height?: DimensionValue;
    minHeight?: DimensionValue;
    maxHeight?: DimensionValue;
    minWidth?: DimensionValue;
    maxWidth?: DimensionValue;
    gap?: number;
    opacity?: number;
    position?: 'absolute' | 'relative';
    top?: DimensionValue;
    bottom?: DimensionValue;
    left?: DimensionValue;
    right?: DimensionValue;
    zIndex?: number;
    shadowColor?: string;
    shadowOffset?: { width: number; height: number };
    shadowOpacity?: number;
    shadowRadius?: number;
    elevation?: number;
    overflow?: 'visible' | 'hidden' | 'scroll';
    flexWrap?: 'wrap' | 'nowrap' | 'wrap-reverse';
  }

  export interface TextStyle extends ViewStyle {
    color?: string;
    fontSize?: number;
    fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900' | 'ultrabold';
    textAlign?: 'auto' | 'left' | 'right' | 'center' | 'justify';
    lineHeight?: number;
    textDecorationLine?: 'none' | 'underline' | 'line-through' | 'underline line-through';
    letterSpacing?: number;
    textTransform?: 'none' | 'capitalize' | 'uppercase' | 'lowercase';
  }

  export interface ViewProps {
    style?: ViewStyle | TextStyle | (ViewStyle | TextStyle | undefined | null | false)[];
    children?: React.ReactNode;
    testID?: string;
  }

  export interface TextProps {
    style?: TextStyle | (TextStyle | undefined | null | false)[];
    children?: React.ReactNode;
    numberOfLines?: number;
    testID?: string;
  }

  export interface TextInputProps {
    value?: string;
    onChangeText?: (text: string) => void;
    placeholder?: string;
    placeholderTextColor?: string;
    secureTextEntry?: boolean;
    keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
    maxLength?: number;
    editable?: boolean;
    multiline?: boolean;
    numberOfLines?: number;
    style?: TextStyle | (TextStyle | undefined | null | false | (TextStyle | undefined | null | false)[])[] | any;
    testID?: string;
  }

  export interface TouchableOpacityProps extends ViewProps {
    onPress?: () => void;
    disabled?: boolean;
    activeOpacity?: number;
  }

  export interface PressableProps extends ViewProps {
    onPress?: () => void;
    disabled?: boolean;
  }

  export interface ScrollViewProps extends ViewProps {
    contentContainerStyle?: ViewStyle | (ViewStyle | undefined | null | false)[];
    showsVerticalScrollIndicator?: boolean;
  }

  export interface ModalProps {
    visible?: boolean;
    transparent?: boolean;
    animationType?: 'none' | 'slide' | 'fade';
    onRequestClose?: () => void;
    children?: React.ReactNode;
  }

  export const View: (props: ViewProps) => JSX.Element;
  export const Text: (props: TextProps) => JSX.Element;
  export const TextInput: (props: TextInputProps) => JSX.Element;
  export const TouchableOpacity: (props: TouchableOpacityProps) => JSX.Element;
  export const Pressable: (props: PressableProps) => JSX.Element;
  export const ScrollView: (props: ScrollViewProps) => JSX.Element;
  export const Modal: (props: ModalProps) => JSX.Element;
  export const SafeAreaView: (props: ViewProps) => JSX.Element;
  export const Image: (props: any) => JSX.Element;
  export const ImageBackground: (props: any) => JSX.Element;

  export const Dimensions: {
    get(dim: 'window' | 'screen'): { width: number; height: number };
  };

  export const Easing: {
    linear: any;
    ease: any;
    quad: any;
    cubic: any;
    inOut: (easing: any) => any;
    out: (easing: any) => any;
  };

  export const Animated: any;

  export const StyleSheet: {
    create<T extends Record<string, ViewStyle | TextStyle>>(styles: T): T;
    absoluteFillObject: any;
  };
}

declare module 'expo-router' {
  export interface Router {
    push(href: string): void;
    replace(href: string): void;
    back(): void;
  }

  export function useRouter(): Router;
  export function useLocalSearchParams<T extends Record<string, string | undefined> = Record<string, string | undefined>>(): T;
  export function useSegments(): string[];
  export function Slot(): JSX.Element;
  export function Stack(props?: any): JSX.Element;
  export namespace Stack {
    export const Screen: (props: { name?: string; options?: any }) => JSX.Element;
  }
  export function Tabs(props?: any): JSX.Element;
  export namespace Tabs {
    export const Screen: (props: { name?: string; options?: any }) => JSX.Element;
  }
  export function Link(props: { href: string; children: React.ReactNode; asChild?: boolean; style?: any }): JSX.Element;
  export function Redirect(props: { href: string }): JSX.Element;
}


declare module 'vitest' {
  export function describe(name: string, fn: () => void): void;
  export function it(name: string, fn: () => void | Promise<void>): void;
  export function test(name: string, fn: () => void | Promise<void>): void;
  export function beforeEach(fn: () => void | Promise<void>): void;
  export function afterEach(fn: () => void | Promise<void>): void;
  export function expect(actual: any): {
    toBe(expected: any): void;
    toEqual(expected: any): void;
    toBeTruthy(): void;
    toBeFalsy(): void;
    toBeDefined(): void;
    toBeUndefined(): void;
    toBeGreaterThan(expected: number): void;
    toBeLessThan(expected: number): void;
    toBeGreaterThanOrEqual(expected: number): void;
    toBeLessThanOrEqual(expected: number): void;
    toContain(expected: any): void;
    toThrow(expected?: any): void;
    not: {
      toBe(expected: any): void;
      toEqual(expected: any): void;
      toContain(expected: any): void;
    };
  };
}
