import React, { ReactElement, useCallback, useContext } from 'react';
import {
  Redirect,
  Route,
  RouteComponentProps,
  RouteProps,
  useLocation,
} from 'react-router';
import { AuthContext } from 'services/auth/authcontext';

function PrivateRoute(props: RouteProps): ReactElement {
  const { component: Component, children, ...routeProps } = props;

  const { authState } = useContext(AuthContext);
  const { pathname } = useLocation();

  const render = useCallback(
    (renderProps: RouteComponentProps): React.ReactNode => {
      if (authState.loading) {
        return null;
      }

      if (!authState.user) {
        return (
          <Redirect to={`/signin/?returnUrl=${encodeURIComponent(pathname)}`} />
        );
      }

      if (Component) {
        // eslint-disable-next-line react/jsx-props-no-spreading
        return <Component {...renderProps} />;
      }

      if (children) {
        if (typeof children === 'function') {
          return children(renderProps);
        }

        return children;
      }

      return null;
    },
    [authState, pathname, children, Component],
  );

  // eslint-disable-next-line react/jsx-props-no-spreading
  return <Route {...routeProps} render={render} />;
}

export default PrivateRoute;
