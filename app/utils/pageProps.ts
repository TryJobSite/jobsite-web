import type { ReactNode } from 'react';

export type PageProps<
  Params extends string | string[] | never = never,
  Search extends string | string[] | never = never,
> = {
  params: Promise<
    Params extends never
      ? never
      : Params extends string
      ? { [key in Params]: string }
      : { [key in Params[number]]: string }
  >;
  searchParams: Promise<
    Search extends never
      ? unknown
      : Search extends string
      ? { [key in Search]: string | undefined }
      : { [key in Search[number]]: string | undefined }
  >;
};

export type LayoutProps<
  Params extends string | string[] | never = never,
  Search extends string | string[] | never = never,
> = {
  params: Promise<
    Params extends never
      ? never
      : Params extends string
      ? { [key in Params]: string }
      : { [key in Params[number]]: string }
  >;
  searchParams: Promise<
    Search extends never
      ? unknown
      : Search extends string
      ? { [key in Search]: string | undefined }
      : { [key in Search[number]]: string | undefined }
  >;
  children: ReactNode;
};

// PageProps<['params1','params2'], ['search1','search2']>
// {params: {params1: string, params2: string}, searchParams: {search1: string | undefined, search2: string | undefined}}
