import { useTranslation } from '@collabo/i18n'
import { createFileRoute } from '@tanstack/react-router'

import styles from './index.module.css'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const { t } = useTranslation('console')
  return (
    <main className={styles.page}>
      <p className={styles.eyebrow}>{t('app.name')}</p>
      <h1 className={styles.title}>{t('home.title')}</h1>
      <p className={styles.body}>{t('home.body')}</p>
    </main>
  )
}
