<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Carte</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
        <div class="loader" v-if="isLoading">
            <ion-spinner name="dots"></ion-spinner>
        </div>
        <div class="map-ctn">
<!--            <div class="map-details-ctn">hehe</div>-->
            <div ref="mapContainer" class="map-container"></div>
        </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonSpinner} from '@ionic/vue';
import { ref, onMounted } from 'vue';
import { useMapbox } from '@/composables/useMapBox';
const mapContainer = ref(null);
const { isLoading, initMap } = useMapbox(mapContainer);

onMounted(() => {
    initMap();
});
</script>

<style>
.swiper-button-next, .swiper-button-prev {
    color: white;
    height: 30px;
    width: 30px;
}
.swiper-pagination {
    color: white;
}
.map-ctn, .map-container { width: 100%; height: 100%; }
.map-ctn { position: relative; }
.map-details-ctn {
    position: absolute;
    z-index: 10;
    top: 0;
    left: 0;
    margin: 10px;
    background: #fff;
    padding: 10px;
    border-radius: 8px;
}
.loader {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 15;
    background: white;
    display: flex;
    align-items: center;
    justify-content: center;
}
</style>