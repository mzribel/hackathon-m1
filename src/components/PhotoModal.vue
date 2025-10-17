<template>
    <ion-modal
        :is-open="isOpen"
        @didDismiss="$emit('close')"
        :initial-breakpoint="1"
        :breakpoints="[0, 1]"
        class="photo-modal"
    >
        <ion-content class="photo-modal-content">
            <div class="modal-wrapper">
                <div class="title-bar">
                    <div class="icon left" @click="$emit('close')">
                        <ion-icon :icon="arrowBackOutline"></ion-icon>
                    </div>
                    <div class="title">
                        <div class="date">{{ formatDate(photo?.metadata.takenAt ?? "") }}</div>
                        <div class="location" v-if="photo?.metadata.locationInfo.city">{{ photo?.metadata.locationInfo.city }}, {{ photo?.metadata.locationInfo.country }}</div>
                    </div>
                    <div style="display: flex; height: 100%" class="right">
                        <div class="icon" @click="toggleLike">
                            <ion-icon v-if="!photo?.metadata.isLiked" :icon="heartOutline"></ion-icon>
                            <ion-icon v-else :icon="heart"></ion-icon>
                        </div>
                        <div class="icon" ref="popoverTrigger" @click="openPopover">
                            <ion-icon :icon="ellipsisVertical"></ion-icon>
                        </div>
                    </div>
                </div>
                <div class="img-ctn">
                    <ion-img :src="photo?.webviewPath"></ion-img>
                </div>
            </div>
            <ion-popover
                :is-open="isPopoverOpen"
                :event="popoverEvent"
                @didDismiss="isPopoverOpen = false"
                side="bottom"
                alignment="end"
            >
                <ion-content>
                    <ion-list>
                        <ion-item :button="true" :detail="false" @click="deletePhoto">Supprimer</ion-item>
                    </ion-list>
                </ion-content>
            </ion-popover>
        </ion-content>
    </ion-modal>
</template>

<style scoped>
.photo-modal {
    height: 100%;
    width: 100%;
}

.modal-wrapper {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
}

.title-bar {
    padding: 0 8px;
    margin-top: 15px;
    height: 60px;
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    gap: 10px;
    align-items: center;
    flex-shrink: 0;
}

.img-ctn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    padding: 16px;
}

.img-ctn ion-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.icon {
    height: 100%;
    width: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    cursor: pointer;
}

.title {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 3px;
}

.date {
    font-size: 16px;
    font-weight: 600;
}

.location {
    font-size: 12px;
    font-style: italic;
}

.left {
    justify-content: flex-start;
}

.right {
    justify-content: flex-end;
    gap: 4px;
}
</style>

<script setup lang="ts">
import { IonModal, IonContent, IonImg, IonIcon, IonPopover, IonItem, IonList } from "@ionic/vue";
import { arrowBackOutline, heartOutline, heart, ellipsisVertical } from "ionicons/icons";
import { Photo } from "@/domain/models/Photo";
import { formatDate } from "@/utils/format";
import { usePhotoStore } from "@/stores/photoStore";
import { Dialog } from "@capacitor/dialog";
import {ref} from "vue";

const photoStore = usePhotoStore();

const props = defineProps<{
    isOpen: boolean;
    photo: Photo | null;
}>();

const emits = defineEmits(["close", "deleted"]);

const isPopoverOpen = ref(false);
const popoverEvent = ref<Event>();

const openPopover = (e: Event) => {
    popoverEvent.value = e;
    isPopoverOpen.value = true;
};

const toggleLike = () => {
    if (!props.photo) return;
    photoStore.toggleLikeOnPhoto(props.photo.name);
};

const deletePhoto = async () => {
    if (!props.photo) return;

    const { value } = await Dialog.confirm({
        title: "Confirmer",
        message: "Êtes-vous sûr(e) de vouloir supprimer cette photo ?"
    });

    if (!value) return;

    isPopoverOpen.value = false;
    emits("close");

    setTimeout(() => {
        photoStore.deletePhoto(props.photo?.name ?? "");
        emits("deleted");
    }, 300);
};
</script>

