import { createSlice } from "@reduxjs/toolkit";

const uiSlice = createSlice({
  name: "ui",
  initialState: {
    sidebar: {
      collapsed: false,
    },
    mode: "light",
  },
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
  },
});

export const { setRowsPerPage, toggleSidebar, setMode } = uiSlice.actions;
export default uiSlice.reducer;
