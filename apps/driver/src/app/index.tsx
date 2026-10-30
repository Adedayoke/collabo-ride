import { useTranslation } from '@collabo/i18n'
import { Button, Screen, Text } from '@collabo/ui/native'
import { router } from 'expo-router'
import { View } from 'react-native'

const devUi = process.env.EXPO_PUBLIC_DEV_UI === 'true'

export default function HomeScreen() {
  const { t } = useTranslation('driver')
  return (
    <Screen>
      <View>
        <Text variant="subhead" color="primary">
          {t('app.name')}
        </Text>
        <Text variant="title1" accessibilityRole="header">
          {t('home.title')}
        </Text>
      </View>
      <Text color="textSecondary">{t('home.body')}</Text>
      {devUi ? <Button variant="secondary" title={t('dev.catalog')} onPress={() => router.push('/dev/ui')} /> : null}
    </Screen>
  )
}
