<template>
  <div class="section">
    <div class="sectionTitleRow">
      <div class="sectionTitle">📁 Мои группы</div>

      <button
        v-if="addGroupUrl"
        class="btnAdd"
        type="button"
        @click="onAddGroup"
      >
        ➕ Добавить группу
      </button>
    </div>

    <div v-if="loading" class="muted">Загружаю…</div>

    <div v-else class="chatList">
      <button
        v-for="c in chats"
        :key="c.chatId"
        class="btn"
        type="button"
        @click="$emit('select', c.chatId)"
      >
        <div class="chatTitle">{{ c.title || 'Без названия' }}</div>
        <div class="chatMeta">{{ c.type || 'chat' }} · {{ c.chatId }}</div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChatItem } from '../types'

defineProps<{
  chats: ChatItem[]
  loading: boolean
}>()

defineEmits<{
  (e: 'select', chatId: string): void
}>()

const botUsernameRaw =
  (import.meta as any)?.env?.VITE_BOT_USERNAME ||
  (import.meta as any)?.env?.VITE_TELEGRAM_BOT_USERNAME ||
  ''

const botUsername = String(botUsernameRaw).replace(/^@/, '').trim()
const addGroupUrl = botUsername ? `https://t.me/${botUsername}?startgroup=true` : ''

function onAddGroup() {
  if (!addGroupUrl) return

  const tg = (window as any)?.Telegram?.WebApp

  // ✅ самый правильный вариант именно для Mini App
  if (tg?.openTelegramLink) {
    tg.openTelegramLink(addGroupUrl)
    return
  }

  // ✅ fallback: некоторые клиенты дают только openLink
  if (tg?.openLink) {
    tg.openLink(addGroupUrl)
    return
  }

  // ✅ самый простой fallback
  window.location.href = addGroupUrl
}
</script>

<style scoped>
.section {
  margin-top: 14px;
}
.sectionTitleRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}
.sectionTitle {
  font-weight: 800;
  font-size: 14px;
  text-align: left;
}

.btnAdd {
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 8px 10px;
  cursor: pointer;
  font-size: 13px;
  white-space: nowrap;
}
.btnAdd:hover {
  border-color: rgba(120, 170, 255, 0.6);
  background: rgba(255, 255, 255, 0.09);
}

.chatList {
  display: grid;
  gap: 10px;
}
.btn {
  width: 100%;
  text-align: left;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  padding: 12px 12px;
  cursor: pointer;
  transition: transform 0.08s ease, border-color 0.2s ease, background 0.2s ease;
}
.btn:hover {
  border-color: rgba(120, 170, 255, 0.6);
  background: rgba(255, 255, 255, 0.09);
}
.btn:active {
  transform: translateY(1px);
}
.chatTitle {
  font-weight: 750;
  font-size: 14px;
  margin-bottom: 4px;
}
.chatMeta {
  font-size: 12px;
  opacity: 0.8;
}
.muted {
  opacity: 0.75;
}
</style>
