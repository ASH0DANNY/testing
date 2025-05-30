import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { collection, addDoc, getDocs, query, orderBy, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from 'firebaseConfig';
import { Bill } from 'types/bills';

export interface BillState {
    bills: Bill[];
    loading: boolean;
    error: string | null;
}

const initialState: BillState = {
    bills: [],
    loading: false,
    error: null
};

export const createBill = createAsyncThunk('bills/createBill', async (bill: Bill) => {
    try {
        const docRef = await addDoc(collection(db, 'bills'), bill);
        return { ...bill, id: docRef.id };
    } catch (error) {
        console.error('Error creating bill:', error);
        throw error;
    }
});

export const fetchBills = createAsyncThunk('bills/fetchBills', async () => {
    try {
        const q = query(collection(db, 'bills'), orderBy('date', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ ...doc.data() as Bill, id: doc.id }));
    } catch (error) {
        console.error('Error fetching bills:', error);
        throw error;
    }
});

// New thunk for processing returns
export const processReturn = createAsyncThunk(
    'bills/processReturn',
    async (returnData: {
        returnBill: Bill,
        itemsToReturn: { productCode: string, quantity: number }[]
    }, { getState, rejectWithValue }) => {
        try {
            // Get current products state to find product IDs by product codes
            const state = getState() as { products: { productArray: any[] } };
            const products = state.products.productArray;

            // 1. Update product stock for each returned item
            for (const item of returnData.itemsToReturn) {
                try {
                    // Find the product in the state using productCode
                    const product = products.find(p => p.productCode === item.productCode);

                    if (!product) {
                        console.error(`Product not found with code: ${item.productCode}`);
                        return rejectWithValue(`Product not found: ${item.productCode}`);
                    }

                    // Use product_id to reference the document
                    const productRef = doc(db, 'products', product.product_id);
                    const productSnap = await getDoc(productRef);

                    if (productSnap.exists()) {
                        const currentQuantity = productSnap.data().quantity || 0;
                        await updateDoc(productRef, {
                            quantity: currentQuantity + item.quantity
                        });
                        console.log(`Updated stock for product ${item.productCode}, added ${item.quantity} units`);
                    } else {
                        console.error(`Product document not found: ${product.product_id}`);
                        return rejectWithValue(`Product document not found: ${product.product_id}`);
                    }
                } catch (error) {
                    console.error(`Error updating stock for product ${item.productCode}:`, error);
                    return rejectWithValue(`Error updating stock for product ${item.productCode}`);
                }
            }

            // 2. Create the return bill
            try {
                const docRef = await addDoc(collection(db, 'bills'), returnData.returnBill);
                console.log('Return bill created with ID:', docRef.id);
                return { ...returnData.returnBill, id: docRef.id };
            } catch (error) {
                console.error('Error creating return bill:', error);
                return rejectWithValue('Error creating return bill');
            }

        } catch (error) {
            console.error('Error processing return:', error);
            return rejectWithValue((error as Error).message || 'Failed to process return');
        }
    }
);

const billsSlice = createSlice({
    name: 'bills',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(createBill.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createBill.fulfilled, (state, action) => {
                state.bills.unshift(action.payload);
                state.loading = false;
            })
            .addCase(createBill.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to create bill';
            })
            .addCase(fetchBills.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchBills.fulfilled, (state, action) => {
                state.bills = action.payload;
                state.loading = false;
            })
            .addCase(fetchBills.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch bills';
            })
            // Add cases for processReturn
            .addCase(processReturn.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(processReturn.fulfilled, (state, action) => {
                state.bills.unshift(action.payload);
                state.loading = false;
            })
            .addCase(processReturn.rejected, (state, action) => {
                state.loading = false;
                state.error = typeof action.payload === 'string' ? action.payload : 'Failed to process return';
            });
    }
});

export const { clearError } = billsSlice.actions;
export default billsSlice.reducer;