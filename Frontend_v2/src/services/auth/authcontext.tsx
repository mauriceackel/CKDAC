import React, {
  PropsWithChildren,
  ReactElement,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { UserModel } from 'models/UserModel';
import { getUser } from 'services/userservice';
import axios from 'axios';
import { AUTH_BASE_URL } from 'config';
import { getSignedInUserId, refreshAccessToken } from './authservice';

type AuthSate = { user?: UserModel; loading: boolean };
const initialState: AuthSate = {
  user: undefined,
  loading: true,
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

  const authStateChanged = (user: UserModel | undefined) => {
    setAuthState({ user, loading: false });
  };

  // #region Request interceptors
  const refreshInProgress = useRef<boolean>(false);
  const requestQueue = useRef<
    { resolve: (accessToken: string) => void; reject: (reason?: any) => void }[]
  >([]);

  const addAccessTokenInterceptor = useCallback(
    () =>
      axios.interceptors.request.use((request) => {
        if (request.headers.Authorization) {
          return request;
        }

        // If authorization header is not set, add access token
        const accessToken = localStorage.getItem('accessToken');
        request.headers.Authorization = `Bearer ${accessToken}`;

        return request;
      }),
    [],
  );

  const addRefreshInterceptor = useCallback(
    () =>
      axios.interceptors.response.use(undefined, async (error) => {
        const originalRequest = error.config;

        if (
          error.response?.status === 401 &&
          !originalRequest.isRetry &&
          originalRequest.url !== `${AUTH_BASE_URL}/renew`
        ) {
          // We received an error but we are already refreshing the token initiated by an earlier request
          if (refreshInProgress.current) {
            // Queue the request and wait for the first refresh request to finish

            const awaiter = new Promise<string>((resolve, reject) =>
              // We add the promise methods to the queue so we can resolve this promise later
              requestQueue.current.push({ resolve, reject }),
            );

            return awaiter.then((accessToken) =>
              axios({
                ...originalRequest,
                isRetry: true,
                headers: {
                  ...originalRequest.headers,
                  Authorization: `Bearer ${accessToken}`,
                },
              }),
            );
          }

          // This is the first 401 we get so we try to refresh the token
          try {
            refreshInProgress.current = true;

            const { accessToken } = await refreshAccessToken();

            // Refreshing the token succeeded, now process all potentially enqueued requests
            requestQueue.current.forEach((request) =>
              request.resolve(accessToken),
            );

            // Set flag in order to not end up in endless loop
            originalRequest.isRetry = true;
            // Update access token so that next request will succeed
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;

            // Retry request
            return axios(originalRequest);
          } catch (err) {
            // We had an error refreshing the token

            // Remove the user as he/she is not signed in anymore
            authStateChanged(undefined);

            // Also reject all waiting requests
            requestQueue.current.forEach((request) => request.reject(err));

            return Promise.reject(err);
          } finally {
            refreshInProgress.current = false;
            requestQueue.current = [];
          }
        }

        // If the error was not a 401 or we already retried, return the error
        return Promise.reject(error);
      }),
    [],
  );

  useEffect(() => {
    const accessTokenInterceptorId = addAccessTokenInterceptor();
    const refreshInterceptorId = addRefreshInterceptor();

    return () => {
      axios.interceptors.request.eject(accessTokenInterceptorId);
      axios.interceptors.request.eject(refreshInterceptorId);
    };
  }, [addAccessTokenInterceptor, addRefreshInterceptor]);
  // #endregion

  // #region Load user
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
          loading: false,
        })),
      )
      .catch(() =>
        setAuthState((current) => ({
          ...current,
          user: undefined,
          loading: false,
        })),
      );
  }, []);
  // #endregion

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
