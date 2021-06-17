import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';

import isEmpty from 'lodash/isEmpty';

import { useLocation, useHistory } from 'react-router-dom';
import { NotificationManager } from 'react-notifications';
import { useTranslation } from 'react-i18next';
import { useToggle } from 'react-use';
import compact from 'lodash/compact';
import { GET_CONNECTIONS, GET_CONNECTION_DETAILS } from '../utils/queries/connections/connectionsQueries';
import {
  RECONNECT_CONNECTION,
  DISABLE_CONNECTION,
  ARCHIVE_CONNECTION,
  CHANGE_CONNECTION_NAME,
  CONNECT_CONNECTION,
  SAVE_CREDENTIALS,
  SAVE_CONNECTION_FORM,
} from '../utils/queries/connections/connectionsMutations';
import { GlobalContext } from '../containers/App/context';
import { globalLoadingConst } from '../constants/globalLoadingConsts';
import { UI_ROUTES } from '../constants/routes';
import useSearch from './useSearch';
import ConnectionFormModal from '../pages/ConnectionsPage/components/ConnectionFormModal';
import PlaidModal from '../pages/ConnectionsPage/components/PlaidModal';

const CONNECTION_MUTATION_OPTION = {
  refetchQueries: [{ query: GET_CONNECTIONS }],
  awaitRefetchQueries: true,
};

export const useGetConnectionsLists = () => {
  const { setGlobalLoading } = useContext(GlobalContext);
  const [connections, setConnections] = useState({});
  const { data, error, loading, refetch } = useQuery(GET_CONNECTIONS);

  useEffect(() => {
    if (!data && loading) {
      setGlobalLoading(globalLoadingConst.listConnections, true);
    } else {
      setGlobalLoading(globalLoadingConst.listConnections, false);
    }
  }, [loading, data, setGlobalLoading]);

  useEffect(() => {
    if (!loading && isEmpty(error)) {
      const connectionsObject = {};
      const listConnections = compact(data?.listConnections || []);

      listConnections.forEach((item) => {
        if (item.status === 'CONNECTED') {
          connectionsObject.live = [...(connectionsObject.live || []), item];
        }

        if (item.status === 'BROKEN') {
          connectionsObject.disabled = [...(connectionsObject.disabled || []), item];
        }
        if (item.status === 'NOT_CONNECTED') {
          connectionsObject.notConnected = [...(connectionsObject.notConnected || []), item];
        }
        if (item.status === 'COMING_SOON') {
          connectionsObject.soon = [...(connectionsObject.soon || []), item];
        }
        if (item.status === 'ARCHIVED') {
          connectionsObject.archived = [...(connectionsObject.archived || []), item];
        }
      });
      setConnections(connectionsObject);
    }
  }, [error, data, loading]);

  return {
    connections,
    directoryConnections: [...(connections.notConnected || []), ...(connections.soon || [])],
    error,
    loading,
    refetch,
  };
};

export const useUpdateConnectionData = () => {
  const [reconnect, { loading: reconnectLoading }] = useMutation(RECONNECT_CONNECTION, CONNECTION_MUTATION_OPTION);
  const [disable, { loading: disableLoading }] = useMutation(DISABLE_CONNECTION, CONNECTION_MUTATION_OPTION);
  const [archive, { loading: archiveLoading }] = useMutation(ARCHIVE_CONNECTION, CONNECTION_MUTATION_OPTION);
  const [changeName, { loading: nameChangeLoading }] = useMutation(CHANGE_CONNECTION_NAME, CONNECTION_MUTATION_OPTION);
  const [saveForm, { loading: saveFormLoading }] = useMutation(SAVE_CONNECTION_FORM);
  const [connect, { loading: connectingLoading }] = useMutation(CONNECT_CONNECTION);
  const [saveCredentials, { loading: saveCredentialsLoading }] = useMutation(
    SAVE_CREDENTIALS,
    CONNECTION_MUTATION_OPTION
  );
  const { setGlobalLoading } = useContext(GlobalContext);

  useEffect(() => {
    if (
      reconnectLoading ||
      disableLoading ||
      archiveLoading ||
      nameChangeLoading ||
      connectingLoading ||
      saveCredentialsLoading ||
      saveFormLoading
    ) {
      setGlobalLoading(globalLoadingConst.connectionUpdate, true);
    } else {
      setGlobalLoading(globalLoadingConst.connectionUpdate, false);
    }
  }, [
    setGlobalLoading,
    connectingLoading,
    reconnectLoading,
    disableLoading,
    archiveLoading,
    nameChangeLoading,
    saveCredentialsLoading,
    saveFormLoading,
  ]);

  return {
    saveForm,
    archive,
    connect,
    disable,
    reconnect,
    changeName,
    saveCredentials,
  };
};

export const useHandleConnectionConnect = (connection, refetch) => {
  const [searchParams] = useSearch();
  const { t } = useTranslation();
  const isPlaid = connection?.name?.toLowerCase() === 'plaid' && connection.canConnect === true;
  const { connect, reconnect, saveCredentials, saveForm } = useUpdateConnectionData();
  const [modalShown, toggleModalShown] = useToggle(false);

  const [childWindow, setChildWindow] = useState(undefined);
  const [connectData, setConnectData] = useState({});
  const [plaidConnectionData, setPlaidData] = useState({});
  const location = useLocation();
  const history = useHistory();
  useEffect(() => {
    const handleListener = (e) => {
      if (e.data === 'successfulPost' && childWindow) {
        childWindow.close();
        NotificationManager.success(`${connection.name} has been successfully connected`, 'Success', 3000);
        if (refetch) {
          refetch();
        }
        setTimeout(() => history.push(`${UI_ROUTES.connections}?refetch=true`), 1000);
      }
      if (e.data === 'notSuccessfulPost' && childWindow) {
        childWindow.close();
        NotificationManager.error('Server error', t('uiMessages.error'), 3000);
      }
    };
    window.addEventListener('message', handleListener);
    return () => window.removeEventListener('message', handleListener);
  }, [connection, childWindow, history, t, refetch]);

  useEffect(() => {
    if ((searchParams.code && searchParams.state) || (searchParams.state && searchParams.queryString)) {
      saveCredentials({
        variables: {
          id: searchParams.state,
          queryString: searchParams.queryString ? searchParams.queryString : location.search.replace('?', ''),
        },
      }).then((res) => {
        if (window.opener) {
          if (res && !res.errors) {
            window.opener.postMessage('successfulPost', window.origin);
          } else {
            window.opener.postMessage('notSuccessfulPost', window.origin);
          }
        }
      });
    }
  }, [searchParams, location, saveCredentials]);

  const handleConnectFunction = useCallback(
    (method) => {
      method({
        variables: { id: connection.id },
      }).then((res) => {
        if (res && !res.errors) {
          const responseData = res.data?.startConnection || res.data?.reconnectConnection;
          const oauthUrl = responseData?.authorizationUrl;
          if (oauthUrl && oauthUrl !== 'null' && responseData.flowType !== 'PLAID') {
            const childWindowConst = window.open(oauthUrl, 'new', 'resizable=yes,fullscreen=yes');
            setChildWindow(childWindowConst);
          } else if (responseData.form) {
            setConnectData({
              ...responseData,
              currentStep: { form: responseData.form || [] },
            });
            toggleModalShown();
          }
          if (responseData.flowType === 'PLAID') {
            setPlaidData(responseData);
          }
        } else {
          NotificationManager.error('Server error', t('uiMessages.error'), 3000);
        }
      });
    },
    [connection, t, toggleModalShown]
  );

  const handleConnect = useCallback(() => {
    handleConnectFunction(connect);
  }, [connect, handleConnectFunction]);

  const handleReconnect = useCallback(() => {
    handleConnectFunction(reconnect);
  }, [reconnect, handleConnectFunction]);

  const handleConnectionForm = useCallback(
    (formInput) => {
      saveForm({
        variables: {
          id: connectData.id,
          formInput,
        },
      }).then((res) => {
        if (res && !res.errors) {
          const responseData = res.data?.saveConnectionForm;

          if (responseData.state === 'NEEDS_CONFIG' && responseData.status === 'CONNECTED') {
            setConnectData({
              ...responseData,
              currentStep: {
                form: responseData.form || [],
              },
              hideSubmit: true,
              hideClose: true,
            });
          } else if (responseData.status === 'CONNECTED' && responseData.state !== 'NEEDS_CONFIG') {
            setTimeout(() => history.push(`${UI_ROUTES.connections}?refetch=true`), 1000);
            NotificationManager.success(
              `${connection.name || connection.company.name} has been successfully connected`,
              'Success',
              3000
            );
          } else {
            NotificationManager.error(
              'Connecting error, maybe provided credentials are not valid',
              t('uiMessages.error'),
              5000
            );
            toggleModalShown();
          }
        } else {
          NotificationManager.error('Server error', t('uiMessages.error'), 3000);
        }
      });
    },
    [connectData, connection, t, history, toggleModalShown, saveForm]
  );

  const handleResetPlaid = () => {
    setPlaidData({});
  };

  const renderConnectionForm = () => {
    if (isPlaid && plaidConnectionData.authorizationUrl) {
      return (
        <PlaidModal
          handleResetPlaid={handleResetPlaid}
          plaidConnectionData={plaidConnectionData}
          setChildWindow={setChildWindow}
        />
      );
    }

    if (connectData.id) {
      return (
        <ConnectionFormModal
          connectData={connectData}
          connection={connection}
          toggleModalShown={toggleModalShown}
          modalShown={modalShown}
          handleConnectionForm={handleConnectionForm}
        />
      );
    }
    return null;
  };

  return {
    plaidConnectionData,
    handleConnect,
    handleReconnect,
    saveCredentials,
    renderConnectionForm,
  };
};

export const useGetConnectionDetails = (id) => {
  const { data, loading, error, refetch } = useQuery(GET_CONNECTION_DETAILS, {
    variables: {
      id,
    },
  });
  const { setGlobalLoading } = useContext(GlobalContext);

  useEffect(() => {
    if (loading) {
      setGlobalLoading(globalLoadingConst.connectionDetail, true);
    } else {
      setGlobalLoading(globalLoadingConst.connectionDetail, false);
    }
  }, [setGlobalLoading, loading]);

  return {
    connection: data?.getConnection || {},
    loading,
    error,
    refetch,
  };
};
