// composables/usePhotoModal.ts
import { ref } from 'vue';
import { Photo } from '@/domain/models/Photo';

const isModalOpen = ref(false);
const selectedPhoto = ref<Photo | null>(null);

export const usePhotoModal = () => {
    const openModal = (photo: Photo) => {
        console.log('🟢 openModal called');
        selectedPhoto.value = photo;
        isModalOpen.value = true;
        console.log('📊 After - isModalOpen:', isModalOpen.value);
    };

    const closeModal = (deleted: boolean = false) => {
        console.log('🔴 closeModal called', deleted);
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
