import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { verticalScale } from 'react-native-size-matters'

interface TypographyProps extends React.ComponentProps<typeof Text> {
  size?: number;
  color?: string;
  fontWeight?: string;
  children: React.ReactNode;
  style?: object;
  textProps?: object;
};

const Typography = ({
    size,
    color = '#000',
    fontWeight = '400',
    children,
    style,
    textProps = {},
}: TypographyProps) => {
    const textStyle = {
        fontSize: size? verticalScale(size) : verticalScale(18),
        color,
        fontWeight,
    }
  return (
    <Text
      style={[textStyle, style]}
      {...textProps}
    >{children}</Text>
  )
}

export default Typography

const styles = StyleSheet.create({})