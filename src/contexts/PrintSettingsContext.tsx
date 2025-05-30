import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

interface PrintSettings {
    paperWidth: number;
    showLogo: boolean;
    showBusinessAddress: boolean;
    showGSTIN: boolean;
    showGSTBreakup: boolean;
    showBankDetails: boolean;
    showTermsConditions: boolean;
    showAuthorizedSignatory: boolean;
}

interface PrintSettingsContextType {
    settings: PrintSettings;
    updateSettings: (newSettings: Partial<PrintSettings>) => Promise<void>;
}

const defaultSettings: PrintSettings = {
    paperWidth: 80,
    showLogo: true,
    showBusinessAddress: true,
    showGSTIN: true,
    showGSTBreakup: true,
    showBankDetails: true,
    showTermsConditions: true,
    showAuthorizedSignatory: true
};

const PrintSettingsContext = createContext<PrintSettingsContextType>({
    settings: defaultSettings,
    updateSettings: async () => { }
});

export const usePrintSettings = () => useContext(PrintSettingsContext);

export const PrintSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<PrintSettings>(defaultSettings);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const settingsDoc = await getDoc(doc(db, 'settings', 'print'));
                if (settingsDoc.exists()) {
                    setSettings({ ...defaultSettings, ...settingsDoc.data() as PrintSettings });
                } else {
                    // Initialize with default settings if none exist
                    await setDoc(doc(db, 'settings', 'print'), defaultSettings);
                }
            } catch (error) {
                console.error('Error loading print settings:', error);
            }
        };

        loadSettings();
    }, []);

    const updateSettings = async (newSettings: Partial<PrintSettings>) => {
        try {
            const updatedSettings = { ...settings, ...newSettings };
            await setDoc(doc(db, 'settings', 'print'), updatedSettings);
            setSettings(updatedSettings);
        } catch (error) {
            console.error('Error updating print settings:', error);
            throw error;
        }
    };

    return (
        <PrintSettingsContext.Provider value={{ settings, updateSettings }}>
            {children}
        </PrintSettingsContext.Provider>
    );
};
