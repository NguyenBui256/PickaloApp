import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, Easing } from 'react-native';
import Svg, { Path, Circle as SvgCircle, Line, Defs, RadialGradient, Stop } from 'react-native-svg';

interface Props {
  center: { x: number; y: number };
  radiusPx: number;
}

export const RadarOverlay: React.FC<Props> = ({ center, radiusPx }) => {
  const angle = useRef(new Animated.Value(0)).current;
  const [sweepDeg, setSweepDeg] = useState(0);

  useEffect(() => {
    angle.setValue(0);
    const anim = Animated.loop(
      Animated.timing(angle, {
        toValue: 360,
        duration: 3000,
        useNativeDriver: false,
        easing: Easing.linear,
      })
    );
    anim.start();
    const listenerId = angle.addListener(({ value }) => setSweepDeg(value));
    return () => {
      anim.stop();
      angle.removeListener(listenerId);
    };
  }, []);

  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const getPoint = (deg: number, r: number = radiusPx - 2) => ({
    x: Math.sin(toRad(deg)) * r,
    y: -Math.cos(toRad(deg)) * r,
  });

  // Tip of the sweep hand
  const tip = getPoint(sweepDeg);

  // Trailing sector: 90 degrees behind the hand
  const TRAIL_DEG = 90;
  const trailStart = getPoint(sweepDeg - TRAIL_DEG);
  const largeArc = TRAIL_DEG > 180 ? 1 : 0;
  const r = radiusPx - 2;
  const sectorPath = `M 0 0 L ${trailStart.x} ${trailStart.y} A ${r} ${r} 0 ${largeArc} 1 ${tip.x} ${tip.y} Z`;

  const size = radiusPx * 2;
  const viewBox = `${-radiusPx} ${-radiusPx} ${size} ${size}`;

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: center.x - radiusPx,
        top: center.y - radiusPx,
        width: size,
        height: size,
        overflow: 'hidden',
        borderRadius: radiusPx,
      }}
    >
      <Svg width={size} height={size} viewBox={viewBox}>
        <Defs>
          <RadialGradient id="radarFill" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="rgba(59,130,246,0.0)" />
            <Stop offset="100%" stopColor="rgba(59,130,246,0.05)" />
          </RadialGradient>
        </Defs>

        {/* Background fill */}
        <SvgCircle
          cx={0} cy={0} r={r}
          fill="url(#radarFill)"
          stroke="rgba(59,130,246,0.7)"
          strokeWidth={2}
          strokeDasharray="6 4"
        />

        {/* Cross-hair guides (optional subtle reference lines) */}
        <Line x1={-r} y1={0} x2={r} y2={0} stroke="rgba(59,130,246,0.12)" strokeWidth={1} />
        <Line x1={0} y1={-r} x2={0} y2={r} stroke="rgba(59,130,246,0.12)" strokeWidth={1} />

        {/* Trailing glow sector */}
        <Path d={sectorPath} fill="rgba(59,130,246,0.15)" />

        {/* Sweep hand line */}
        <Line
          x1={0} y1={0}
          x2={tip.x} y2={tip.y}
          stroke="rgba(99,179,255,1)"
          strokeWidth={2}
          strokeLinecap="round"
        />

        {/* Center dot */}
        <SvgCircle cx={0} cy={0} r={4} fill="rgba(59,130,246,0.9)" />
      </Svg>
    </View>
  );
};
