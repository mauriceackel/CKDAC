/* eslint-disable @typescript-eslint/no-use-before-define */
import React, { ReactElement, useContext, useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router';
import { Popover } from 'react-tiny-popover';
import { AuthContext } from 'services/auth/authcontext';
import { signOut } from 'services/auth/authservice';
import LogoutIcon from './Icons/LogoutIcon';
import SettingsIcon from './Icons/SettingsIcon';

type AccountPopoverProps = {
  children: ReactElement;
};
function AccountPopover(props: AccountPopoverProps): ReactElement {
  const { children: child } = props;

  const {
    authState: { user },
  } = useContext(AuthContext);
  const history = useHistory();
  const { pathname } = useLocation();

  const [isOpen, setIsOpen] = useState<boolean>(false);

  function handleClick() {
    if (!user && !pathname.startsWith('/signin/')) {
      history.push(`/signin/?returnUrl=${encodeURIComponent(pathname)}`);
      return;
    }

    setIsOpen((curr) => !curr);
  }

  useEffect(() => {
    if (isOpen && !user) {
      setIsOpen(false);
    }
  }, [user, isOpen]);

  return (
    <Popover
      isOpen={isOpen}
      onClickOutside={() => setIsOpen(false)}
      align="end"
      containerClassName="z-50"
      positions={['bottom']}
      content={<AccountPopoverContent />}
    >
      {React.cloneElement(child, { onClick: handleClick })}
    </Popover>
  );
}

// #region Account Popover content
function AccountPopoverContent(): ReactElement {
  const history = useHistory();
  const {
    authState: { user },
    authStateChanged,
  } = useContext(AuthContext);

  async function handleSignOut() {
    try {
      await signOut();
      authStateChanged(undefined);

      history.push('/');
    } catch (err) {
      console.log(err);
    }
  }

  return (
    <div className="relative flex flex-col rounded bg-green-800 p-8 shadow-2xl text-white">
      <div className="absolute rounded-sm right-2 -top-2 bg-green-800 w-6 h-6 transform rotate-45" />
      <h1 className="text-2xl">
        {user?.firstname} {user?.lastname}
      </h1>
      <h2 className="text-lg">{user?.email}</h2>
      <div className="flex mt-2">
        <button
          type="button"
          className="flex items-center button shadow-lg bg-white text-green-800 mr-1"
          onClick={() => history.push('/account/')}
        >
          <SettingsIcon className="w-5 h-5 mr-2" />
          Settings
        </button>
        <button
          type="button"
          className="flex items-center button shadow-lg bg-white text-green-800 ml-1"
          onClick={handleSignOut}
        >
          <LogoutIcon className="w-5 h-5 mr-2" />
          Logout
        </button>
      </div>
    </div>
  );
}
// #endregion

export default AccountPopover;
