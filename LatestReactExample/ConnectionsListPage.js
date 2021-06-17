import React, { useEffect, useMemo } from 'react';
import Skeleton from '@material-ui/lab/Skeleton';
import { arrayOf, shape, string } from 'prop-types';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import Box from '@material-ui/core/Box';
import { useGetConnectionsLists } from '../../../hooks/connectionsHooks';
import { FlexContainer, H3, P18B } from '../../../components/atoms';
import ConnectionsItem from '../components/ConnectionsItem';
import TakeAction from '../../../assets/img/TakeAction.svg';
import { IconBoxScreen } from '../../../components/common';
import useSearch from '../../../hooks/useSearch';
import { UI_ROUTES } from '../../../constants/routes';

const ConnectionsPage = ({ connectionCategories, title }) => {
  const { connections, error, loading, refetch } = useGetConnectionsLists();
  const { t } = useTranslation();
  const [searchParams] = useSearch();
  const history = useHistory();

  useEffect(() => {
    if (searchParams.refetch) {
      refetch();
      history.push(`${UI_ROUTES.connections}`);
    }
  }, [searchParams, history, refetch]);

  const connectionsFormedArray = useMemo(() => {
    return connectionCategories.map((category) => ({
      ...category,
      children: connections?.[category.key]?.filter((connection) => connection?.system === false) || [],
    }));
  }, [connections, connectionCategories]);

  const showContent = (category) => category.children.length > 0;
  const noData = useMemo(() => {
    return !loading && (error || !connectionsFormedArray.some(({ children }) => children.length > 0));
  }, [connectionsFormedArray, loading, error]);
  return (
    <FlexContainer
      padding="16px 32px 16px"
      flexDirection="column"
      alignItems="flex-start"
      flex={1}
      width="100%"
      justifyContent="flex-start"
      backgroundColor="white"
    >
      <H3 textAlign="left" margin="0 0 18px 0">
        {title}
      </H3>

      {noData ? (
        <Box display="flex" margin="0 auto" justifySelf="center" alignItems="center" minHeight="calc(100vh - 182px)">
          <IconBoxScreen
            icon={<img src={TakeAction} alt="" />}
            iconMargin="0"
            description={!error ? t('connections.noLiveConnections') : t('connections.fetchingError')}
            padding="60px 200px"
          />
        </Box>
      ) : (
        <FlexContainer
          flex={1}
          alignItems="flex-start"
          justifyContent="flex-start"
          width="100%"
          flexDirection="column"
          flexWrap="wrap"
        >
          {connectionsFormedArray.map(
            (category) =>
              (showContent(category) > 0 || loading) && (
                <FlexContainer
                  margin={title !== 'Archive' ? '26px 0 32px 0' : '0'}
                  width="100%"
                  key={category.label}
                  alignItems="flex-start"
                  justifyContent="flex-start"
                  flexWrap
                >
                  {(showContent(category) || loading) && (
                    <P18B fontWeight="600" width="100%" margin="0 0 16px 0">
                      {category.label}
                    </P18B>
                  )}

                  {loading && (
                    <FlexContainer width="100%" margin="16px 0 0" flex={1}>
                      <Skeleton width="100%" height={142} />
                    </FlexContainer>
                  )}
                  {!loading && showContent(category) && (
                    <FlexContainer
                      width="100%"
                      flexWrap
                      alignItems="normal"
                      flexDirection="row"
                      justifyContent="flex-start"
                    >
                      {category?.children?.map((connection) => (
                        <ConnectionsItem key={connection.id} connection={connection} refetch={refetch} />
                      ))}
                    </FlexContainer>
                  )}
                </FlexContainer>
              )
          )}
        </FlexContainer>
      )}
    </FlexContainer>
  );
};

ConnectionsPage.propTypes = {
  connectionCategories: arrayOf(shape({})).isRequired,
  title: string.isRequired,
};

export default ConnectionsPage;
