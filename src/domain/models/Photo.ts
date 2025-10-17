import {LocationInfo} from "@/services/GeocodingService";
import {Coordinates} from "@/composables/useGeolocation";

export class Photo {
    constructor(
        public readonly name: string,
        public metadata: {
            readonly takenAt: string,
            locationCoordinates:Coordinates,
            locationInfo:LocationInfo,
            isLiked: boolean,
        },
        public readonly webviewPath?: string,
) {}

    toggleLike():void {
        this.metadata.isLiked = !this.metadata.isLiked
    }
}