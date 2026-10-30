import { useTranslation } from '@collabo/i18n'
import { Check } from 'lucide-react-native'
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'

import { useTheme } from '../theme/use-theme.ts'
import { Text } from './text.tsx'
import type { StepState } from './options.ts'

export type TimelineStep = {
  readonly key: string
  /** Translated ("Driver on the way"). */
  readonly label: string
  /** A time or detail under the label ("8:42 pm"). */
  readonly detail?: string
  readonly state: StepState
}

export type StatusTimelineProps = {
  readonly steps: readonly TimelineStep[]
  readonly style?: StyleProp<ViewStyle>
}

/**
 * The trip's steps, top to bottom. Done steps carry a check, the current one a filled ring and
 * bold label, upcoming ones an empty ring: shape and weight, not just color. Each step is read
 * with its state ("Driver on the way, in progress").
 */
export function StatusTimeline({ steps, style }: StatusTimelineProps) {
  const theme = useTheme()
  const { t } = useTranslation()
  const marker = theme.size.icon.lg
  return (
    <View accessibilityRole="list" style={style}>
      {steps.map((step, index) => {
        const last = index === steps.length - 1
        const done = step.state === 'done'
        const current = step.state === 'current'
        return (
          <View
            key={step.key}
            accessible
            accessibilityLabel={[t(`timeline.${step.state}`, { step: step.label }), step.detail]
              .filter(Boolean)
              .join(', ')}
            style={[styles.step, { gap: theme.spacing.md }]}
          >
            <View style={styles.rail}>
              <View
                style={[
                  styles.marker,
                  {
                    width: marker,
                    height: marker,
                    borderRadius: theme.radius.full,
                    borderWidth: done ? 0 : theme.size.focusRing.width,
                    borderColor: current ? theme.color.primary : theme.color.borderStrong,
                    backgroundColor: done
                      ? theme.color.primary
                      : current
                        ? theme.color.primarySoft
                        : theme.color.surface,
                  },
                ]}
              >
                {done ? (
                  <Check
                    size={theme.size.icon.sm}
                    color={theme.color.onPrimary}
                    strokeWidth={theme.size.focusRing.width}
                  />
                ) : current ? (
                  <View
                    style={{
                      width: theme.spacing.sm,
                      height: theme.spacing.sm,
                      borderRadius: theme.radius.full,
                      backgroundColor: theme.color.primary,
                    }}
                  />
                ) : null}
              </View>
              {last ? null : (
                <View
                  style={[
                    styles.line,
                    {
                      width: theme.size.focusRing.width,
                      minHeight: theme.spacing.lg,
                      backgroundColor: done ? theme.color.primary : theme.color.border,
                    },
                  ]}
                />
              )}
            </View>
            <View style={[styles.text, { paddingBottom: last ? 0 : theme.spacing.lg, gap: theme.spacing.xxs }]}>
              <Text
                variant={current ? 'headline' : 'body'}
                color={step.state === 'upcoming' ? 'textSecondary' : 'text'}
              >
                {step.label}
              </Text>
              {step.detail ? (
                <Text variant="footnote" color="textSecondary">
                  {step.detail}
                </Text>
              ) : null}
            </View>
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  step: { flexDirection: 'row' },
  rail: { alignItems: 'center' },
  marker: { alignItems: 'center', justifyContent: 'center' },
  line: { flex: 1 },
  text: { flex: 1 },
})
