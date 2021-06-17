import React, { useContext, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import MoreHoriz from '@material-ui/icons/MoreHoriz';

import { func, string, shape } from 'prop-types';
import IconButton from '@material-ui/core/IconButton';
import { useTranslation } from 'react-i18next';
import { NotificationManager } from 'react-notifications';
import { Box } from '@material-ui/core';
import { ConnectionTile, ConnectionTileLogo } from '../styled';
import DropDownMenu from '../../../components/menus/DropDownMenu';
import { UI_ROUTES } from '../../../constants/routes';
import EditableField from './EditableField';
import FlowsBlock from './FlowsBlock';
import TagButton from './TagButton';
import { useHandleConnectionConnect, useUpdateConnectionData } from '../../../hooks/connectionsHooks';
import { globalLoadingConst } from '../../../constants/globalLoadingConsts';
import { GlobalContext } from '../../../containers/App/context';

const redStatus = 'BROKEN';

const ConnectionsItem = ({ connection, refetch }) => {
  const { archive, disable, changeName } = useUpdateConnectionData();
  const { handleReconnect, renderConnectionForm } = useHandleConnectionConnect(connection, refetch);
  const { setGlobalLoading } = useContext(GlobalContext);

  const { t } = useTranslation();
  const [nameText, setNameText] = useState(connection.name || connection.company?.name || '');
  const { push } = useHistory();

  const handleConnectionPick = () => {
    push(`${UI_ROUTES.connections}/details/${connection.id}`);
  };

  useEffect(() => {
    setNameText(connection.name || connection.company?.name || '');
    return () => {
      setGlobalLoading(globalLoadingConst.connectionUpdate, false);
    };
  }, [connection, setGlobalLoading]);

  const handleUpdate = (mutation) => {
    mutation({
      variables: { id: connection.id },
    }).then((res) => {
      if (res && res.errors) {
        NotificationManager.error('Server error', t('uiMessages.error'), 3000);
      }
    });
  };

  const statusActionHandlers = {
    CONNECTED: { Disconnect: () => handleUpdate(disable) },
    BROKEN: { Reconnect: () => handleReconnect() },
    ARCHIVED: { Reconnect: () => handleReconnect() },
  };

  const connectionActions = [
    { ...(statusActionHandlers[connection.status] ? statusActionHandlers[connection.status] : {}) },
    { ...((connection.status !== 'ARCHIVED' && { Archive: () => handleUpdate(archive) }) || {}) },
    { [`${connection.company?.domain} ↗`]: () => window.open(connection.company?.link, '_blank') },
  ];

  const handleFieldReset = () => {
    setNameText(connection.name || connection.company?.name);
  };

  const handleSubmitName = () => {
    if (nameText !== connection.name) {
      changeName({
        variables: {
          id: connection.id,
          name: nameText,
        },
      }).then((res) => {
        if (res && res.errors) {
          NotificationManager.error('Server error', t('uiMessages.error'), 3000);
        }
      });
    }
  };

  return (
    <ConnectionTile disconnected={connection.status === redStatus} onClick={handleConnectionPick}>
      <Box display="flex" pt="0px" pl="18px" width="100%" mb="14px" alignItems="flex-start">
        <ConnectionTileLogo img={connection?.company?.logo} />
        <Box
          display="flex"
          flexDirection="column"
          alignItems="flex-start"
          flexShrink={1}
          flexGrow={1}
          mt="15px"
          ml="18px"
          overflow="hidden"
        >
          <EditableField
            nameText={nameText}
            updateValue={setNameText}
            value={nameText}
            reset={handleFieldReset}
            submit={handleSubmitName}
          />
          <TagButton connection={connection} refetch={refetch} />
        </Box>
        <Box mt="3px" alignSelf="flex-start">
          <DropDownMenu
            options={connectionActions}
            button={
              <IconButton>
                <MoreHoriz />
              </IconButton>
            }
            id={connection.id}
          />
        </Box>
      </Box>

      <FlowsBlock flows={connection.flowUsage?.flows || []} textPadding="0 0 0 20px" />
      {renderConnectionForm()}
    </ConnectionTile>
  );
};

ConnectionsItem.propTypes = {
  connection: shape({
    status: string,
    name: string,
    id: string,
    company: shape({
      name: string,
      logo: string,
      domain: string,
    }),
  }).isRequired,
  refetch: func.isRequired,
};

export default ConnectionsItem;
