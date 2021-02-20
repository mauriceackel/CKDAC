/* Theme variables */
import './styles/tailwind.css';
import './styles/global.css';

import React, { ReactElement } from 'react';
import {
  Route,
  Switch,
  BrowserRouter as Router,
  NavLink,
} from 'react-router-dom';
import { AuthProvider } from 'services/auth/authcontext';
import ChevronRightIcon from 'components/Icons/ChevronRightIcon';
import UserIcon from 'components/Icons/UserIcon';

import Home from 'pages/Home';
import SignIn from 'pages/SignIn';
import SignUp from 'pages/SignUp';
import AccountPopover from 'components/AccountPopover';
import Account from 'pages/Account';
import InterfaceEditor from 'pages/InterfaceEditor';

export default function App(): ReactElement {
  return (
    <AuthProvider>
      <Router>
        <header className="fixed top-0 left-0 right-0 h-14 shadow-md flex items-center justify-between px-4 bg-red-900 text-white">
          <h1 className="text-xl mr-2">SYMBIOTE</h1>

          <NavLink
            to="/"
            exact
            className="mx-2 p-2 rounded"
            activeClassName="bg-translucent"
          >
            Home
          </NavLink>

          <NavLink
            to="/openapi/"
            className="mx-2 p-2 rounded"
            activeClassName="bg-translucent"
          >
            OpenApi
          </NavLink>

          <NavLink
            to="/asyncapi/"
            className="mx-2 p-2 rounded"
            activeClassName="bg-translucent"
          >
            AsyncApi
          </NavLink>

          <Switch>
            <Route strict path={['/openapi/', '/asyncapi/']}>
              <ChevronRightIcon className="w-4 h-4" />

              <NavLink
                to="./create"
                className="mx-2 p-2 rounded"
                activeClassName="bg-translucent"
              >
                Create Mapping
              </NavLink>

              <NavLink
                to="./edit"
                className="mx-2 p-2 rounded"
                activeClassName="bg-translucent"
              >
                Edit Mapping
              </NavLink>

              <NavLink
                to="./apis"
                className="mx-2 p-2 rounded"
                activeClassName="bg-translucent"
              >
                Manage APIs
              </NavLink>
            </Route>
          </Switch>

          <div className="flex-1" />

          <AccountPopover>
            <button
              type="button"
              className="p-2 rounded-full text-black bg-white shadow-lg focus:outline-none"
            >
              <UserIcon className="w-5" />
            </button>
          </AccountPopover>
        </header>

        <div className="main-page px-6 flex flex-col items-center">
          <Switch>
            <Route strict exact path="/">
              <Home />
            </Route>
            <Route strict exact path="/:mode/apis">
              <InterfaceEditor />
            </Route>

            <Route strict exact path="/signin/">
              <SignIn />
            </Route>
            <Route strict exact path="/signup/">
              <SignUp />
            </Route>
            <Route strict exact path="/account/">
              <Account />
            </Route>
          </Switch>
        </div>
      </Router>
    </AuthProvider>
  );
}
