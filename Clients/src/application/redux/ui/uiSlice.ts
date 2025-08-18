import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  sidebar: {
    collapsed: false,
  },
  mode: "light",
  modelInventory: {
    statusFilter: "all",
  },
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setRowsPerPage: (state: any, action) => {
      const { table, value } = action.payload;
      if (state[table]) {
        state[table].rowsPerPage = value;
      }
    },
    toggleSidebar: (state) => {
      state.sidebar.collapsed = !state.sidebar.collapsed;
    },
    setMode: (state, action) => {
      state.mode = action.payload;
    },
    setModelInventoryStatusFilter: (state, action) => {
      state.modelInventory.statusFilter = action.payload;
    },
  },
});

export default uiSlice.reducer;
export const {
  setRowsPerPage,
  toggleSidebar,
  setMode,
  setModelInventoryStatusFilter,
} = uiSlice.actions;
