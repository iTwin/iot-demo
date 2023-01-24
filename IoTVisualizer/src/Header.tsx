/*---------------------------------------------------------------------------------------------
 * Copyright © Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { Button } from "@itwin/itwinui-react";
import React from "react";

import styles from "./Header.module.scss";

interface HeaderProps {
  onLogin: () => void;
  onLogout: () => void;
  isLoggedIn: boolean;
}

export const Header: React.FC<HeaderProps> = (props: HeaderProps) => {
  return (
    <header className={styles.header}>
      <div className={styles.buttonContainer}>
        <Button
          className={styles.button}
          onClick={props.onLogin}
          styleType="cta"
          disabled={props.isLoggedIn}
        >
          {"Sign In"}
        </Button>
        <Button
          className={styles.button}
          onClick={props.onLogout}
          styleType="cta"
          disabled={!props.isLoggedIn}
        >
          {"Sign Out"}
        </Button>
      </div>
    </header>
  );
};
