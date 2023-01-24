/*---------------------------------------------------------------------------------------------
 * Copyright © Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import "./App.scss";
import { BrowserAuthorizationCallbackHandler, BrowserAuthorizationClient } from "@itwin/browser-authorization";
import { IModelApp } from "@itwin/core-frontend";
import { useAccessToken, Viewer, ViewerContentToolsProvider, ViewerNavigationToolsProvider, ViewerStatusbarItemsProvider } from "@itwin/web-viewer-react";
import { MeasureTools, MeasureToolsUiItemsProvider } from "@itwin/measure-tools-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Header } from "./Header";
import { history } from "./history";
import { IoTMonitoringWidgetProvider } from "./IoTExtension/providers/IoTMonitoringWidgetProvider";
import { ITwinLink } from "./IoTExtension/clients/ITwinLink";
import { IoTConnectionManager } from "./IoTExtension/IoTConnection/IoTConnectionManager";
import { ITwinViewerApp } from "./IoTExtension/app/ITwinViewerApp";
import { checkUserRole, getConfiguration, readConfiguration } from "./IoTExtension/Utils";
import { Roles } from "./IoTExtension/SmartDevice";
import { TreeWidget, TreeWidgetUiItemsProvider } from "@itwin/tree-widget-react";
import { PropertyGridManager } from "@itwin/property-grid-react";

const uiProviders = [
  new IoTMonitoringWidgetProvider(),
  new ViewerNavigationToolsProvider(),
  new ViewerStatusbarItemsProvider(),
  new TreeWidgetUiItemsProvider(),
  new MeasureToolsUiItemsProvider(),
  new ViewerContentToolsProvider({
    vertical: {
      measureGroup: false,
    },
  }),
];

const App: React.FC = () => {
  const accessToken = useAccessToken();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [iModelId, setIModelId] = useState(process.env.IMJS_IMODEL_ID);
  const [contextId, setContextId] = useState(process.env.IMJS_ITWIN_ID);
  const [user, setUser] = useState("");
  if (!process.env.IMJS_AUTH_CLIENT_CLIENT_ID) {
    throw new Error("Please add a valid OIDC client id to the .env file and restart the application. See the README for more information.");
  }
  if (!process.env.IMJS_AUTH_CLIENT_SCOPES) {
    throw new Error("Please add valid scopes for your OIDC client to the .env file and restart the application. See the README for more information.");
  }
  if (!process.env.IMJS_AUTH_CLIENT_REDIRECT_URI) {
    throw new Error("Please add a valid redirect URI to the .env file and restart the application. See the README for more information.");
  }

  const authClient = useMemo(() =>
    new BrowserAuthorizationClient({
      scope: process.env.IMJS_AUTH_CLIENT_SCOPES ?? "",
      clientId: process.env.IMJS_AUTH_CLIENT_CLIENT_ID ?? "",
      redirectUri: process.env.IMJS_AUTH_CLIENT_REDIRECT_URI ?? "",
      postSignoutRedirectUri: process.env.IMJS_AUTH_CLIENT_LOGOUT_URI,
      responseType: "code",
    }), []);

  const login = useCallback(async () => {
    try {
      await authClient.signInSilent();
    } catch {
      await authClient.signIn();
    }
  }, [authClient]);

  useEffect(() => {
    void login();
  }, [login]);

  useEffect(() => {
    BrowserAuthorizationCallbackHandler.handleSigninCallback(process.env.IMJS_AUTH_CLIENT_REDIRECT_URI ?? "").catch(
      (error: any) => { console.error(error); });
    void readConfiguration();
  }, []);

  const parseJwt = (token: any) => {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(window.atob(base64).split("").map(function (c) {
      return "%".concat("00".concat(c.charCodeAt(0).toString(16)).slice(-2));
    }).join(""));

    return JSON.parse(jsonPayload);
  };

  useEffect(() => {
    if (accessToken) {
      const urlParams = new URLSearchParams(window.location.search);
      const jsonPayload = parseJwt(accessToken);
      setUser(jsonPayload.email);
      if (urlParams.has("contextId")) {
        setContextId(urlParams.get("contextId") as string);
      } else {
        if (!process.env.IMJS_ITWIN_ID) {
          throw new Error("Please add a valid context ID in the .env file and restart the application or add it to the contextId query parameter in the url and refresh the page. See the README for more information.");
        }
      }

      if (urlParams.has("iModelId")) {
        setIModelId(urlParams.get("iModelId") as string);
      } else {
        if (!process.env.IMJS_IMODEL_ID) {
          throw new Error("Please add a valid iModel ID in the .env file and restart the application or add it to the iModelId query parameter in the url and refresh the page. See the README for more information.");
        }
      }
    }
  }, [accessToken]);

  useEffect(() => {
    if (contextId && iModelId && accessToken) {
      history.push(`?contextId=${contextId}&iModelId=${iModelId}`);
    }
  }, [contextId, iModelId, accessToken]);

  useEffect(() => {
    if (isLoggingIn && accessToken) {
      setIsLoggingIn(false);
    }
  }, [accessToken, isLoggingIn]);

  const handleLoginClick = async () => {
    setIsLoggingIn(true);
    await authClient.signIn();
  };

  const handleLogoutClick = async () => {
    setIsLoggingIn(false);
    await authClient.signOut();
  };

  const handleOnIModelAppInit = async () => {
    await TreeWidget.initialize();
    await PropertyGridManager.initialize();
    await MeasureTools.startup();
    await ITwinViewerApp.startup();
    IModelApp.viewManager.onViewOpen.addOnce(ITwinLink.initializeLink);
    IModelApp.viewManager.onViewOpen.addOnce(IoTConnectionManager.createConnection);
  };

  const setAdminConfiguration = async (userId: string) => {
    if ((await checkUserRole(userId)) === Roles.Unauthorized) {
      if (getConfiguration().length !== 0) {
        getConfiguration().Logs.Show = "false";
      } else {
        await readConfiguration();
        getConfiguration().Logs.Show = "false";
      }
    }
  };

  useEffect(() => {
    if (user !== "") {
      void setAdminConfiguration(user);
    }
  }, [user]);

  return (
    <div className="viewer-container">
      <Header
        onLogin={handleLoginClick}
        isLoggedIn={!!accessToken}
        onLogout={handleLogoutClick}
      />
      {isLoggingIn ? (
        <span>`Logging in....`</span>
      ) : (
        <Viewer
          iTwinId={contextId ?? ""}
          iModelId={iModelId ?? ""}
          authClient={authClient}
          onIModelAppInit={handleOnIModelAppInit}
          uiProviders={uiProviders}
          enablePerformanceMonitors={false}
        />
      )}
    </div>
  );
};

export default App;
