import {ref, onUnmounted, Ref, watch, nextTick} from 'vue';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { usePhotoStore } from '@/stores/photoStore';
import {Photo} from "@/domain/models/Photo";
import {usePhotoModal} from "@/composables/usePhotoModal";
import {storeToRefs} from "pinia";
import Swiper from 'swiper';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { useGeolocation } from '@/composables/useGeolocation';

export function useMapbox(container: Ref<HTMLElement | null>) {
    const isLoading = ref(true);
    let map: mapboxgl.Map | null = null;
    let userLocationMarker: mapboxgl.Marker | null = null;
    const photoStore = usePhotoStore();
    const { displayedPhotos } = storeToRefs(photoStore);
    const { openModal } = usePhotoModal();
    const { getCurrentPosition } = useGeolocation();

    const initMap = (style = 'mapbox://styles/mapbox/streets-v11') => {
        if (!container.value) return;

        mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;
        map = new mapboxgl.Map({
            container: container.value,
            style: style,
            center: [2.3522, 48.8566],
            zoom: 5,
        });

        map.on('load', () => {
            isLoading.value = false;
            map?.resize();
            loadPinIcons();
            initClusters();
            setupPhotoWatchers();
            initUserLocation();
        });
    };

    const initUserLocation = async () => {
        if (!map) return;

        try {
            const position = await getCurrentPosition({
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            });

            if (!position || !position.latitude || !position.longitude) {
                console.warn('Géolocalisation non disponible');
                return;
            }

            const { longitude, latitude } = position;

            const el = document.createElement('div');
            el.className = 'user-location-marker';
            el.innerHTML = `
                <div style="
                    width: 20px;
                    height: 20px;
                    background-color: #4285F4;
                    border: 3px solid white;
                    border-radius: 50%;
                    box-shadow: 0 0 10px rgba(66, 133, 244, 0.6);
                    cursor: pointer;
                    position: relative;
                ">
                    <div style="
                        position: absolute;
                        width: 20px;
                        height: 20px;
                        border-radius: 50%;
                        background-color: rgba(66, 133, 244, 0.3);
                        animation: pulse 2s infinite;
                        top: 0;
                        left: 0;
                    "></div>
                </div>
            `;

            userLocationMarker = new mapboxgl.Marker(el)
                .setLngLat([longitude, latitude])
                .addTo(map);

            map.flyTo({
                center: [longitude, latitude],
                zoom: 12,
                duration: 2000,
                essential: true
            });

        } catch (error) {
            console.warn('Erreur géolocalisation:', error);
        }
    };

    const centerOnUserLocation = async () => {
        if (!map) return;

        try {
            const position = await getCurrentPosition({
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            });

            if (!position || !position.latitude || !position.longitude) return;

            const { longitude, latitude } = position;

            if (userLocationMarker) {
                userLocationMarker.setLngLat([longitude, latitude]);
            }

            map.flyTo({
                center: [longitude, latitude],
                zoom: 14,
                duration: 1500
            });

        } catch (error) {
            console.warn('Impossible de recentrer:', error);
        }
    };

    const groupPhotosByLocation = (photos: Photo[]) => {
        const grouped = new Map<string, Photo[]>();

        photos.forEach(photo => {
            if (!photo.metadata.locationCoordinates?.latitude ||
                !photo.metadata.locationCoordinates?.longitude) return;

            const key = `${photo.metadata.locationCoordinates.latitude},${photo.metadata.locationCoordinates.longitude}`;

            if (!grouped.has(key)) {
                grouped.set(key, []);
            }
            grouped.get(key)!.push(photo);
        });

        return grouped;
    };

    const photosToGeoJSON = (photos: Photo[]): GeoJSON.FeatureCollection<GeoJSON.Point> => {
        const grouped = groupPhotosByLocation(photos);

        return {
            type: 'FeatureCollection',
            features: Array.from(grouped.entries()).map(([key, photosAtLocation]) => {
                const [lat, lng] = key.split(',').map(Number);
                return {
                    type: 'Feature',
                    properties: {
                        photos: photosAtLocation.map(p => ({
                            name: p.name,
                            webviewPath: p.webviewPath,
                            date: p.metadata.takenAt
                        })),
                        count: photosAtLocation.length
                    },
                    geometry: {
                        type: 'Point',
                        coordinates: [lng, lat]
                    }
                };
            })
        };
    };

    const createSwiperPopup = (photos: Array<{name: string, webviewPath: string, date: string}>) => {
        const popupContent = document.createElement('div');
        popupContent.className = 'photo-swiper-popup';

        popupContent.innerHTML = `
            <div class="swiper" >
                <div class="swiper-wrapper">
                    ${photos.map(photo => `
                        <div class="swiper-slide">
                            <img 
                                src="${photo.webviewPath}" 
                                data-photo-name="${photo.name}"
                                style="width: 100%; height: 100%; object-fit: cover; cursor: pointer;"
                                alt=""
                            />
                        </div>
                    `).join('')}
                </div>
                ${photos.length > 1 ? `
                    <div class="swiper-button-prev"></div>
                    <div class="swiper-button-next"></div>
                    <div class="swiper-pagination"></div>
                ` : ''}
            </div>
        `;

        setTimeout(() => {
            new Swiper(popupContent.querySelector('.swiper') as HTMLElement, {
                modules: [Navigation, Pagination],
                navigation: {
                    nextEl: '.swiper-button-next',
                    prevEl: '.swiper-button-prev',
                },
                pagination: {
                    el: '.swiper-pagination',
                    type: 'fraction',
                },
                loop: photos.length > 1,
            });

            popupContent.querySelectorAll('img').forEach(img => {
                img.addEventListener('click', () => {
                    const photoName = img.getAttribute('data-photo-name');
                    const photo = displayedPhotos.value.find(p => p.name === photoName);
                    if (photo) {
                        nextTick(() => openModal(photo));
                    }
                });
            });
        }, 100);

        return popupContent;
    };


    const loadPinIcons = () => {
        if (!map) return;

        const singlePinSvg = `
        <svg width="30" height="40" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 0C6.716 0 0 6.716 0 15c0 8.284 15 25 15 25s15-16.716 15-25c0-8.284-6.716-15-15-15z" 
                  fill="#FF0000" stroke="#fff" stroke-width="2"/>
            <circle cx="15" cy="15" r="6" fill="#fff"/>
        </svg>
    `;

        const multiPinSvg = `
        <svg width="30" height="40" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 0C6.716 0 0 6.716 0 15c0 8.284 15 25 15 25s15-16.716 15-25c0-8.284-6.716-15-15-15z" 
                  fill="#FF6B6B" stroke="#fff" stroke-width="2"/>
            <circle cx="15" cy="15" r="6" fill="#fff"/>
        </svg>
    `;

        const singlePinImg = new Image(30, 40);
        singlePinImg.src = 'data:image/svg+xml;base64,' + btoa(singlePinSvg);
        singlePinImg.onload = () => {
            map?.addImage('single-pin', singlePinImg);
        };

        const multiPinImg = new Image(30, 40);
        multiPinImg.src = 'data:image/svg+xml;base64,' + btoa(multiPinSvg);
        multiPinImg.onload = () => {
            map?.addImage('multi-pin', multiPinImg);
        };
    };

    const initClusters = () => {
        if (!map) return;

        loadPinIcons();

        map.addSource('photos', {
            type: 'geojson',
            data: photosToGeoJSON(displayedPhotos.value),
            cluster: true,
            clusterMaxZoom: 14,
            clusterRadius: 50
        });

        map.addLayer({
            id: 'clusters',
            type: 'circle',
            source: 'photos',
            filter: ['has', 'point_count'],
            paint: {
                'circle-color': [
                    'step',
                    ['get', 'point_count'],
                    '#51bbd6', 10,
                    '#f1f075', 20,
                    '#f28cb1'
                ],
                'circle-radius': [
                    'step',
                    ['get', 'point_count'],
                    20, 10,
                    30, 20,
                    40
                ]
            }
        });

        map.addLayer({
            id: 'cluster-count',
            type: 'symbol',
            source: 'photos',
            filter: ['has', 'point_count'],
            layout: {
                'text-field': '{point_count_abbreviated}',
                'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                'text-size': 12
            }
        });

        map.addLayer({
            id: 'unclustered-point',
            type: 'symbol',
            source: 'photos',
            filter: ['!', ['has', 'point_count']],
            layout: {
                'icon-image': [
                    'case',
                    ['>', ['get', 'count'], 1],
                    'multi-pin',
                    'single-pin'
                ],
                'icon-size': 1,
                'icon-anchor': 'bottom',
                'icon-allow-overlap': true
            }
        });

        map.addLayer({
            id: 'photo-count',
            type: 'symbol',
            source: 'photos',
            filter: ['all', ['!', ['has', 'point_count']], ['>', ['get', 'count'], 1]],
            layout: {
                'text-field': '{count}',
                'text-font': ['DIN Offc Pro Bold', 'Arial Unicode MS Bold'],
                'text-size': 11,
                'text-anchor': 'center',
                'text-offset': [0, -1.2],
                'text-allow-overlap': true
            },
            paint: {
                'text-color': '#FF6B6B'
            }
        });

        map.on('click', 'clusters', async (e) => {
            if (!map) return;
            const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
            const clusterId = features[0].properties!.cluster_id;
            const clusterSource = map.getSource('photos') as mapboxgl.GeoJSONSource;

            clusterSource.getClusterLeaves(clusterId, 100, 0, (err, leaves) => {
                if (err || !leaves) return;

                const firstCoords = (leaves[0].geometry as any).coordinates;
                const allSameLocation = leaves.every(leaf => {
                    const coords = (leaf.geometry as any).coordinates;
                    return coords[0] === firstCoords[0] && coords[1] === firstCoords[1];
                });

                if (allSameLocation) {
                    const allPhotos = leaves.flatMap(leaf =>
                        JSON.parse((leaf.properties as any).photos)
                    );

                    new mapboxgl.Popup()
                        .setLngLat(firstCoords)
                        .setDOMContent(createSwiperPopup(allPhotos))
                        .addTo(map!);
                } else {
                    clusterSource.getClusterExpansionZoom(clusterId, (err, zoom) => {
                        if (err || zoom === null || zoom === undefined) return;

                        map!.easeTo({
                            center: (features[0].geometry as any).coordinates,
                            zoom: Math.min(zoom, 16),
                            duration: 800
                        });
                    });
                }
            });
        });

        map.on('click', 'unclustered-point', (e) => {
            if (!map || !e.features || !e.features[0].properties) return;

            const coordinates = (e.features[0].geometry as any).coordinates.slice();
            const photos = JSON.parse(e.features[0].properties.photos);

            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }

            new mapboxgl.Popup()
                .setLngLat(coordinates)
                .setDOMContent(createSwiperPopup(photos))
                .addTo(map);
        });

        map.on('mouseenter', 'clusters', () => {
            if (map) map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', 'clusters', () => {
            if (map) map.getCanvas().style.cursor = '';
        });
        map.on('mouseenter', 'unclustered-point', () => {
            if (map) map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', 'unclustered-point', () => {
            if (map) map.getCanvas().style.cursor = '';
        });
    };

    const updatePhotos = () => {
        if (!map || !map.getSource('photos')) return;

        const source = map.getSource('photos') as mapboxgl.GeoJSONSource;
        source.setData(photosToGeoJSON(displayedPhotos.value));
    };

    const setupPhotoWatchers = () => {
        watch(displayedPhotos, () => {
            updatePhotos();
        }, { deep: true });
    };

    const changeMapStyle = (style: string) => {
        if (!map) return;
        map.setStyle(style);
        map.once('styledata', () => {
            initClusters();
        });
    };

    /**
     * Nettoie la carte
     */
    const cleanup = () => {
        if (userLocationMarker) {
            userLocationMarker.remove();
            userLocationMarker = null;
        }
        if (map) {
            map.remove();
            map = null;
        }
    };

    onUnmounted(cleanup);

    return {
        isLoading,
        initMap,
        changeMapStyle,
        centerOnUserLocation,
        cleanup,
    };
}
