import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { AppSettings } from '../../types/settings';

interface AppSettingsState {
    settings: AppSettings;
    loading: boolean;
    error: string | null;
}

const initialState: AppSettingsState = {
    settings: {
        theme: {
            darkMode: false
        },
        notifications: {
            enabled: true
        },
        billing: {
            defaultGST: 5
        },
        business: {
            businessName: '',
            businessAddress: '',
            businessCity: '',
            businessState: '',
            businessPostalCode: '',
            businessPhone: '',
            businessEmail: '',
            businessGSTIN: ''
        },
        billSettings: {
            paperWidth: 80,
            showLogo: true,
            showBusinessAddress: true,
            showGSTIN: true,
            showFooterText: true,
            showBankDetails: true,
            footerText: 'Thank you for your business!'
        },
        reportSettings: {
            defaultDateRange: 'month',
            showGraphs: true,
            enableExport: true,
            defaultView: 'summary',
            autoRefresh: false,
            refreshInterval: 300,
            showTotals: true
        }
    },
    loading: false,
    error: null
};

// Fetch app settings from Firestore
export const fetchAppSettings = createAsyncThunk(
    'appSettings/fetchSettings',
    async (userId: string) => {
        const docRef = doc(db, 'users', userId, 'settings', 'appSettings');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data() as AppSettings;
        } else {
            // If document doesn't exist, create it with initial state
            await setDoc(docRef, initialState.settings);
            return initialState.settings;
        }
    }
);

// Update app settings in Firestore
export const updateAppSettings = createAsyncThunk(
    'appSettings/updateSettings',
    async ({ userId, settings }: { userId: string; settings: AppSettings }) => {
        try {
            const docRef = doc(db, 'users', userId, 'settings', 'appSettings');
            await setDoc(docRef, settings, { merge: true });
            return settings;
        } catch (error) {
            console.error('Error updating settings:', error);
            throw error;
        }
    }
);

const appSettingsSlice = createSlice({
    name: 'appSettings',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchAppSettings.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAppSettings.fulfilled, (state, action) => {
                state.loading = false;
                state.settings = action.payload;
            })
            .addCase(fetchAppSettings.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch settings';
            })
            .addCase(updateAppSettings.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateAppSettings.fulfilled, (state, action) => {
                state.loading = false;
                state.settings = action.payload;
            })
            .addCase(updateAppSettings.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to update settings';
            });
    }
});

export default appSettingsSlice.reducer;
