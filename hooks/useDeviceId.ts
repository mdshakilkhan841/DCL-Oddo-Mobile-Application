import * as SecureStore from "expo-secure-store";
import uuid from "react-native-uuid";

export async function getDeviceId() {
    let deviceId = await SecureStore.getItemAsync("device_id");

    if (!deviceId) {
        deviceId = uuid.v4().toString();
        await SecureStore.setItemAsync("device_id", deviceId);
    }

    return deviceId;
}
