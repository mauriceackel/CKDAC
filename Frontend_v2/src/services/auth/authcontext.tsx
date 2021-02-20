import React, {
  PropsWithChildren,
  ReactElement,
  useEffect,
  useState,
} from 'react';
import { UserModel } from 'models/UserModel';
import { getUser } from 'services/userservice';
import { getSignedInUserId } from './authservice';

type AuthSate = { user?: UserModel };
const initialState: AuthSate = {
  user: undefined,
};

const AuthContext = React.createContext<{
  authState: AuthSate;
  authStateChanged: (user: UserModel | undefined) => void;
}>({
  authState: initialState,
  authStateChanged: () => {},
});

function AuthProvider({ children }: PropsWithChildren<unknown>): ReactElement {
  const [authState, setAuthState] = useState(initialState);

  useEffect(() => {
    const userId = getSignedInUserId();

    if (!userId) {
      return;
    }

    getUser(userId)
      .then((user) =>
        setAuthState((current) => ({
          ...current,
          user,
        })),
      )
      .catch(() =>
        setAuthState((current) => ({
          ...current,
          user: undefined,
        })),
      );
  }, []);

  const authStateChanged = (user: UserModel | undefined) => {
    setAuthState({ user });
  };

  return (
    <AuthContext.Provider
      value={{
        authState,
        authStateChanged,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export { AuthProvider, AuthContext };
