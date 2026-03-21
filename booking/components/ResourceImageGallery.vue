<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useResourceAdminStore, type ResourceImage } from '../stores/resourceAdmin';

const props = defineProps<{
  resourceId: string;
}>();

const store = useResourceAdminStore();
const images = ref<ResourceImage[]>([]);
const uploading = ref(false);

async function loadImages() {
  images.value = await store.fetchResourceImages(props.resourceId);
}

async function setPrimary(imageId: string) {
  await store.setResourceImagePrimary(props.resourceId, imageId);
  await loadImages();
}

async function removeImage(imageId: string) {
  await store.deleteResourceImage(props.resourceId, imageId);
  await loadImages();
}

async function handleUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  uploading.value = true;
  try {
    await store.uploadResourceImage(props.resourceId, file);
    await loadImages();
  } finally {
    uploading.value = false;
    target.value = '';
  }
}

onMounted(loadImages);
</script>

<template>
  <div class="image-gallery">
    <h3>{{ $t('booking.imageGallery.title') }}</h3>
    <div class="image-gallery__grid">
      <div
        v-for="image in images"
        :key="image.id"
        class="image-gallery__card"
        :class="{ primary: image.is_primary }"
      >
        <img :src="image.url" :alt="image.alt || ''" />
        <div class="image-gallery__actions">
          <button
            @click="setPrimary(image.id)"
            :class="{ active: image.is_primary }"
            :title="$t('booking.imageGallery.setPrimary')"
          >&#9733;</button>
          <button
            @click="removeImage(image.id)"
            class="delete"
            :title="$t('booking.imageGallery.remove')"
          >&times;</button>
        </div>
      </div>
      <label class="image-gallery__add-card">
        <span v-if="uploading">{{ $t('booking.imageGallery.uploading') }}</span>
        <span v-else>+</span>
        <input type="file" accept="image/*" @change="handleUpload" :disabled="uploading" />
      </label>
    </div>
  </div>
</template>

<style scoped>
.image-gallery {
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid #eee;
}

.image-gallery h3 {
  margin: 0 0 15px 0;
  color: #2c3e50;
}

.image-gallery__grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.image-gallery__card {
  position: relative;
  border: 2px solid var(--vbwd-border, #e2e8f0);
  border-radius: var(--vbwd-radius, 8px);
  overflow: hidden;
  aspect-ratio: 1;
  background: #f8f9fa;
  transition: border-color 0.2s;
}

.image-gallery__card:hover {
  border-color: var(--vbwd-primary, #3498db);
}

.image-gallery__card.primary {
  border-color: #f0ad4e;
  box-shadow: 0 0 0 1px #f0ad4e;
}

.image-gallery__card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.image-gallery__actions {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  padding: 6px;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.4), transparent);
  opacity: 0;
  transition: opacity 0.2s;
}

.image-gallery__card:hover .image-gallery__actions {
  opacity: 1;
}

.image-gallery__actions button {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  color: #666;
  transition: background-color 0.2s, color 0.2s;
}

.image-gallery__actions button:hover {
  background: #fff;
}

.image-gallery__actions button.active {
  color: #f0ad4e;
}

.image-gallery__actions button.delete:hover {
  background: #f8d7da;
  color: #721c24;
}

.image-gallery__add-card {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed var(--vbwd-border, #e2e8f0);
  border-radius: var(--vbwd-radius, 8px);
  aspect-ratio: 1;
  cursor: pointer;
  background: #f8f9fa;
  transition: border-color 0.2s, background-color 0.2s;
}

.image-gallery__add-card:hover {
  border-color: var(--vbwd-primary, #3498db);
  background: #eef6fd;
}

.image-gallery__add-card span {
  font-size: 2rem;
  color: #999;
  font-weight: 300;
}

.image-gallery__add-card input {
  display: none;
}

@media (max-width: 768px) {
  .image-gallery__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
