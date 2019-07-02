import { Vue, Component } from 'vue-property-decorator';
import * as backend from '@/backend';

@Component
export class RequestMixin extends Vue {
  public async makeRequest<T extends { result: 'success' }>(
    f: () => Promise<T | backend.BackendError | backend.BackendNotFound>, cb?: (result: T) => void,
  ) {
    const result = await f();
    if (result.result === 'error') {
      this.$notification.open({
        duration: 10000,
        message: result.message,
        position: 'is-bottom-right',
        type: 'is-danger',
      });
    } else if (result.result === 'not-found') {
      this.$notification.open({
        duration: 10000,
        message: 'Item not found in database',
        position: 'is-bottom-right',
        type: 'is-danger',
      });
    } else {
      if (cb) {
        cb(result);
      }
    }
  }
}
