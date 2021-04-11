import React from 'react';
import { useLocation } from 'react-router-dom';

export default function useQuery<
  T extends { [key: string]: string | undefined }
>(): T {
  const { search } = useLocation();

  return React.useMemo<T>(() => {
    const paramArray = [
      ...new URLSearchParams(search).entries(),
      ...new URLSearchParams(window.location.search).entries(),
    ];
    const paramObject = paramArray.reduce<{ [key: string]: string }>(
      (obj, entry) => {
        const [key, value] = entry;
        obj[key] = value; // eslint-disable-line no-param-reassign
        return obj;
      },
      {},
    );

    return paramObject as T;
  }, [search]);
}
