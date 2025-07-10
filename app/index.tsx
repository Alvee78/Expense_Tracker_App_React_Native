import { Redirect, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

const index = () => {
  const router = useRouter();
    useEffect(() => {
    setTimeout(async () => {
      router.replace('/(home)');
      
    }, 2000);
  },[]);
  return (
      <View style={styles.container}>
        <Image 
          style={styles.logo}
          source={require('../assets/images/flash_image.jpg')}
        />
        <Text style={styles.welcomeText}>Budget better, Live smarter</Text>
      </View>
  )
}

export default index

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        height: "30%",
        width: "80%",
        borderRadius: 20,
    },
    welcomeText: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 50,
        color: '#000',
    },
})