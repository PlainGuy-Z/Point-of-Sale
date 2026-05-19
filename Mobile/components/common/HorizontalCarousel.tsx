import React, { useRef, useState } from 'react';
import { View, ScrollView, Text, TouchableOpacity, useWindowDimensions, Animated } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { getColors } from '../../utils/theme';

interface HorizontalCarouselProps {
  children: React.ReactNode[];
  tabs?: { label: string; key: string }[];
  isDark: boolean;
  cardWidthPercent?: number;
  onTabChange?: (index: number) => void;
}

export default function HorizontalCarousel({
  children,
  tabs,
  isDark,
  cardWidthPercent = 85,
  onTabChange,
}: HorizontalCarouselProps) {
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const { width } = useWindowDimensions();
  const c = getColors(isDark);
  const GAP = 12;
  const cardWidth = (width * cardWidthPercent) / 100;

  const scrollX = useRef(new Animated.Value(0)).current;

  const scrollTo = (index: number) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({
      x: index * (cardWidth + GAP),
      animated: true,
    });
    setActiveIndex(index);
    onTabChange?.(index);
  };

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (cardWidth + GAP));
    if (index !== activeIndex && index >= 0 && index < children.length) {
      setActiveIndex(index);
      onTabChange?.(index);
    }
  };

  return (
    <View>
      {/* Scroll track */}
      <Animated.ScrollView
        ref={scrollRef as any}
        horizontal
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true, listener: handleScroll }
        )}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        decelerationRate={0.9}
        snapToInterval={cardWidth + GAP}
        snapToAlignment="start"
      >
        <View style={{ flexDirection: 'row', gap: GAP }}>
          {children.map((child, index) => {
            const inputRange = [
              (index - 1) * (cardWidth + GAP),
              index * (cardWidth + GAP),
              (index + 1) * (cardWidth + GAP),
            ];

            const scale = scrollX.interpolate({
              inputRange,
              outputRange: [0.95, 1, 0.95],
              extrapolate: 'clamp',
            });
            
            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.6, 1, 0.6],
              extrapolate: 'clamp',
            });

            return (
              <Animated.View
                key={index}
                style={{
                  width: cardWidth,
                  opacity,
                  transform: [{ scale }],
                }}
              >
                {child}
              </Animated.View>
            );
          })}
        </View>
      </Animated.ScrollView>

      {/* Controls - Navigation Buttons and Indicators */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          marginTop: 12,
        }}
      >
        {/* Left Arrow */}
        <TouchableOpacity
          onPress={() => scrollTo(Math.max(0, activeIndex - 1))}
          disabled={activeIndex === 0}
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: activeIndex === 0 ? c.bgCard : c.bgCard,
            justifyContent: 'center',
            alignItems: 'center',
            opacity: activeIndex === 0 ? 0.35 : 1,
          }}
        >
          <ChevronLeft size={16} color={c.textSecondary} strokeWidth={2} />
        </TouchableOpacity>

        {/* Tab Buttons or Dots */}
        {tabs ? (
          <View style={{ flexDirection: 'row', gap: 8, marginHorizontal: 8 }}>
            {tabs.map((tab, index) => (
              <TouchableOpacity
                key={tab.key}
                onPress={() => scrollTo(index)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  borderRadius: 16,
                  backgroundColor:
                    index === activeIndex
                      ? isDark
                        ? '#f59e0b'
                        : '#0d9488'
                      : c.bgCard,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '600',
                    color:
                      index === activeIndex
                        ? '#fff'
                        : c.textSecondary,
                  }}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={{ flexDirection: 'row', gap: 6, marginHorizontal: 8 }}>
            {children.map((_, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => scrollTo(index)}
                style={{
                  width: index === activeIndex ? 20 : 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor:
                    index === activeIndex
                      ? isDark
                        ? '#f59e0b'
                        : '#0d9488'
                      : c.border,
                }}
              />
            ))}
          </View>
        )}

        {/* Right Arrow */}
        <TouchableOpacity
          onPress={() =>
            scrollTo(Math.min(children.length - 1, activeIndex + 1))
          }
          disabled={activeIndex === children.length - 1}
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor:
              activeIndex === children.length - 1 ? c.bgCard : c.bgCard,
            justifyContent: 'center',
            alignItems: 'center',
            opacity: activeIndex === children.length - 1 ? 0.35 : 1,
          }}
        >
          <ChevronRight
            size={16}
            color={c.textSecondary}
            strokeWidth={2}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}
