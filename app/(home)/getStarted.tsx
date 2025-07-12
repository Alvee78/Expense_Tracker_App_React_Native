import ScreenWrapper from '../../components/ScreenWrapper'
import React from 'react'
import { StyleSheet, Image, TouchableOpacity, View} from 'react-native'
import Typography from '../../components/Typography'
import { verticalScale } from 'react-native-size-matters'
import CustomButton from '../../components/CustomButton'
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated'
import { useRouter } from 'expo-router'

const welcome = () => {
  const router = useRouter();
  return (
    <ScreenWrapper style={styles.container}>
      <View>
        
        <Animated.Image
          entering={FadeInUp.duration(1000)}
          source={require('../../assets/images/welcome.png')}
          style={styles.welcomeImage}
          resizeMode='contain'
        />
        
        <View style={styles.footer}>
          <Animated.View
            entering={FadeInDown.duration(1000)}
           style={{ alignItems: 'center' }}>
            <Typography
              size={24}
              fontWeight={'800'}>Welcome to Expense</Typography>

            <Typography
              size={24}
              fontWeight={'800'}>Tracker</Typography>
            </Animated.View>

            <Animated.View 
              entering={FadeInDown.duration(1000).delay(500)}
              style={{ alignItems: 'center' }}>
            <Typography
              size={16}
              color={'#6b7280'}
              style={{ alignSelf: 'center'}}
            >
              Track your expenses and manage
            </Typography>
            
            <Typography
              size={16}
              color={'#6b7280'}
              style={{ alignSelf: 'center'}}
            >
              your budget effectively.
            </Typography>

          </Animated.View>
          <Animated.View 
            entering={FadeInDown.duration(1000).delay(1000)}
            style={styles.buttonContainer}>
            <CustomButton
              onPress={() => router.push('./authSelection')}
              title="Get Started"
            />
          </Animated.View>
        </View>
      </View>
    </ScreenWrapper>
  )
}

export default welcome;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#e0f7ef',
  },
  welcomeImage: {
    width: '100%',
    height: verticalScale(300),
    resizeMode: 'contain',
    alignSelf: 'center',
    marginTop: verticalScale(70),
  },
  footer: {
    backgroundColor: '#f8f8f8ff',
    alignItems: 'center',
    paddingTop: verticalScale(30),
    paddingBottom: verticalScale(30),
    gap: verticalScale(8),
    borderRadius: 30,
    marginHorizontal: verticalScale(16),
    marginBottom: verticalScale(24),
    borderColor: '#22c55e', // green border
    borderWidth: 1,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: verticalScale(16),
    marginTop: verticalScale(16),
  },
}
);