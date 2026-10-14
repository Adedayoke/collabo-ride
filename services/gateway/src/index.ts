import { createService, startService } from '@collabo/service-kit'
import { env } from './env'

const app = createService({
  env,
  // The gateway signs context instead of checking it.
  signedContext: false,
  routes: () => {
    // Routes land here feature by feature.
  },
})

startService(app, env)
