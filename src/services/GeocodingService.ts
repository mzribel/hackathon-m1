import axios from "axios";
const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

if (!MAPBOX_ACCESS_TOKEN) {
    throw new Error('Mapbox token manquant dans .env');
}

export interface LocationInfo {
    city: string|null;
    country: string|null;
}

export class GeocodingService {
    private static geocodingURL = "https://api.mapbox.com/geocoding/v5/mapbox.places/"

    static async getPlaceFromCoordinates(long:string|number, lat:string|number):Promise<LocationInfo> {
        try {
            const url = this.getURL(long, lat);
            const response = await axios.get(url);

            if (!response.data.features?.length) {
                return { city: null, country: null };
            }

            // Ville
            const placeFeature = response.data.features.find(
                (f: any) => f.place_type.includes('place') || f.place_type.includes('locality')
            );

            // Pays
            const countryFeature = response.data.features.find(
                (f: any) => f.place_type.includes('country')
            );

            // Nom complet
            const city = placeFeature?.text || placeFeature?.place_name?.split(',')[0] || null;
            const country = countryFeature?.text || null;

            return { city, country };
        } catch (error) {
            console.error('Erreur Mapbox:', error);
            return { city: null, country: null };
        }
    }

    private static getURL(long:number|string, lat:number|string): string {
        return GeocodingService.geocodingURL + `${long},${lat}.json` + `?access_token=${MAPBOX_ACCESS_TOKEN}`;
    }
}
