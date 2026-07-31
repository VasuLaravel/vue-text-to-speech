import { useQuasar } from 'quasar';
/**
 * Thin wrapper around Quasar's notify for consistent toast styling
 * across all tabs. Must be called inside a Vue component's setup().
 */
export function useToast() {
    const $q = useQuasar();
    function success(message) {
        $q.notify({
            message,
            color: 'positive',
            icon: 'check_circle',
            position: 'bottom-right',
            timeout: 2200,
            classes: 'pg-toast',
        });
    }
    function error(message) {
        $q.notify({
            message,
            color: 'negative',
            icon: 'error',
            position: 'bottom-right',
            timeout: 3500,
            classes: 'pg-toast',
        });
    }
    function info(message) {
        $q.notify({
            message,
            color: 'info',
            icon: 'info',
            position: 'bottom-right',
            timeout: 2200,
            classes: 'pg-toast',
        });
    }
    return { success, error, info };
}
