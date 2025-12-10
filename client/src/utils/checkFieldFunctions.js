import axios from "axios";

export const updateField = async (field) => {
    if (['name', 'username', 'username_lower'].includes(Object.keys(field)[0]) && Object.values(field)[0].trim().length === 0) {
        throw new Error("Field is required");
    }
    try {
        await axios.patch(`http://localhost:8800/api/users`, field);
    } catch (error) {
        throw new Error(error.response.data.message);
    }
}