import React from 'react';
import {Image, ImageSourcePropType, StyleSheet, View} from 'react-native';
import {useDirection, isRTL} from '../i18n/useDirection';

/**
 * US-016: Wraps an icon and applies a horizontal-flip transform when the
 * active layout direction is RTL, so directionally-meaningful icons (e.g.
 * arrows, chevrons) point the correct way in Arabic. Non-directional icons
 * can opt out via `mirror={false}`.
 */
export interface DirectionalIconProps {
  source: ImageSourcePropType;
  size?: number;
  /** Set to false for icons that should never mirror (e.g. logos). Defaults to true. */
  mirror?: boolean;
  accessibilityLabel?: string;
  testID?: string;
}

export function DirectionalIcon({
  source,
  size = 24,
  mirror = true,
  accessibilityLabel,
  testID,
}: DirectionalIconProps): React.JSX.Element {
  const direction = useDirection();
  const shouldMirror = mirror && isRTL(direction);

  return (
    <View testID={testID}>
      <Image
        source={source}
        accessibilityLabel={accessibilityLabel}
        style={[
          styles.icon,
          {width: size, height: size},
          shouldMirror ? styles.mirrored : undefined,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  icon: {
    resizeMode: 'contain',
  },
  mirrored: {
    transform: [{scaleX: -1}],
  },
});

export default DirectionalIcon;
