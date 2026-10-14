import { createService, startService } from '@collabo/service-kit'
import { env } from './env'

const app = createService({
  env,
  routes: () => {
    // Routes land here feature by feature.
  },
})

startService(app, env)
