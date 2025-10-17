import mapboxgl from 'mapbox-gl';
import { watch } from 'vue';
import { usePhotoStore } from '@/stores/photoStore';
import { Photo } from "@/domain/models/Photo";

export class MapService {
    private static instance: MapService | null = null;
    private map: mapboxgl.Map | null = null;
    private markers = new Map<string, mapboxgl.Marker>();
    private isLoading = true;
    private container: HTMLElement | null = null;

    private constructor() {}

    public static getInstance(): MapService {
        if (!MapService.instance) {
            MapService.instance = new MapService();
        }
        return MapService.instance;
    }

    public initMap(container: HTMLElement, style = 'mapbox://styles/mapbox/streets-v11') {
        if (this.map) return;
        this.container = container;
        mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

        this.map = new mapboxgl.Map({
            container: container,
            style: style,
            center: [2.3522, 48.8566],
            zoom: 12,
        });

        this.map.on('load', () => {
            this.isLoading = false;
            this.initMarkers();
        });
    }

    private initMarkers() {
        if (!this.map) return;
        const photoStore = usePhotoStore();
        photoStore.photos
            .filter(p => p.metadata.locationCoordinates)
            .forEach(photo => this.addMarker(photo));
    }

    public addMarker(photo: Photo) {
        if (!this.map || this.markers.has(photo.name) || !photo.metadata.locationCoordinates.longitude || !photo.metadata.locationCoordinates.latitude) return;

        const marker = new mapboxgl.Marker({ color: "#FF0000" })
            .setLngLat([photo.metadata.locationCoordinates.longitude, photo.metadata.locationCoordinates.latitude])
            .setPopup(
                new mapboxgl.Popup().setHTML(
                    `<img src="${photo.webviewPath}" style="max-width: 200px; max-height: 200px;" alt=""/>`
                )
            )
            .addTo(this.map);

        this.markers.set(photo.name, marker);
    }

    public setupPhotoWatchers() {
        const photoStore = usePhotoStore();

        watch(
            () => photoStore.photos,
            (newPhotos, oldPhotos) => {
                if (!this.map) return;

                const newPhotosWithLocation = newPhotos.filter(p => p.metadata.locationCoordinates);
                const oldPhotosWithLocation = oldPhotos?.filter(p => p.metadata.locationCoordinates) || [];

                newPhotosWithLocation.forEach((newPhoto: Photo) => {
                    if (!oldPhotosWithLocation.some((oldPhoto: Photo) => oldPhoto.name === newPhoto.name)) {
                        this.addMarker(newPhoto);
                    }
                });

                oldPhotosWithLocation.forEach((oldPhoto: Photo) => {
                    if (!newPhotosWithLocation.some((newPhoto: Photo) => newPhoto.name === oldPhoto.name)) {
                        this.removeMarker(oldPhoto.name);
                    }
                });
            },
            { deep: true }
        );
    }

    public removeMarker(photoId: string) {
        const marker = this.markers.get(photoId);
        if (marker) {
            marker.remove();
            this.markers.delete(photoId);
        }
    }

    public cleanup() {
        this.markers.forEach(marker => marker.remove());
        this.markers.clear();
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
        this.isLoading = true;
    }

    public getMap() { return this.map; }
    public getIsLoading() { return this.isLoading; }
}
