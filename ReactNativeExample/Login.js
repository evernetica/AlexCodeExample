import React, {Component} from 'react';

import {Colors, STATUSBAR_HEIGHT} from "../../../constants";
import styled from 'styled-components/native';
import {AsyncStorage, SafeAreaView} from 'react-native';
import LoginForm from '../../../components/Login/LoginForm'
import FingerPrint from "../../../components/Login/FingerPrint";
import Pin from "../../../components/Login/Pin";
import {LinearGradient} from "expo";
import Loader from "../../../components/_common/Loader"
import {getSettingLanguage, setRootNavigation} from "../../../store/actions";
import {connect} from "react-redux";
import i18n from '../../../../assets/Localisation/i18nWrapper'


class Index extends Component {
  state = {
    firstLogin: true,
    fingerprintVerification: false,
    pinVerification: false,
    pinVerificationCode: false,
    relogin: false,
    fingerprintVerificationCanceled: false,
    fingerPrintScanStart: false,
    pinVerificationStart: false
  };

  checkStore = async (key) => {
    let value;
    try {
      const data = await AsyncStorage.getItem(key);
      if (data !== null) {
        // We have data!!
        this.setState({
          [key]: JSON.parse(data)
        }, () => (value = JSON.parse(data)))
      }
    } catch (error) {
      // Error retrieving data
      value = false
    }
    return value
  };

  checkDeviceForHardware = async () => {
    let value;
    try {
      let compatible = await Expo.LocalAuthentication.hasHardwareAsync();
      if (!compatible) {
        this.setState({
          compatible: false
        }, () => (value = false))
      } else {
        let biometricRecords = await Expo.LocalAuthentication.isEnrolledAsync();
        if (!biometricRecords) {
          this.setState({
            compatible: false
          }, () => (value = false))
        } else {
          this.setState({
            compatible: true
          }, () => (value = true))
        }
      }
    } catch (error) {
      console.log(error);
    }
    return value
  };

  checkSettings = () => {
    return Promise.all([
      this.checkStore('firstLogin'),
      this.checkStore('fingerprintVerification'),
      this.checkStore('pinVerification'),
      this.checkDeviceForHardware(),
      this.checkStore('pinVerificationCode'),
      this.checkStore('access_token'),
      this.checkStore('refresh_token'),
    ]);
  };

  startCheck = async () => {
    const userSettings = await this.checkSettings();

    const firstLogin = userSettings[0];
    const fingerprintVerification = userSettings[1];
    const pinVerification = userSettings[2];
    const compatible = userSettings[3];

    if (!firstLogin && compatible && fingerprintVerification) {
      this.setState({
        fingerprintVerificationStart: true
      });
      return;
    }
    if (!firstLogin && compatible && !fingerprintVerification) {
      this.setState({
        fingerprintVerificationStart: false,
        pinVerificationStart: true
      });
      return;
    }

    if (!firstLogin && !compatible && pinVerification) {
      this.setState({
        fingerprintVerificationStart: false,
        pinVerificationStart: true
      });
    }
  };

  componentDidMount() {
    this.startCheck();
    const {getSettingLanguage,setRootNavigation} = this.props;
    getSettingLanguage(i18n);
    setRootNavigation(this.props.navigation)
  };

  verificationCancel = () => {

    this.setState({
      pinVerificationStart: true,
      fingerprintVerificationStart: false,
    });
  };

  handlePinVerification = () => {
    this.setState({
      pinVerification: true,
      fingerprintVerification: false,
    })
  };


  componentDidUpdate(prevProps, prevState, snapshot) {
    const {params} = this.props.navigation.state;
    if (params && params.source && this.state.relogin === false) {
      this.setState({
        relogin: true,
        firstLogin: true,
        fingerprintVerificationStart: false,
        pinVerificationStart: false
      })
    }
  };

  render() {
    const {
      firstLogin,
      pinVerification,
      pinVerificationCode,
      pinVerificationAvailable,
      relogin,
      pinVerificationStart,
      fingerprintVerificationStart
    } = this.state;

    return (
      <SafeAreaView style={{height: '100%', width: '100%'}}>
        <StyledContainer>
          <LinearGradient
            colors={[Colors.mainWhite, Colors.paleBlue]}
            style={{
              flex: 1,
              width: '100%',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {
              firstLogin === true &&
              <LoginForm
                navigation={this.props.navigation}
                relogin={relogin}
              />
            }

            {

              !firstLogin && pinVerificationStart &&
              <Pin
                navigation={this.props.navigation}
                pinVerification={pinVerification}
                pinVerificationCode={pinVerificationCode}
                relogin={relogin}
              />
            }

            {
              !firstLogin && fingerprintVerificationStart &&
              <FingerPrint
                navigation={this.props.navigation}
                verificationCancel={this.verificationCancel}
                handlePinVerification={this.handlePinVerification}
                pinVerificationAvailable={pinVerificationAvailable}
              />
            }
            <Loader loaderKeysArray={['login']}/>
          </LinearGradient>
        </StyledContainer>
      </SafeAreaView>
    )
  }
}


const mapStateToProps = state => {
  return {
    language: state.Localisation.language
  };
};

const actions = {
  getSettingLanguage,
  setRootNavigation
};

export default connect(mapStateToProps, actions)(Index);


const StyledContainer = styled.View`
    flex: 1;
    width: 100%;
    margin-top: ${STATUSBAR_HEIGHT};
    align-items: center;
`;

