import { useTranslation } from '@collabo/i18n'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { BackHandler, ScrollView, StyleSheet, View, type LayoutChangeEvent } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { scheduleOnRN } from 'react-native-worklets'

import { sheetSnap } from '../../tokens/index.ts'
import { useFocusOnMount } from '../a11y/announce.ts'
import { haptics } from '../haptics.ts'
import { springConfig } from '../motion/presets.ts'
import { useTheme } from '../theme/use-theme.ts'
import { Text } from './text.tsx'
import { sheetSnaps, type SheetSnap } from './options.ts'

export type BottomSheetProps = {
  /** Read first when the sheet opens. Translated. */
  readonly title: string
  /** The main action, always visible, even collapsed (a "Request ride" button). */
  readonly footer?: ReactNode
  readonly snap: SheetSnap
  readonly onSnapChange: (snap: SheetSnap) => void
  /** The rest of the content. It scrolls, so nothing clips at 200% text. */
  readonly children: ReactNode
}

/** A pan gesture for the handle. A plain function, so the gesture builder runs outside render analysis. */
const createPan = () => Gesture.Pan()

/** Snap heights in points: collapsed is measured (handle, title, footer), the rest are fractions. */
function snapHeights(container: number, collapsed: number): Record<SheetSnap, number> {
  return {
    collapsed: Math.min(collapsed, container * sheetSnap.full),
    half: Math.max(collapsed, container * sheetSnap.half),
    full: container * sheetSnap.full,
  }
}

/**
 * The persistent sheet over the map. Drag the handle between three snap points; a flick is
 * enough. On a map screen the sheet comes before the map in reading order, and its title takes
 * focus on mount. The handle is adjustable, so screen readers swipe up and down to resize.
 */
export function BottomSheet({ title, footer, snap, onSnapChange, children }: BottomSheetProps) {
  const theme = useTheme()
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const titleRef = useRef<View>(null)
  useFocusOnMount(titleRef)

  const [container, setContainer] = useState(0)
  const [collapsedHeight, setCollapsedHeight] = useState(0)
  const heights = snapHeights(container, collapsedHeight)
  const fullHeight = heights.full
  const offset = useSharedValue(0)
  const dragStart = useSharedValue(0)

  // The sheet is always full height; it slides down to show less.
  const offsetFor = (target: SheetSnap) => fullHeight - heights[target]

  const target = offsetFor(snap)
  useEffect(() => {
    if (container === 0) return
    offset.set(withSpring(target, springConfig.gentle))
  }, [container, target, offset])

  // Android back steps the sheet down before leaving the screen.
  useEffect(() => {
    if (snap === 'collapsed') return
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onSnapChange(snap === 'full' ? 'half' : 'collapsed')
      return true
    })
    return () => subscription.remove()
  }, [snap, onSnapChange])

  const settle = (next: SheetSnap) => {
    if (next !== snap) haptics.light()
    onSnapChange(next)
  }

  const offsets = { collapsed: offsetFor('collapsed'), half: offsetFor('half'), full: offsetFor('full') }
  const pan = createPan()
    .onStart(() => {
      dragStart.set(offset.get())
    })
    .onUpdate((event) => {
      const next = dragStart.get() + event.translationY
      // Rubber band past either end instead of a hard stop.
      const max = offsets.collapsed
      offset.set(next < 0 ? next / 3 : next > max ? max + (next - max) / 3 : next)
    })
    .onEnd((event) => {
      // Project where a flick would carry the sheet, then take the nearest snap point.
      const projected = offset.get() + event.velocityY * 0.2
      let nearest: SheetSnap = 'collapsed'
      let best = Number.POSITIVE_INFINITY
      for (const candidate of sheetSnaps) {
        const distance = Math.abs(offsets[candidate] - projected)
        if (distance < best) {
          best = distance
          nearest = candidate
        }
      }
      offset.set(withSpring(offsets[nearest], { ...springConfig.gentle, velocity: event.velocityY }))
      scheduleOnRN(settle, nearest)
    })

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: offset.get() }] }))

  const index = sheetSnaps.indexOf(snap)
  const handleLabel = t('sheet.handle')

  return (
    <View
      style={[StyleSheet.absoluteFill, { zIndex: theme.zIndex.sheet }]}
      pointerEvents="box-none"
      onLayout={(event: LayoutChangeEvent) => setContainer(event.nativeEvent.layout.height)}
    >
      <Animated.View
        style={[
          styles.sheet,
          {
            height: fullHeight || undefined,
            backgroundColor: theme.color.surface,
            borderTopStartRadius: theme.radius.xl,
            borderTopEndRadius: theme.radius.xl,
            boxShadow: theme.elevation.overlay,
          },
          sheetStyle,
        ]}
      >
        <View onLayout={(event) => setCollapsedHeight(event.nativeEvent.layout.height + insets.bottom)}>
          <GestureDetector gesture={pan}>
            <View
              accessible
              accessibilityRole="adjustable"
              accessibilityLabel={handleLabel}
              accessibilityValue={{ text: t(`sheet.${snap}`) }}
              accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
              onAccessibilityAction={(event) => {
                const step = event.nativeEvent.actionName === 'increment' ? 1 : -1
                const next = sheetSnaps[Math.min(sheetSnaps.length - 1, Math.max(0, index + step))]
                if (next) settle(next)
              }}
              style={[styles.handleArea, { minHeight: theme.size.touchTarget / 2, paddingTop: theme.spacing.sm }]}
            >
              <View
                style={{
                  width: theme.size.touchTarget - theme.spacing.md,
                  height: theme.spacing.xs,
                  borderRadius: theme.radius.full,
                  backgroundColor: theme.color.borderStrong,
                }}
              />
            </View>
          </GestureDetector>
          <View
            style={{ paddingHorizontal: theme.screenPadding, paddingBottom: theme.spacing.md, gap: theme.spacing.md }}
          >
            <View ref={titleRef} accessible accessibilityRole="header">
              <Text variant="title2">{title}</Text>
            </View>
            {footer}
          </View>
        </View>
        <ScrollView
          style={styles.content}
          contentContainerStyle={{
            paddingHorizontal: theme.screenPadding,
            paddingBottom: theme.spacing.lg + insets.bottom,
            gap: theme.spacing.lg,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  sheet: { position: 'absolute', start: 0, end: 0, bottom: 0, borderCurve: 'continuous', overflow: 'hidden' },
  handleArea: { alignItems: 'center' },
  content: { flex: 1 },
})
