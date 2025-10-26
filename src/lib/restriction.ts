export interface FilterRestriction<T> {
  [key: string]: (data: T) => T;
}
