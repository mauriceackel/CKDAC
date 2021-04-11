import React, {
  FunctionComponent,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';

function usePrompt<
  S,
  T extends { isOpen: boolean; onDismiss?: (data?: S) => void },
  U extends FunctionComponent<T>
>(
  Component: U,
): [
  () => Promise<S | undefined>,
  FunctionComponent<Omit<T, 'onDismiss' | 'isOpen'>>,
] {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const promiseRef = useRef<{
    resolve: (data?: S) => void;
    reject: (data?: S) => void;
  }>();

  const openPrompt = useCallback((): Promise<S | undefined> => {
    if (isOpen) {
      throw new Error('Prompt already open');
    }

    setIsOpen(true);
    return new Promise<S | undefined>((resolve, reject) => {
      promiseRef.current = { resolve, reject };
    });
  }, [isOpen]);

  const callback = useCallback((data: S) => {
    setIsOpen(false);
    promiseRef.current?.resolve(data);
  }, []);

  const WrappedComponent = useMemo(() => {
    return (props: Omit<T, 'isOpen' | 'onDismiss'>) => {
      const newProps = {
        ...props,
        onDismiss: callback,
        isOpen,
      };

      // eslint-disable-next-line react/jsx-props-no-spreading
      return <Component {...(newProps as any)} />;
    };
  }, [Component, isOpen, callback]);

  // const prompt = useMemo(() => {
  //   if (isOpen) {
  //     return null;
  //   }

  //   return wrapper(<Component callback={promiseRef.current?.resolve} />);
  // }, [Component, isOpen]);

  return useMemo(() => [openPrompt, WrappedComponent], [
    openPrompt,
    WrappedComponent,
  ]);
}

export default usePrompt;
