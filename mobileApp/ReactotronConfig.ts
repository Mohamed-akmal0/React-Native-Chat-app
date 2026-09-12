import Reactotron from "reactotron-react-native";

Reactotron
//   .setAsyncStorageHandler(AsyncStorage) // Controls connection to AsyncStorage
  .configure({
    name: "Nexora Chat App",
    // host: '192.168.x.x' // Add your computer's IP if testing on a physical device
  })
  .useReactNative()
  .connect();
