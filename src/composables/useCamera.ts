import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import {Photo} from "@/domain/models/Photo";

export const useCamera = () => {
    const takePhoto = async ():Promise<Photo> => {
        const photo = await Camera.getPhoto({
            resultType: CameraResultType.Uri,
            source: CameraSource.Camera,
            quality: 100,
        });

        const fileName = Date.now() + ".jpg";
        return new Photo(
            fileName,
             {
                takenAt: new Date().toISOString(),
                isLiked: false,
                 locationInfo: {city:null, country:null},
                 locationCoordinates: {longitude:null,latitude:null}
            },
            photo.webPath
        );
    };

    return {
        takePhoto,
    };
};