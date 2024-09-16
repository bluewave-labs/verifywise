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
    toggleSidebar: (state) => {
      state.sidebar.collapsed = !state.sidebar.collapsed;
    },
    setMode: (state, action) => {
      state.mode = action.payload;
    },
  },
});

export const { toggleSidebar, setMode } = uiSlice.actions;
export default uiSlice.reducer;
