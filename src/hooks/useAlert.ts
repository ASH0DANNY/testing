import { useCallback } from 'react';
import { dispatch } from 'store/index-store';
import { openSnackbar } from 'store/reducers/snackbar-reducer';

type AlertColor = 'success' | 'info' | 'warning' | 'error';

interface UseAlertProps {
    showMessage: (message: string, severity?: AlertColor) => void;
}

const useAlert = (): UseAlertProps => {
    const showMessage = useCallback((message: string, severity: AlertColor = 'info') => {
        dispatch(
            openSnackbar({
                open: true,
                message,
                variant: 'alert',
                alert: {
                    color: severity,
                    variant: 'filled'
                },
                close: true,
                transition: 'SlideLeft'
            })
        );
    }, []);

    return { showMessage };
};

export default useAlert;
