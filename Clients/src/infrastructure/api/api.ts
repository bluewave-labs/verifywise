import axios from "axios";

const api = axios.create({
    baseURL: process.env.BASE_URL
})

export default api;