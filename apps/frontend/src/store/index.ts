import { configureStore } from '@reduxjs/toolkit'
import authSlice from './slices/authSlice.js'
import notesSlice from './slices/notesSlice.js'
import uiSlice from './slices/uiSlice.js'

export const store = configureStore({
  reducer: {
    auth: authSlice,
    notes: notesSlice,
    ui: uiSlice,
  },
  middleware: (getDefaultMiddleware: any) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
