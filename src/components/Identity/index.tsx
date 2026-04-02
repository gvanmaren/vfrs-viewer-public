import React, { useRef, useState } from 'react';
import '@esri/calcite-components/dist/components/calcite-navigation-user';
import '@esri/calcite-components/dist/components/calcite-button';
import '@esri/calcite-components/dist/components/calcite-popover';
import { observer } from 'mobx-react-lite';
import auth from '../../stores/authentication';

export const Identity = observer(() => {
  const { signedIn, userName, fullName, thumbnailUrl } = auth.userInfo;
  const [popoverOpen, setPopoverOpen] = useState(false);
  const userRef = useRef<any>(null);
  const popoverRef = useRef<any>(null);

  // Handler for sign out
  const handleSignOut = () => {
    auth.signOut();
    setPopoverOpen(false);
  };

  // Handler for sign in
  const handleSignIn = () => {
    auth.signIn();
  };

  return (
    <>
      {!signedIn ? (
        <calcite-button slot="user" appearance="solid" onClick={handleSignIn}>
          Sign in
        </calcite-button>
      ) : (
        <>
          <calcite-navigation-user
            id="user-id"
            slot="user"
            ref={userRef}
            full-name={fullName}
            username={userName}
            thumbnail={thumbnailUrl}
            onClick={() => setPopoverOpen((open) => !open)}
          ></calcite-navigation-user>
          <calcite-popover
            id="signout-popover"
            label="Sign out popover"
            ref={popoverRef}
            referenceElement="user-id"
            open={popoverOpen}
            placement="bottom-end"
            pointer-disabled
          >
            <calcite-button width="full" onClick={handleSignOut}>
              Sign out
            </calcite-button>
          </calcite-popover>
        </>
      )}
    </>
  );
});
