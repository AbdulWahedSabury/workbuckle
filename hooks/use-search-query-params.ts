'use client';

import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';

type useSearchQueryParamProp<TParamKeys extends string> = Record<
  TParamKeys,
  string
> & {
  query: string;
  toString(): string;
  hasParam(key: TParamKeys): boolean;
  getActiveKeys(): TParamKeys[];
};

export const useSearchQueryParam = <TParamKeys extends string = string>(
  defaultParams: Partial<Record<TParamKeys, string>> = {}
): useSearchQueryParamProp<TParamKeys> => {
  const browserSearchParams = useSearchParams();

  return useMemo(() => {
    const mergedParams = {} as Record<TParamKeys, string>;

    browserSearchParams.forEach((paramValue, paramKey) => {
      mergedParams[paramKey as TParamKeys] = paramValue;
    });

    Object.entries(defaultParams).forEach(([paramKey, defaultValue]) => {
      const typedKey = paramKey as TParamKeys;
      if (!(typedKey in mergedParams) && typeof defaultValue === 'string') {
        mergedParams[typedKey] = defaultValue;
      }
    });

    const toString = (): string => {
      const queryStringParts: string[] = [];

      Object.entries(mergedParams).forEach(([paramKey, paramValue]) => {
        const key = paramKey as TParamKeys;
        const value = paramValue as string;

        if (value && typeof value === 'string' && value?.trim() !== '') {
          const encodedKey = encodeURIComponent(key);
          const encodedValue = encodeURIComponent(value);
          queryStringParts.push(`${encodedKey}=${encodedValue}`);
        }
      });

      return queryStringParts.length > 0 ? `${queryStringParts.join('&')}` : '';
    };

    const checkParamExists = (paramKey: TParamKeys): boolean => {
      const paramValue = mergedParams[paramKey];
      return Boolean(paramValue && paramValue.trim() !== '');
    };

    const getActiveParamKeys = (): TParamKeys[] => {
      return Object.entries(mergedParams)
        .filter(
          ([, value]) =>
            typeof value === 'string' && Boolean(value && value.trim() !== '')
        )
        .map(([key]) => key as TParamKeys);
    };

    return Object.assign(mergedParams, {
      query: toString(),
      toString: toString,
      hasParam: checkParamExists,
      getActiveKeys: getActiveParamKeys,
    }) as useSearchQueryParamProp<TParamKeys>;
  }, [browserSearchParams, defaultParams]);
};
