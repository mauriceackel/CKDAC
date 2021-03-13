import ValidatedInput from 'components/ValidatedInput';
import React, { ReactElement, useContext } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { signIn } from 'services/auth/authservice';
import useQuery from 'utils/hooks/useQuery';
import { useHistory, useLocation } from 'react-router';
import { Link } from 'react-router-dom';
import { getUser } from 'services/userservice';
import { AuthContext } from 'services/auth/authcontext';

// #region Form Validation
const SignInSchema = yup.object({
  email: yup
    .string()
    .required('Email is required')
    .email('Email has a wrong format'),
  password: yup.string().required('Password is required'),
});

type SignInData = yup.InferType<typeof SignInSchema>;
// #endregion

function SignIn(): ReactElement {
  const { returnUrl } = useQuery<{ returnUrl: string }>();
  const { authStateChanged } = useContext(AuthContext);
  const history = useHistory();
  const location = useLocation();

  const { register, handleSubmit, errors, setError } = useForm({
    resolver: yupResolver(SignInSchema),
  });

  async function handleSignIn(signInData: SignInData) {
    try {
      const userId = await signIn(signInData.email, signInData.password);
      const user = await getUser(userId);
      authStateChanged(user);

      if (returnUrl) {
        history.push(returnUrl);
      } else {
        history.push('/');
      }
    } catch (err) {
      console.log(err);
      setError('signin', {
        type: 'manual',
        message: 'Wrong email address or password',
      });
    }
  }

  return (
    <div className="content-page flex flex-col items-center">
      <form
        noValidate
        onSubmit={handleSubmit(handleSignIn)}
        className="mt-4 flex flex-col shadow-lg p-8 rounded small-form"
      >
        <p className="font-bold text-sm">Email</p>
        <ValidatedInput name="email" register={register} errors={errors}>
          <input type="email" className="input" />
        </ValidatedInput>
        <p className="mt-2 font-bold text-sm">Password</p>
        <ValidatedInput name="password" register={register} errors={errors}>
          <input type="password" className="input" />
        </ValidatedInput>

        {errors.signin && (
          <p className="text-sm text-red-600">{errors.signin.message}</p>
        )}

        <button
          type="submit"
          className="mt-4 button shadow-lg bg-red-900 text-white"
        >
          Sign In
        </button>

        <Link
          to={`/signup/${location.search ?? ''}`}
          className="mt-4 text-center button shadow-lg bg-red-900 text-white"
        >
          Sign Up
        </Link>
      </form>
    </div>
  );
}

export default SignIn;
