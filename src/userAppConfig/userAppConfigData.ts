import { businessDetails } from "types/business";

export const userAppConfigData = {
    businessData: {
        businessName: "Default Business Name",
        businessTitle: "Default Business Title",
        businessType: "Default Business Type",
        businessAddress: "123 Main St",
        businessCity: "Default City",
        businessState: "Default State",
        businessPostalCode: 123456,
        businessPhone: [9876543210],
        businessEmail: "info@defaultbusiness.com",
        businessGSTIN: "DEFAULTGSTIN123",
    } as businessDetails,

    appSettings: {
        defaultGSTPercentage: 18,
        defaultPaymentMethod: "cash",
        showStock: true,
        allowNegativeStock: false,
        roundOff: true,
        dateFormat: "DD/MM/YYYY",
        printFormat: "A4",
    },
};