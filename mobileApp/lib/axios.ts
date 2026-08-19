import axios from "axios";
import { useEffect } from "react";
import { useAuth } from "@clerk/expo";
import * as Sentry from "@sentry/react-native";

const api_Url = "https://nexora-00xrp.sevalla.app/api/v1";

const api = axios.create({
  baseURL: api_Url,
  headers: {
    "Content-Type": "application/json",
  },
});

export const useApi = () => {
  const { getToken } = useAuth();

  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use(async (config) => {
      const token = await getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    const responseInterceptors = api.interceptors.response.use(
      (response) => response,
      (error) => {
        //log api errors to sentry
        if (error.response) {
          Sentry.logger.error(
            Sentry.logger
              .fmt`Api request failed: ${error.config?.method?.toUpperCase()}, ${error.config?.method}`,
            {
              status: error.response?.status,
              method: error.config?.method,
              url: error.config?.url,
            },
          );
        }else if(error.request){
          Sentry.logger.warn("Api request failed - no respnose", {
            url: error.config?.url,
            method: error.config?.method
          })
        }

        return Promise.reject(error)
      },
    );

    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptors)
    };
  }, []);

  return api;
};
