import { ref } from 'vue';
import { Geolocation, PositionOptions } from '@capacitor/geolocation';

export type Coordinates = {
    latitude: number|null;
    longitude: number|null;
    accuracy?: number;
    timestamp?: number;
};

export function useGeolocation() {
    const currentPosition = ref<Coordinates | null>(null);
    const isLoading = ref(false);

    const getCurrentPosition = async (options?: PositionOptions): Promise<Coordinates|null> => {
        isLoading.value = true;
        let result: Coordinates|null = null;

        try {
            const position = await Geolocation.getCurrentPosition(options);
            result = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
            };

            currentPosition.value = result;
        } catch (error) { /* empty */ }

        isLoading.value = false
        return result;
    }

    return {
        currentPosition,
        isLoading,
        getCurrentPosition,
    }
}