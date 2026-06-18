import axios from "axios";

export const getFraudProbability = async (features) => {
  const response = await axios.post(process.env.ML_SERVICE_URL, features);
  return response.data;
};
