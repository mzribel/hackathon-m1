import { ref } from 'vue';
import { Photo } from '@/domain/models/Photo';

const isModalOpen = ref(false);
const selectedPhoto = ref<Photo | null>(null);

export const usePhotoModal = () => {
    const openModal = (photo: Photo) => {
        selectedPhoto.value = photo;
        isModalOpen.value = true;
    };

    const closeModal = (deleted: boolean = false) => {
        isModalOpen.value = false;
        if (deleted) {
            selectedPhoto.value = null;
        }
    };

    return {
        isModalOpen,
        selectedPhoto,
        openModal,
        closeModal
    };
};
