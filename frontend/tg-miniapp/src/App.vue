<script setup lang="ts">
import { ref } from 'vue';

const summary = ref<string>('');
const loading = ref(false);
const error = ref<string>('');

// Telegram WebApp
const tg = (window as any).Telegram?.WebApp;

// получаем chatId из Telegram
function getChatId(): string | null {
  const unsafe = tg?.initDataUnsafe;
  if (!unsafe) return null;

  // в личных чатах часто нет chat, поэтому fallback на user
  return (
    unsafe.chat?.id?.toString() ??
    unsafe.user?.id?.toString() ??
    null
  );
}

async function loadLatestSummary() {
  error.value = '';
  summary.value = '';
  loading.value = true;

  try {
    const chatId = getChatId();
    if (!chatId) {
      throw new Error('chatId not found');
    }

    const res = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/summaries/latest?chatId=${chatId}`,
    );

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    summary.value = data.summary || 'Пока нет суммаризации';
  } catch (e: any) {
    error.value = e?.message ?? 'Ошибка';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="app">
    <button @click="loadLatestSummary" :disabled="loading">
      {{ loading ? 'Загружаю…' : 'Получить последнюю суммаризацию' }}
    </button>

    <p v-if="error" class="error">
      {{ error }}
    </p>

    <pre v-if="summary" class="summary">
{{ summary }}
    </pre>
  </div>
</template>

<style scoped>
.app {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

button {
  padding: 12px;
  font-size: 16px;
}

.summary {
  white-space: pre-wrap;
  background: #f5f5f5;
  padding: 12px;
  border-radius: 6px;
}

.error {
  color: red;
}
</style>
