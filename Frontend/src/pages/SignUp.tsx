import ValidatedInput from 'components/ValidatedInput';
import React, { ReactElement } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { signUp } from 'services/auth/authservice';
import { useHistory, useLocation } from 'react-router';

// #region Form Validation
const SignUpSchema = yup.object({
  email: yup
    .string()
    .required('Email is required')
    .email('Email has a wrong format'),
  firstname: yup.string().required('First name is required'),
  lastname: yup.string().required('Last name is required'),
  password: yup
    .string()
    .min(8, 'Password is too short')
    .required('Password is required'),
  passwordConfirm: yup.string().test({
    name: 'mismatch',
    test: (value, context) => context.parent.password === value,
    message: "Passwords don't match",
  }),
});
type SignUpData = yup.InferType<typeof SignUpSchema>;
// #endregion

function SignUp(): ReactElement {
  const history = useHistory();
  const location = useLocation();

  const { register, handleSubmit, errors, setError } = useForm({
    resolver: yupResolver(SignUpSchema),
  });

  async function handleSignUp(signUpData: SignUpData) {
    try {
      const { passwordConfirm, ...userData } = signUpData;

      await signUp(userData);

      history.push(`/signin/${location.search ?? ''}`);
    } catch (err) {
      console.log(err);
      setError('signup', {
        type: 'manual',
        message: 'An error occurred. Please try again later.',
      });
    }
  }

  return (
    <div className="content-page flex flex-col items-center">
      <form
        noValidate
        onSubmit={handleSubmit(handleSignUp)}
        className="mt-4 flex flex-col shadow-lg p-8 rounded small-form"
      >
        <p className="font-bold text-sm">First Name</p>
        <ValidatedInput name="firstname" register={register} errors={errors}>
          <input type="text" className="input" />
        </ValidatedInput>
        <p className="mt-2 font-bold text-sm">Last Name</p>
        <ValidatedInput name="lastname" register={register} errors={errors}>
          <input type="test" className="input" />
        </ValidatedInput>
        <p className="mt-2 font-bold text-sm">Email</p>
        <ValidatedInput name="email" register={register} errors={errors}>
          <input type="email" className="input" />
        </ValidatedInput>
        <p className="mt-2 font-bold text-sm">Password</p>
        <ValidatedInput name="password" register={register} errors={errors}>
          <input type="password" className="input" />
        </ValidatedInput>
        <p className="mt-2 font-bold text-sm">Password Confirmation</p>
        <ValidatedInput
          name="passwordConfirm"
          register={register}
          errors={errors}
        >
          <input type="password" className="input" />
        </ValidatedInput>

        {errors.signup && (
          <p className="text-sm text-red-600">{errors.signup.message}</p>
        )}

        <button
          type="submit"
          className="mt-4 button shadow-lg bg-red-900 text-white"
        >
          Sign Up
        </button>
      </form>
    </div>
  );
}

export default SignUp;
