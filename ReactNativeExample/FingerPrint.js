import React, {Component, Fragment} from 'react';
import {
  StyleSheet,
  Platform,
} from 'react-native';
import SvgUri from 'react-native-svg-uri';
import styled, {css} from "styled-components/native";
import {Colors} from "../../constants";
import Fingerprint from './../../../assets/images/fingerprints.svg';
import HeaderLogo from './../_common/HeaderLogo'
import Button from './../_common/Button'
import {t} from "../../../assets/Localisation/i18nWrapper";

class FingerPrint extends Component {
  state = {
    compatible: false,
    scanState: '',
    errorCount: 0,
  };

  componentDidMount() {
    this.checkDeviceForHardware();
  }

  checkDeviceForHardware = async () => {
    let compatible = await Expo.LocalAuthentication.hasHardwareAsync();
    this.setState({compatible});
    if (!compatible) {
      this.showIncompatibleAlert();
    } else {
      this.checkForBiometrics()
    }
  };

  showIncompatibleAlert = () => {
    this.setState({scanState: 'error'})
  };

  checkForBiometrics = async () => {

    let biometricRecords = await Expo.LocalAuthentication.isEnrolledAsync();
    if (!biometricRecords) {
      // );
    } else {
      this.handleLoginPress();
    }
  };

  handleLoginPress = () => {
      this.scanBiometrics();
  };

  cancelVerification = () => {
    this.setState({scanState: 'error'});
    setTimeout(() => this.props.verificationCancel(), 1000)
  };

  scanBiometrics = async () => {
    const {errorCount, scanState} = this.state;
    const {pinVerificationAvailable} = this.props;
    if (scanState !== 'inProgress') {
      this.setState({scanState: 'inProgress'});

      let result = await Expo.LocalAuthentication.authenticateAsync('Biometric Scan for APP');
      if (result.success) {
        this.props.navigation.navigate('Dashboard')
      } else {
        if (errorCount === 2 && result.error !== "user_cancel" && pinVerificationAvailable) {
          this.props.handlePinVerification()
        }
        this.setState({errorCount: errorCount + 1});
        if (result.success === false && result.error === "user_cancel" && Platform.OS === 'ios') {
          this.cancelVerification()
        }
        this.setState({scanState: 'error'})
      }
    }
  };

  render() {
    const {scanState} = this.state;
    return (
      <StyledContainer>
        <HeaderLogo/>
        {
          Platform.OS === 'android' &&
          (
            <Fragment>
              <StyledInfoCover>
                <StyledScan
                  onPress={
                    this.state.compatible
                      ? this.checkForBiometrics
                      : this.showIncompatibleAlert
                  }
                  style={styles.button}>
                  <StyledBlockTitle error={scanState === 'error'}>
                    {
                      scanState === 'error' && t("Login.Fingerprint.mainTitle.error")
                    }
                    {scanState === 'inProgress' ? t("Login.Fingerprint.mainTitle.inProgress") : t("Login.Fingerprint.mainTitle.notStarted")}
                  </StyledBlockTitle>

                  <StyledComment error={scanState === 'error'}>
                    {scanState !== 'error' && t("Login.Fingerprint.errorComment")}
                  </StyledComment>
                  <SvgUri
                    width="200"
                    height="90"
                    fill={scanState === 'error' ? Colors.pink : '#dde5e9'}
                    svgXmlData={Fingerprint}
                    style={{marginTop: 45}}
                  />
                  {
                    scanState === 'error' &&
                    <StyledErrorMessage error={scanState === 'error'}>
                      {t("Login.Fingerprint.errorComment")}
                    </StyledErrorMessage>
                  }
                </StyledScan>
              </StyledInfoCover>

              <Button
                onPress={this.cancelVerification}
              >
                {t("Login.Fingerprint.cancel")}
              </Button>
            </Fragment>
          )
        }
      </StyledContainer>
    );
  }
}

const StyledContainer = styled.View`
    flex: 1;
    width: 100%;
    align-items: center;
    justify-content: space-between;
    padding: 0px 10px;
`;

const StyledInfoCover = styled.View`
    width: 100%;
    align-items: center;
    justify-content: center;
    padding-bottom: 100px;
`;

const StyledScan = styled.TouchableOpacity`
    width: 100%;
    align-items: center;
    position: relative;
`;

const StyledBlockTitle = styled.Text`
  line-height: 20px;
  text-align: center;
  width: 100%;
  color: ${Colors.primaryText};
  font-size: 16px;
  font-family: 'bold';
`;

const StyledComment = styled.Text`
  margin-top: 11px;
  color: ${Colors.primaryText};
  font-size: 13px;
  font-family: 'book';
  line-height: 20px;
  text-align: center;
  ${({error}) =>
  error &&
  css`
   color: red;
  `}
`;

const StyledErrorMessage = styled.Text`
  position: absolute;
  width: 100%;
  text-align: center;
  color: ${Colors.pink};
  font-size: 11px;
  font-family: 'bold';
  line-height: 16px;
  left: 0;
  bottom: -38px;
`;


const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#056ecf',
    width: '100%',
  },
  buttonText: {
    fontSize: 30,
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.30)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
  },
  logo: {
    height: 128,
    width: 128,
  },
});

export default FingerPrint;