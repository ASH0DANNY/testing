export interface AppSettings {
    theme: {
        darkMode: boolean;
    };

    notifications: {
        enabled: boolean;
    };

    billing: {
        defaultGST: number;
    };

    business: {
        businessName: string;
        businessAddress: string;
        businessCity: string;
        businessState: string;
        businessPostalCode: string;
        businessPhone: string;
        businessEmail: string;
        businessGSTIN: string;
    };

    billSettings: {
        paperWidth: number;
        showLogo: boolean;
        showBusinessAddress: boolean;
        showGSTIN: boolean;
        showFooterText: boolean;
        showBankDetails: boolean;
        footerText: string;
    };

    reportSettings: {
        defaultDateRange: 'today' | 'week' | 'month' | 'year';
        showGraphs: boolean;
        enableExport: boolean;
        defaultView: 'detailed' | 'summary';
        autoRefresh: boolean;
        refreshInterval: 30 | 60 | 300 | 600; // In seconds: 30s, 1m, 5m, 10m
        showTotals: boolean;
    };
}
