import axios from "axios";
import { useCallback } from "react";
import { useAuth } from "@clerk/expo";
import * as Sentry from "@sentry/react-native";

const api_Url = "https://nexora-00xrp.sevalla.app/api/v1";

// const api = axios.create({
//   baseURL: api_Url,
//   headers: {
//     "Content-Type": "application/json",
//   },
// });

// export const useApi = () => {
//   const { getToken } = useAuth();

//   useEffect(() => {
//     const requestInterceptor = api.interceptors.request.use(async (config) => {
//       const token = await getToken();
//       if (token) {
//         config.headers.Authorization = `Bearer ${token}`;
//       }
//       return config;
//     });

//     const responseInterceptors = api.interceptors.response.use(
//       (response) => response,
//       (error) => {
//         //log api errors to sentry
//         if (error.response) {
//           Sentry.logger.error(
//             Sentry.logger
//               .fmt`Api request failed: ${error.config?.method?.toUpperCase()}, ${error.config?.method}`,
//             {
//               status: error.response?.status,
//               method: error.config?.method,
//               url: error.config?.url,
//             },
//           );
//         }else if(error.request){
//           Sentry.logger.warn("Api request failed - no respnose", {
//             url: error.config?.url,
//             method: error.config?.method
//           })
//         }

//         return Promise.reject(error)
//       },
//     );

//     return () => {
//       api.interceptors.request.eject(requestInterceptor);
//       api.interceptors.response.eject(responseInterceptors)
//     };
//   }, []);

//   return api;
// };

// this is the same thing I did with useEffect setup but it's optimized version - it's better!!

const api = axios.create({
  baseURL: api_Url,
  headers: { "Content-Type": "application/json" },
});

// Response interceptor registered once
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      Sentry.logger.error(
        Sentry.logger
          .fmt`API request failed: ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
        { status: error.response.status, endpoint: error.config?.url, method: error.config?.method }
      );
    } else if (error.request) {
      Sentry.logger.warn("API request failed - no response", {
        endpoint: error.config?.url,
        method: error.config?.method,
      });
    }
    return Promise.reject(error);
  }
);

export const useApi = () => {
  const { getToken } = useAuth();

  const apiWithAuth = useCallback(
    async <T>(config: Parameters<typeof api.request>[0]) => {
      const token = await getToken();
      return api.request<T>({
        ...config,
        headers: { ...config.headers, ...(token && { Authorization: `Bearer ${token}` }) },
      });
    },
    [getToken]
  );

  return { api, apiWithAuth };
};