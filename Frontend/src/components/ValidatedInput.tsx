/* eslint-disable react/require-default-props */
import React, { ReactElement } from 'react';
import { DeepMap, FieldError } from 'react-hook-form';

type ValidatedInputProps<T = Record<string, unknown>> = {
  name: keyof T & string;
  register: any;
  errors?: DeepMap<T, FieldError> &
    DeepMap<Record<string, unknown>, FieldError>;
  children: ReactElement;
};

function ValidatedInput<T extends Record<string, unknown>>(
  props: ValidatedInputProps<T>,
): ReactElement {
  const { name, register, errors, children: child } = props;

  return (
    <>
      {React.cloneElement(child, { name, ref: register })}
      <p className="h-4 text-sm text-red-600">{errors?.[name]?.message}</p>
    </>
  );
}

export default ValidatedInput;
