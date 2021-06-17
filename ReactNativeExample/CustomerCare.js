import React, {Fragment} from 'react';
import {View} from 'react-native';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import SvgUri from 'react-native-svg-uri';
import styled from "styled-components/native/";
import {Linking, Text} from 'react-native';

import {NavigationBar} from '../../../components';
import SectionTitle from '../../../components/_common/SectionTitle';
import Loader from '../../../components/_common/Loader'

import {Colors} from '../../../constants';
import {css} from "styled-components/native/";
import arrow from "../../../../assets/images/arrow-next.svg";
import search from "../../../../assets/images/search.svg";

import {
  getCustomerQuestionsData,
  setPickedCustomerQuestion,
  filterCustomerQuestions,
  getReportQuestion
} from '../../../store/actions';
import LinkCard from "../../../components/_common/LinkCard";
import {LinearGradient} from "expo";
import InputItem from "../../../components/_common/InputItem";
import Button from "../../../components/_common/Button";
import {Collapse, CollapseBody, CollapseHeader} from "accordion-collapse-react-native";
import {t} from '../../../../assets/Localisation/i18nWrapper'


class CustomerCare extends React.Component {
  state = {
    activeSections: [],
    searchValue: ''
  };

  componentDidMount() {
    this.props.getCustomerQuestionsData()
  }

  _renderHeader = (section, index) => {
    return (
      <AccordionHeaderCover>
        <AccordionHeader>{section.title}</AccordionHeader>
        <StyledArrow selectOpen={this.state.activeSections === index}>
          <SvgUri
            width="10"
            height="10"
            fill={Colors.darkSlateBlue}
            svgXmlData={arrow}
          />
        </StyledArrow>
      </AccordionHeaderCover>
    );
  };

  _renderContent = section => {
    return (
      <View>
        {
          section.questions.map(documentItem => (
            <LinkCard
              key={documentItem.id}
              text={documentItem.question}
              onPress={() => this.handleDocumentPick(documentItem)}
              titleFF={'regular'}
              imageHeight={30}
              imageWidth={30}
              textColor={Colors.darkSlateBlue}
              padding={20}
            />
          ))
        }
      </View>
    );
  };

  _updateSections = (activeSections) => {
    const sectionIndex = this.state.activeSections.indexOf(activeSections);
    if (sectionIndex > -1) {
      const sectionArray = [...this.state.activeSections];
      sectionArray.splice(sectionIndex, 1);
      this.setState({
        activeSections: sectionArray
      })
    } else {
      this.setState({activeSections: [...this.state.activeSections, activeSections]});
    }
  };

  handleDocumentPick = (data) => {
    this.props.setPickedCustomerQuestion(data);
    this.props.navigation.navigate("SingleQuestion");
  };

  handleFieldUpdate = (searchValueObject) => {
    this.setState({
      searchValue: searchValueObject.text
    });
    this.props.filterCustomerQuestions(searchValueObject.text)
  };

  goToReporting = () => {
    this.props.getReportQuestion();
    this.props.navigation.navigate("ReportMessage")
  };

  render() {
    const {filteredCustomerCareData} = this.props;
    const {searchValue} = this.state;

    return (
      <Fragment>
        <NavigationBar
          title={t("CustomerCare.navBarTitle")}
          navigation={this.props.navigation}
          isNotSeparated
          rightButtonCb={() => {
          }}
          rightButtonIconName="notifications-none"
        />
        <StyledScrollView
          contentContainerStyle={{flexGrow: 1}}
        >
          <LinearGradient
            colors={[Colors.mainWhite, Colors.paleBlue]}
            style={{
              paddingTop: 10, paddingRight: 10, paddingLeft: 10,
              flex: 1
            }}
          >

            <InputCover>
              <InputItem
                handleEdit={this.handleFieldUpdate}
                value={searchValue}
                inputKey={"searchValue"}
                placeholder={t("CustomerCare.search")}
                svgImage={search}
              />
            </InputCover>
            <SectionTitle
              color={Colors.darkSlateBlue}
              marginTop={20}
              fontSize={16}
              textAlign={'left'}
              marginBottom={16}
            >
              {t("CustomerCare.mainTitle")}
            </SectionTitle>
            <AccordionCover>
              {
                filteredCustomerCareData.map((item, index) => (
                  <Collapse
                    key={index}
                    isCollapsed={this.state.activeSections.indexOf(index) > -1}
                    onToggle={() => this._updateSections(index)}>
                    <CollapseHeader>
                      {
                        this._renderHeader(item, index)
                      }
                    </CollapseHeader>
                    <CollapseBody>
                      {
                        this._renderContent(item, index)
                      }
                    </CollapseBody>

                  </Collapse>
                ))
              }
            </AccordionCover>

            <ButtonsBlock>

              <ButtonRow>
                <ButtonCover>
                  <Button
                    bg={Colors.pink}
                    onPress={() => {
                      Linking.openURL("mailto:customercare@eteck.nl")
                    }}
                    marginBottom={2}
                  >
                    ✉️ {t("CustomerCare.mailUs")}
                  </Button>

                </ButtonCover>
                <ButtonCover>
                  <Button
                    bg={Colors.pink}
                    onPress={() => {
                      Linking.openURL("tel:0850218000")
                    }}
                    marginBottom={2}
                  >
                    📱 {t("CustomerCare.telUs")}
                  </Button>

                </ButtonCover>
              </ButtonRow>
              <Button
                bg={Colors.darkSlateBlue}
                textColor={Colors.mainWhite}
                onPress={this.goToReporting}
              >
                {t("CustomerCare.reportButton")}
              </Button>
            </ButtonsBlock>

          </LinearGradient>
        </StyledScrollView>
        <Loader loaderKeysArray={['Project']}/>

      </Fragment>
    );
  }
}

CustomerCare.propTypes = {
  getCustomerQuestionsData: PropTypes.func.isRequired,
  setPickedCustomerQuestion: PropTypes.func.isRequired,
  filterCustomerQuestions: PropTypes.func.isRequired
};

const mapStateToProps = state => {
  return {
    customerCareData: state.CustomerCare.customerCareData,
    filteredCustomerCareData: state.CustomerCare.filteredCustomerCareData,
  };
};

const actions = {
  getCustomerQuestionsData,
  setPickedCustomerQuestion,
  filterCustomerQuestions,
  getReportQuestion
};


export default connect(mapStateToProps, actions)(CustomerCare);

const AccordionCover = styled.View`
  margin-bottom: 30px;
`;

const StyledScrollView = styled.ScrollView`
	width: 100%;
  background-color: ${Colors.background};
`;

const AccordionHeaderCover = styled.View`
  margin-top: 10px;
  border-radius: 2px;
  overflow: hidden;
`;

const AccordionHeader = styled.Text`
  padding: 8px 0;
  color: ${Colors.darkSlateBlue};
  font-size: 13px;
  font-family: 'bold';
`;

const StyledArrow = styled.View`
	position: absolute;
	right: 0;
	top: 14px;
	transform: rotate(90deg);
	${({selectOpen}) =>
  selectOpen &&
  css`
   transform: rotate(-90deg);
  `}
`;
const InputCover = styled.View`
	
`;

const ButtonsBlock = styled.View`
	margin-top: auto;
	margin-bottom: 30px;
`;

const ButtonRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
`;

const ButtonCover = styled.View`
  width: 49%;
`;

