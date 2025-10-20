<template>
    <ion-page>
        <ion-header>
            <ion-toolbar>
                <ion-title>Galerie</ion-title>
            </ion-toolbar>
        </ion-header>
        <ion-content :fullscreen="true">
            <div class="fav">
                <ion-item button @click="toggleFav">
                    <ion-label>Favorites</ion-label>
                    <ion-toggle
                        slot="end"
                        :checked="photoStore.showOnlyFavorites"
                    />
                </ion-item>
            </div>

            <ion-fab vertical="bottom" horizontal="center" slot="fixed">
                <ion-fab-button @click="handleTakePhoto()">
                    <ion-icon :icon="camera"></ion-icon>
                </ion-fab-button>
            </ion-fab>
            <ion-grid v-if="photos.length > 0">
                <ion-row>
                    <ion-col size="6" size-md="4" size-lg="3" :key="p.name" v-for="p in displayedPhotos">
                        <div class="image-ctn">
                            <div class="icon-smol">
                                <div class="main">
                                    <ion-icon v-if="!p?.metadata.isLiked" :icon=" heartOutline"></ion-icon>
                                    <ion-icon v-else :icon="heart" class="red"></ion-icon>
                                </div>
                            </div>
                            <ion-img :src="p.webviewPath" @click="openModal(p)"></ion-img>
                        </div>
                    </ion-col>
                </ion-row>
            </ion-grid>
            <div v-else class="no-photos">Plutôt vide par ici...</div>
        </ion-content>
        <photo-modal
            :is-open="isModalOpen"
            :photo="selectedPhoto"
            @close="closeModal"
            @deleted="closeModal(true)"
        />
    </ion-page>
</template>

<style scoped>
.fav {
    margin-top: 8px;
}
.image-ctn {
    border-radius: 4px;
    overflow: hidden;
    position: relative;
    aspect-ratio: 1;
}

.image-ctn ion-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.image-ctn .icon-smol {
    position: absolute;
    top: 5px;
    right: 5px;
    font-size: 24px;
    pointer-events: none;
}

.red {
    color: #ff2752;
}

.no-photos {
    opacity: .5;
    font-size: 16px;
    font-style: italic;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
}

</style>

<script setup lang="ts">
import {camera, heart, heartOutline} from 'ionicons/icons';
import {
    IonImg,
    IonPage,
    IonHeader,
    IonFab,
    IonFabButton,
    IonIcon,
    IonToolbar,
    IonTitle,
    IonContent,
    IonRow,
    IonCol,
    IonGrid,
    IonToggle,
    IonLabel,
    IonItem
} from '@ionic/vue';
import {useCamera} from '@/composables/useCamera';
import {usePhotoStore} from '@/stores/photoStore';
import {storeToRefs} from 'pinia';
import {Photo} from "@/domain/models/Photo";
import PhotoModal from "@/components/PhotoModal.vue";
import {Coordinates, useGeolocation} from "@/composables/useGeolocation";
import {GeocodingService, LocationInfo} from "@/services/GeocodingService";
import {usePhotoModal} from '@/composables/usePhotoModal';

const {isModalOpen, selectedPhoto, openModal, closeModal} = usePhotoModal();

const photoStore = usePhotoStore();
const {photos, showOnlyFavorites, displayedPhotos} = storeToRefs(photoStore);

const {takePhoto} = useCamera();
const {getCurrentPosition} = useGeolocation();

const toggleFav = () => {
    photoStore.toggleFavoritesFilter();
}

const handleTakePhoto = async () => {
    const photo: Photo = await takePhoto();

    const coordinates: Coordinates | null = await getCurrentPosition();
    let locationInfo: LocationInfo = {city: null, country: null};
    if (coordinates?.latitude && coordinates.longitude) {
        locationInfo = await GeocodingService.getPlaceFromCoordinates(coordinates?.longitude, coordinates?.latitude)
    }
    photoStore.addPhoto(photo, coordinates, locationInfo);
}
</script>
