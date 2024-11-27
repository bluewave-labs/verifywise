import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState = {
  isLoading: false,
  authToken: "",
  user: "",
  success: null as boolean | null,
  message: null as string | null,
};

export const register = createAsyncThunk(
  "user/register",
  async (form, thunkApi) => {
    console.log(form);
    console.log(thunkApi);
  }
);

export const login = createAsyncThunk("user/login", async (form, thunkApi) => {
  console.log(form);
  console.log(thunkApi);
});

export const update = createAsyncThunk(
  "user/update",
  async (form, thunkApi) => {
    console.log(form);
    console.log(thunkApi);
  }
);

export const remove = createAsyncThunk(
  "user/delete",
  async (form, thunkApi) => {
    console.log(form);
    console.log(thunkApi);
  }
);

export const forgotPassword = createAsyncThunk(
  "user/forgotPassword",
  async (form, thunkApi) => {
    console.log(form);
    console.log(thunkApi);
  }
);

export const setNewPassword = createAsyncThunk(
  "user/setNewPassword",
  async (form, thunkApi) => {
    console.log(form);
    console.log(thunkApi);
  }
);

const handleAuthFulfilled = (state: any, action: any) => {
  state.isLoading = false;
  state.success = action.payload.success;
  state.message = action.payload.message;
  state.authToken = action.payload.data.authToken;
  state.user = action.payload.data.user;
};

const handleAuthRejected = (state: any, action: any) => {
  state.isLoading = false;
  state.success = false;
  state.message = action.payload
    ? action.payload.message
    : "An error occurred. Please try again later";
};

const handleUpdateFulfilled = (state: any, action: any) => {
  state.isLoading = false;
  state.success = action.payload.success;
  state.message = action.payload.message;
  state.user = action.payload.data;
};

const handleUpdateRejected = (state: any, action: any) => {
  state.isLoading = false;
  state.success = false;
  state.message = action.payload
    ? action.payload.message
    : "An error occurred. Please try again later";
};

const handleRemoveFulfilled = (state: any, action: any) => {
  state.isLoading = false;
  state.success = action.payload.success;
  state.message = action.payload.message;
};

const handleRemoveRejected = (state: any, action: any) => {
  state.isLoading = false;
  state.success = false;
  state.message = action.payload
    ? action.payload.message
    : "An error occurred. Please try again later";
};

const handleForgotPasswordFulfilled = (state: any, action: any) => {
  state.isLoading = false;
  state.success = action.payload.success;
  state.message = action.payload.message;
};

const handleForgotPasswordRejected = (state: any, action: any) => {
  state.isLoading = false;
  state.success = false;
  state.message = action.payload
    ? action.payload.message
    : "An error occurred. Please try again later";
};

const handleNewPasswordRejected = (state: any, action: any) => {
  state.isLoading = false;
  state.success = false;
  state.message = action.payload
    ? action.payload.message
    : "An error occurred. Please try again later";
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuthState: (state) => {
      state.authToken = "";
      state.user = "";
      state.isLoading = false;
      state.success = true;
      state.message = "Logged out successfully";
    },
    setAuthToken: (state, action: PayloadAction<string>) => {
      state.authToken = action.payload;
    },
  },
  extraReducers(builder) {
    // Register thunk
    builder
      .addCase(register.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(register.fulfilled, handleAuthFulfilled)
      .addCase(register.rejected, handleAuthRejected);

    // Login thunk
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(login.fulfilled, handleAuthFulfilled)
      .addCase(login.rejected, handleAuthFulfilled);

    // Update thunk
    builder
      .addCase(update.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(update.fulfilled, handleUpdateFulfilled)
      .addCase(update.rejected, handleUpdateRejected);

    // Remove thunk
    builder
      .addCase(remove.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(remove.fulfilled, handleRemoveFulfilled)
      .addCase(remove.rejected, handleRemoveRejected);

    // Forgot password thunk
    builder
      .addCase(forgotPassword.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(forgotPassword.fulfilled, handleForgotPasswordFulfilled)
      .addCase(forgotPassword.rejected, handleForgotPasswordRejected);

    // set new password
    builder
      .addCase(setNewPassword.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(setNewPassword.fulfilled, handleAuthFulfilled)
      .addCase(setNewPassword.rejected, handleNewPasswordRejected);
  },
});

export default authSlice.reducer;
export const { clearAuthState, setAuthToken } = authSlice.actions;
