import ValidatedInput from 'components/ValidatedInput';
import React, { ReactElement, useContext } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { getUser, updateUser } from 'services/userservice';
import { AuthContext } from 'services/auth/authcontext';

// #region Form Validation
const UserSchema = yup.object({
  email: yup
    .string()
    .required('Email is required')
    .email('Email has a wrong format'),
  password: yup.string().test({
    name: 'null_or_min',
    test: (val) => !val || val.length >= 8,
  }),
  passwordConfirm: yup.string().test({
    name: 'mismatch',
    test: (value, context) =>
      !context.parent.password || context.parent.password === value,
    message: "Passwords don't match",
  }),
  firstname: yup.string().required('First name is required'),
  lastname: yup.string().required('Last name is required'),
});

type UserData = yup.InferType<typeof UserSchema>;
// #endregion

function SignIn(): ReactElement {
  const {
    authState: { user },
    authStateChanged,
  } = useContext(AuthContext);

  const { register, handleSubmit, errors, setError } = useForm({
    resolver: yupResolver(UserSchema),
  });

  async function handleUpdate(userData: UserData) {
    if (!user) {
      return;
    }

    try {
      await updateUser({
        id: user.id,
        email: userData.email,
        firstname: userData.firstname,
        lastname: userData.lastname,
        ...(userData.password ? { password: userData.password } : null),
      });
      const updatedUser = await getUser(user.id!);
      authStateChanged(updatedUser);

      setError('success', {
        type: 'manual',
        message: 'User was updated successfully.',
      });
    } catch (err) {
      console.log(err);
      setError('error', {
        type: 'manual',
        message: 'An error occurred. Please try again later.',
      });
    }
  }

  return (
    <div className="content-page flex flex-col items-center">
      <form
        noValidate
        onSubmit={handleSubmit(handleUpdate)}
        className="mt-4 flex flex-col shadow-lg p-8 rounded"
      >
        <p className="font-bold text-sm">First Name</p>
        <ValidatedInput name="firstname" register={register} errors={errors}>
          <input type="text" className="input" defaultValue={user?.firstname} />
        </ValidatedInput>
        <p className="mt-2 font-bold text-sm">Last Name</p>
        <ValidatedInput name="lastname" register={register} errors={errors}>
          <input type="test" className="input" defaultValue={user?.lastname} />
        </ValidatedInput>
        <p className="mt-2 font-bold text-sm">Email</p>
        <ValidatedInput name="email" register={register} errors={errors}>
          <input type="email" className="input" defaultValue={user?.email} />
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

        {errors.error && (
          <p className="text-sm text-red-600">{errors.error.message}</p>
        )}

        {errors.success && (
          <p className="text-sm text-green-600">{errors.success.message}</p>
        )}

        <button
          type="submit"
          className="mt-4 button shadow-lg bg-red-900 text-white"
        >
          Update Data
        </button>
      </form>
    </div>
  );
}

export default SignIn;
