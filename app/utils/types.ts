export type OmitRecursively<T, K extends string> = T extends object
  ? {
      [P in keyof T as P extends K ? never : P]: OmitRecursively<T[P], K>;
    }
  : T;

