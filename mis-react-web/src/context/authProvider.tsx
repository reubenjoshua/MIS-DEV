import axios from "axios";
import { UserToken, UserLogin } from "../models/User";
import { handleError } from "../helpers/errorHandlers";

const API_URL = "http://localhost:5000/api";

export const loginAPI = async (userData: UserLogin) => {
    try {
        const response = await axios.post(`${API_URL}/auth/login`, userData, { withCredentials: true });
        return response.data;
    } catch (err) {
        handleError(err);
        throw err;
    }
};