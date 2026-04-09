import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../theme/colors';

interface CustomInputProps extends TextInputProps {
  type: 'phone' | 'email' | 'password';
  onClear?: () => void;
  showToggle?: boolean;
}

export const CustomInput: React.FC<CustomInputProps> = ({
  type,
  onClear,
  showToggle,
  secureTextEntry,
  ...props
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(!secureTextEntry);

  const renderLeft = () => {
    if (type === 'phone') {
      return (
        <TouchableOpacity style={styles.phonePrefix} activeOpacity={0.7}>
          <Text style={styles.flag}>🇻🇳</Text>
          <Text style={styles.prefixText}>+84</Text>
          <Icon name="chevron-down" size={16} color={COLORS.GRAY_DARK} />
          <View style={styles.divider} />
        </TouchableOpacity>
      );
    }
    return null;
  };

  const renderRight = () => {
    if (type === 'password' && showToggle) {
      return (
        <TouchableOpacity
          onPress={() => setIsPasswordVisible(!isPasswordVisible)}
          style={styles.rightIcon}
        >
          <Icon
            name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
            size={22}
            color={COLORS.GRAY_MEDIUM}
          />
        </TouchableOpacity>
      );
    }
    if (onClear && props.value && props.value.length > 0) {
      return (
        <TouchableOpacity onPress={onClear} style={styles.rightIcon}>
          <Icon name="close-circle" size={20} color={COLORS.GRAY_MEDIUM} />
        </TouchableOpacity>
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      {renderLeft()}
      <TextInput
        style={styles.input}
        placeholderTextColor={COLORS.GRAY_MEDIUM}
        secureTextEntry={type === 'password' && !isPasswordVisible}
        {...props}
      />
      {renderRight()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 8,
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  phonePrefix: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
  },
  flag: {
    fontSize: 20,
    marginRight: 4,
  },
  prefixText: {
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    marginRight: 4,
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: COLORS.BORDER,
    marginLeft: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    paddingVertical: 0,
  },
  rightIcon: {
    padding: 4,
  },
});
