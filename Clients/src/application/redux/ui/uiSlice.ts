import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  sidebar: {
    collapsed: false,
  },
  mode: "light",
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
  },
});

export default uiSlice.reducer;
export const { setRowsPerPage, toggleSidebar, setMode } = uiSlice.actions;
