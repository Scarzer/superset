declare module 'rison' {
  const rison: {
    encode(value: unknown): string;
    decode<T = unknown>(value: string): T;
  };

  export default rison;
}