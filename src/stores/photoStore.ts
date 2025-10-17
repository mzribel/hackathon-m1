import { defineStore } from 'pinia';
import {computed, ref, watch} from 'vue';
import {Photo} from "@/domain/models/Photo";
import {Coordinates} from "@/composables/useGeolocation";
import {LocationInfo} from "@/services/GeocodingService";

export const usePhotoStore = defineStore('photoStore', () => {
    const photos = ref<Photo[]>([]);
    const showOnlyFavorites = ref(false);

    watch(
        photos,
        (newPhotos) => {
            localStorage.setItem('photos', JSON.stringify(newPhotos));
        },
        { deep: true }
    );

    const addPhoto = (photo: Photo, coordinates?:Coordinates|null, locationInfo?:LocationInfo|null):void => {
        if (coordinates) {
            photo.metadata.locationCoordinates = coordinates;
        }
        if (locationInfo) {
            photo.metadata.locationInfo = locationInfo;
        }
        photos.value.push(photo);
    }
    const toggleLikeOnPhoto = (photoName:string):void => {
        const photo = photos.value.find((p) => p.name === photoName);
        if (photo) {
            photo.metadata.isLiked = !photo.metadata.isLiked;
        }
    }
    const getPhotos = ():Photo[] => {
        return photos.value;
    }
    const getPhotosWithPosition = computed(() =>
        photos.value.filter(p => p.metadata.locationCoordinates.latitude && p.metadata.locationCoordinates.longitude)
    );
    const deletePhoto = (photoName: string): boolean => {
        const index = photos.value.findIndex((p) => p.name === photoName);

        if (index === -1) {
            console.warn(`Photo "${photoName}" not found`);
            return false;
        }

        photos.value.splice(index, 1);
        return true;
    }

    const displayedPhotos = computed(() => {
        if (showOnlyFavorites.value) {
            return photos.value.filter(p => p.metadata.isLiked);
        }
        return photos.value;
    });

    const toggleFavoritesFilter = () => {
        showOnlyFavorites.value = !showOnlyFavorites.value;
    };


    return {
        photos,
        addPhoto,
        toggleLikeOnPhoto,
        getPhotos,
        getPhotosWithPosition,
        deletePhoto,
        toggleFavoritesFilter,
        displayedPhotos,
        showOnlyFavorites
    }
})