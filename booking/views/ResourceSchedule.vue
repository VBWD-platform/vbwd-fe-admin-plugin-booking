<template>
  <div class="plans-view">
    <!-- Header -->
    <div class="plans-header">
      <h2>{{ $t('booking.schedule.title') }}: {{ resource?.name || '...' }}</h2>
      <div class="header-actions">
        <button
          class="action-btn archive"
          @click="showCopyModal = true"
        >
          {{ $t('booking.schedule.copySchedule') }}
        </button>
      </div>
    </div>

    <!-- Date navigation + view tabs -->
    <div class="schedule-nav">
      <div class="date-nav">
        <button
          class="nav-arrow"
          @click="navigateDate(-1)"
        >
          &larr;
        </button>
        <span class="current-date">{{ formattedDateRange }}</span>
        <button
          class="nav-arrow"
          @click="navigateDate(1)"
        >
          &rarr;
        </button>
      </div>
      <div class="view-tabs">
        <button
          class="tab-btn"
          :class="{ active: viewMode === 'day' }"
          @click="viewMode = 'day'"
        >
          {{ $t('booking.schedule.daily') }}
        </button>
        <button
          class="tab-btn"
          :class="{ active: viewMode === 'week' }"
          @click="viewMode = 'week'"
        >
          {{ $t('booking.schedule.weekly') }}
        </button>
        <button
          class="tab-btn"
          :class="{ active: viewMode === 'month' }"
          @click="viewMode = 'month'"
        >
          {{ $t('booking.schedule.monthly') }}
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div
      v-if="scheduleLoading"
      class="loading-state"
    >
      <div class="spinner" /><p>{{ $t('booking.common.loading') }}</p>
    </div>

    <!-- Day View -->
    <div
      v-else-if="viewMode === 'day'"
      class="day-view"
    >
      <div
        v-if="currentDayData"
        class="day-content"
      >
        <div
          v-if="currentDayData.closed"
          class="closed-banner"
        >
          {{ $t('booking.schedule.closed') }}
        </div>
        <div
          v-else-if="currentDayData.slots.length === 0"
          class="empty-state"
        >
          <p>{{ $t('booking.schedule.available') }}: 0 {{ $t('booking.schedule.slotsCount') }}</p>
        </div>
        <div
          v-else
          class="slot-list"
        >
          <div
            v-for="(slot, slotIndex) in currentDayData.slots"
            :key="slotIndex"
            class="slot-card"
            :class="[slot.status, slot.booking_status || '', { clickable: editMode && slot.status !== 'booked', 'clickable-booking': slot.status === 'booked' && slot.booking_id }]"
            @click="slot.status === 'booked' && slot.booking_id ? router.push(`/admin/booking/${slot.booking_id}`) : handleSlotClick(slot)"
          >
            <span class="slot-time">{{ slot.start }} - {{ slot.end }}</span>
            <span
              class="status-badge"
              :class="slot.booking_status || slot.status"
            >{{ slot.booking_status || $t('booking.schedule.' + slot.status) }}</span>
            <span
              v-if="slot.customer_name"
              class="slot-customer"
            >{{ slot.customer_name }}</span>
            <span
              v-if="slot.reason"
              class="slot-reason"
            >{{ slot.reason }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Week View -->
    <div
      v-else-if="viewMode === 'week'"
      class="week-view"
    >
      <div class="plans-table-wrap">
        <table class="plans-table week-table">
          <thead>
            <tr>
              <th
                v-for="day in scheduleDays"
                :key="day.date"
                :class="{ 'today-col': isToday(day.date) }"
              >
                {{ formatWeekDay(day.date) }}<br><small>{{ formatShortDate(day.date) }}</small>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="timeRow in weekTimeRows"
              :key="timeRow"
            >
              <td
                v-for="day in scheduleDays"
                :key="day.date + timeRow"
                class="week-cell"
                :class="getCellStatus(day, timeRow)"
              >
                <small>{{ timeRow }}</small>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Month View -->
    <div
      v-else-if="viewMode === 'month'"
      class="month-view"
    >
      <div class="month-grid">
        <div class="month-header-row">
          <span
            v-for="dayName in weekDayNames"
            :key="dayName"
            class="month-header-cell"
          >{{ dayName }}</span>
        </div>
        <div class="month-body">
          <div
            v-for="(cell, cellIndex) in monthCalendarCells"
            :key="cellIndex"
            class="month-cell"
            :class="{ 'other-month': !cell.inMonth, 'today-cell': cell.isToday, clickable: cell.inMonth }"
            @click="cell.inMonth && goToDay(cell.date)"
          >
            <span class="month-day-num">{{ cell.dayNum }}</span>
            <span
              v-if="cell.inMonth && cell.slotInfo"
              class="month-slot-info"
            >{{ cell.slotInfo }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Weekly Template -->
    <div class="section-divider" />
    <div class="template-section">
      <h3>{{ $t('booking.schedule.weeklyTemplate') }}</h3>
      <div
        v-for="(dayKey, dayIndex) in weekDayKeys"
        :key="dayKey"
        class="template-day"
      >
        <span class="template-day-label">{{ $t('booking.schedule.days.' + dayKey) }}</span>
        <div class="template-blocks">
          <template v-if="templateSchedule[dayIndex] && templateSchedule[dayIndex].length > 0">
            <div
              v-for="(block, blockIndex) in templateSchedule[dayIndex]"
              :key="blockIndex"
              class="template-block"
            >
              <input
                v-model="block.start"
                type="time"
                class="time-input"
              >
              <span class="template-to">{{ $t('booking.schedule.to') }}</span>
              <input
                v-model="block.end"
                type="time"
                class="time-input"
              >
              <button
                class="action-btn delete"
                @click="removeTemplateBlock(dayIndex, blockIndex)"
              >
                &times;
              </button>
            </div>
          </template>
          <span
            v-else
            class="closed-label"
          >-- {{ $t('booking.schedule.closed') }} --</span>
        </div>
        <button
          class="action-btn archive add-block-btn"
          @click="addTemplateBlock(dayIndex)"
        >
          {{ $t('booking.schedule.addBlock') }}
        </button>
      </div>
    </div>

    <!-- Settings -->
    <div class="template-section">
      <h3>{{ $t('booking.schedule.settings') }}</h3>
      <div class="settings-row">
        <label class="setting-field">
          <span>{{ $t('booking.schedule.bufferMinutes') }}</span>
          <input
            v-model.number="settingsBuffer"
            type="number"
            min="0"
            class="search-input setting-input"
          >
        </label>
        <label class="setting-field">
          <span>{{ $t('booking.schedule.leadTimeHours') }}</span>
          <input
            v-model.number="settingsLeadTime"
            type="number"
            min="0"
            class="search-input setting-input"
          >
        </label>
        <label class="setting-field">
          <span>{{ $t('booking.schedule.maxAdvanceDays') }}</span>
          <input
            v-model.number="settingsMaxAdvance"
            type="number"
            min="1"
            class="search-input setting-input"
          >
        </label>
      </div>
      <button
        class="create-btn"
        :disabled="saving"
        @click="saveSettings"
      >
        {{ saving ? '...' : $t('booking.schedule.saveSettings') }}
      </button>
      <p
        v-if="savedMessage"
        class="import-toast"
      >
        {{ savedMessage }}
      </p>
    </div>

    <!-- Copy Modal -->
    <div
      v-if="showCopyModal"
      class="modal-overlay"
      @click.self="showCopyModal = false"
    >
      <div class="modal-box">
        <h3>{{ $t('booking.schedule.copyTitle') }}</h3>
        <p>{{ $t('booking.schedule.copyDesc') }}</p>
        <div class="copy-resource-list">
          <label
            v-for="otherResource in otherResources"
            :key="otherResource.id"
            class="copy-resource-item"
          >
            <input
              v-model="copyTargetIds"
              type="checkbox"
              :value="otherResource.id"
            >
            <span>{{ otherResource.name }}</span>
          </label>
        </div>
        <div class="modal-actions">
          <button
            class="create-btn"
            :disabled="copyTargetIds.length === 0 || copying"
            @click="doCopy"
          >
            {{ copying ? '...' : $t('booking.schedule.copyButton') }}
          </button>
          <button
            class="action-btn archive"
            @click="showCopyModal = false"
          >
            {{ $t('booking.resourceForm.cancel') }}
          </button>
        </div>
        <p
          v-if="copyMessage"
          class="import-toast"
        >
          {{ copyMessage }}
        </p>
      </div>
    </div>

    <!-- Block Slot Modal -->
    <div
      v-if="showBlockModal"
      class="modal-overlay"
      @click.self="showBlockModal = false"
    >
      <div class="modal-box">
        <h3>{{ $t('booking.schedule.blockSlot') }}</h3>
        <div class="block-form">
          <input
            v-model="blockReason"
            type="text"
            :placeholder="$t('booking.schedule.reason')"
            class="search-input"
          >
        </div>
        <div class="modal-actions">
          <button
            class="create-btn"
            @click="confirmBlock"
          >
            {{ $t('booking.schedule.blockSlot') }}
          </button>
          <button
            class="action-btn archive"
            @click="showBlockModal = false"
          >
            {{ $t('booking.resourceForm.cancel') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useResourceAdminStore, type ScheduleDay, type ScheduleSlot, type BookableResource } from '../stores/resourceAdmin';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const store = useResourceAdminStore();

const resourceId = computed(() => route.params.id as string);
const resource = ref<BookableResource | null>(null);
const scheduleDays = ref<ScheduleDay[]>([]);
const scheduleLoading = ref(false);
const editMode = ref(false);
const viewMode = ref<'day' | 'week' | 'month'>('day');
const currentDate = ref(new Date());
const saving = ref(false);
const savedMessage = ref('');

// Copy modal
const showCopyModal = ref(false);
const copyTargetIds = ref<string[]>([]);
const copying = ref(false);
const copyMessage = ref('');

// Block modal
const showBlockModal = ref(false);
const blockReason = ref('');
const pendingBlockSlot = ref<ScheduleSlot | null>(null);

// Template schedule: 7 days, each an array of { start, end }
const weekDayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const templateSchedule = ref<Array<Array<{ start: string; end: string }>>>([[], [], [], [], [], [], []]);

// Settings
const settingsBuffer = ref(0);
const settingsLeadTime = ref(0);
const settingsMaxAdvance = ref(90);

// Other resources for copy
const otherResources = computed(() => store.resources.filter(resource => resource.id !== resourceId.value));

const weekDayNames = computed(() => weekDayKeys.map(key => t('booking.schedule.days.' + key).substring(0, 3)));

// Format helpers
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function isToday(dateStr: string): boolean {
  return dateStr === formatDate(new Date());
}

function formatWeekDay(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const dayIndex = (date.getDay() + 6) % 7;
  return t('booking.schedule.days.' + weekDayKeys[dayIndex]).substring(0, 3);
}

function formatShortDate(dateStr: string): string {
  const parts = dateStr.split('-');
  return `${parts[2]}/${parts[1]}`;
}

const formattedDateRange = computed(() => {
  if (viewMode.value === 'day') {
    return formatDate(currentDate.value);
  } else if (viewMode.value === 'week') {
    const start = getWeekStart(currentDate.value);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return `${formatDate(start)} - ${formatDate(end)}`;
  } else {
    const year = currentDate.value.getFullYear();
    const month = String(currentDate.value.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }
});

function getWeekStart(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  result.setDate(result.getDate() + diff);
  return result;
}

function navigateDate(direction: number) {
  const newDate = new Date(currentDate.value);
  if (viewMode.value === 'day') {
    newDate.setDate(newDate.getDate() + direction);
  } else if (viewMode.value === 'week') {
    newDate.setDate(newDate.getDate() + direction * 7);
  } else {
    newDate.setMonth(newDate.getMonth() + direction);
  }
  currentDate.value = newDate;
}

function goToDay(dateStr: string) {
  currentDate.value = new Date(dateStr + 'T00:00:00');
  viewMode.value = 'day';
}

// Day view
const currentDayData = computed(() => {
  const dateStr = formatDate(currentDate.value);
  return scheduleDays.value.find(day => day.date === dateStr) || null;
});

// Week view
const weekTimeRows = computed(() => {
  const rows: string[] = [];
  for (let hour = 6; hour <= 22; hour++) {
    rows.push(`${String(hour).padStart(2, '0')}:00`);
  }
  return rows;
});

function getCellStatus(day: ScheduleDay, timeRow: string): string {
  if (day.closed) return 'cell-closed';
  const hour = parseInt(timeRow.split(':')[0]);
  const matchingSlot = day.slots.find(slot => {
    const slotStartHour = parseInt(slot.start.split(':')[0]);
    const slotEndHour = parseInt(slot.end.split(':')[0]);
    return hour >= slotStartHour && hour < slotEndHour;
  });
  if (!matchingSlot) return 'cell-empty';
  return 'cell-' + matchingSlot.status;
}

// Month view
const monthCalendarCells = computed(() => {
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const todayStr = formatDate(new Date());

  const cells: Array<{ date: string; dayNum: number; inMonth: boolean; isToday: boolean; slotInfo: string | null }> = [];

  // Previous month padding
  for (let index = startOffset - 1; index >= 0; index--) {
    const date = new Date(year, month, -index);
    cells.push({ date: formatDate(date), dayNum: date.getDate(), inMonth: false, isToday: false, slotInfo: null });
  }

  // Current month
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const dateStr = formatDate(new Date(year, month, day));
    const scheduleDay = scheduleDays.value.find(scheduleDayEntry => scheduleDayEntry.date === dateStr);
    let slotInfo: string | null = null;
    if (scheduleDay) {
      if (scheduleDay.closed) {
        slotInfo = t('booking.schedule.closed');
      } else {
        const availableCount = scheduleDay.slots.filter(slot => slot.status === 'available').length;
        slotInfo = `${availableCount}/${scheduleDay.slots.length}`;
      }
    }
    cells.push({ date: dateStr, dayNum: day, inMonth: true, isToday: dateStr === todayStr, slotInfo });
  }

  // Next month padding
  const remaining = 7 - (cells.length % 7);
  if (remaining < 7) {
    for (let index = 1; index <= remaining; index++) {
      const date = new Date(year, month + 1, index);
      cells.push({ date: formatDate(date), dayNum: date.getDate(), inMonth: false, isToday: false, slotInfo: null });
    }
  }

  return cells;
});

// Slot interactions
function handleSlotClick(slot: ScheduleSlot) {
  if (!editMode.value || slot.status === 'booked') return;
  if (slot.status === 'available') {
    pendingBlockSlot.value = slot;
    blockReason.value = '';
    showBlockModal.value = true;
  } else if (slot.status === 'blocked' && slot.block_id) {
    doUnblock(slot.block_id);
  }
}

async function confirmBlock() {
  if (!pendingBlockSlot.value) return;
  await store.blockSlot(resourceId.value, {
    date: formatDate(currentDate.value),
    start: pendingBlockSlot.value.start,
    end: pendingBlockSlot.value.end,
    reason: blockReason.value || undefined,
  });
  showBlockModal.value = false;
  pendingBlockSlot.value = null;
  await loadSchedule();
}

async function doUnblock(blockId: string) {
  await store.unblockSlot(resourceId.value, blockId);
  await loadSchedule();
}

// Template
function addTemplateBlock(dayIndex: number) {
  templateSchedule.value[dayIndex].push({ start: '09:00', end: '17:00' });
}

function removeTemplateBlock(dayIndex: number, blockIndex: number) {
  templateSchedule.value[dayIndex].splice(blockIndex, 1);
}

function loadTemplateFromResource() {
  if (!resource.value?.availability) return;
  const availability = resource.value.availability as Record<string, unknown>;
  const schedule = availability.schedule as Record<string, Array<{ start: string; end: string }>> | undefined;
  if (!schedule) return;
  weekDayKeys.forEach((key, index) => {
    const dayBlocks = schedule[key];
    templateSchedule.value[index] = dayBlocks ? dayBlocks.map(block => ({ ...block })) : [];
  });
}

function loadSettingsFromResource() {
  if (!resource.value) return;
  const availability = (resource.value.availability || {}) as Record<string, unknown>;
  const config = (resource.value.config || {}) as Record<string, unknown>;
  settingsBuffer.value = (config.buffer_minutes as number) || 0;
  settingsLeadTime.value = (availability.lead_time_hours as number) || 0;
  settingsMaxAdvance.value = (availability.max_advance_days as number) || 90;
}

async function saveSettings() {
  saving.value = true;
  savedMessage.value = '';
  try {
    const scheduleData: Record<string, Array<{ start: string; end: string }>> = {};
    weekDayKeys.forEach((key, index) => {
      scheduleData[key] = templateSchedule.value[index];
    });

    const existingAvailability = (resource.value?.availability || {}) as Record<string, unknown>;
    const existingConfig = (resource.value?.config || {}) as Record<string, unknown>;

    await store.updateResource(resourceId.value, {
      availability: {
        ...existingAvailability,
        schedule: scheduleData,
        lead_time_hours: settingsLeadTime.value,
        max_advance_days: settingsMaxAdvance.value,
      },
      config: {
        ...existingConfig,
        buffer_minutes: settingsBuffer.value,
      },
    });
    savedMessage.value = t('booking.schedule.saved');
    resource.value = store.currentResource;
    setTimeout(() => { savedMessage.value = ''; }, 3000);
  } finally {
    saving.value = false;
  }
}

// Copy
async function doCopy() {
  copying.value = true;
  copyMessage.value = '';
  try {
    await store.copySchedule(resourceId.value, copyTargetIds.value);
    copyMessage.value = t('booking.schedule.copied');
    setTimeout(() => { showCopyModal.value = false; copyMessage.value = ''; copyTargetIds.value = []; }, 2000);
  } finally {
    copying.value = false;
  }
}

// Load schedule data
async function loadSchedule() {
  scheduleLoading.value = true;
  try {
    let dateFrom: string;
    let dateTo: string;
    if (viewMode.value === 'day') {
      dateFrom = formatDate(currentDate.value);
      dateTo = dateFrom;
    } else if (viewMode.value === 'week') {
      const weekStart = getWeekStart(currentDate.value);
      dateFrom = formatDate(weekStart);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      dateTo = formatDate(weekEnd);
    } else {
      const year = currentDate.value.getFullYear();
      const month = currentDate.value.getMonth();
      dateFrom = formatDate(new Date(year, month, 1));
      dateTo = formatDate(new Date(year, month + 1, 0));
    }
    scheduleDays.value = await store.fetchSchedule(resourceId.value, dateFrom, dateTo);
  } finally {
    scheduleLoading.value = false;
  }
}

watch([currentDate, viewMode], () => { loadSchedule(); });

onMounted(async () => {
  await store.fetchResourceDetail(resourceId.value);
  resource.value = store.currentResource;
  loadTemplateFromResource();
  loadSettingsFromResource();
  await store.fetchResources();
  await loadSchedule();
});
</script>

<style scoped>
.plans-view { background: white; padding: 20px; border-radius: 8px; }
.plans-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px; }
.plans-header h2 { margin: 0; color: #2c3e50; }
.header-actions { display: flex; gap: 8px; }

.schedule-nav { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px; }
.date-nav { display: flex; align-items: center; gap: 12px; }
.nav-arrow { background: none; border: 1px solid #ddd; border-radius: 4px; padding: 6px 12px; cursor: pointer; font-size: 16px; }
.nav-arrow:hover { background: #f0f0f0; }
.current-date { font-weight: 600; font-size: 15px; color: #2c3e50; min-width: 200px; text-align: center; }
.view-tabs { display: flex; gap: 0; border-bottom: 2px solid #e9ecef; }
.tab-btn { padding: 8px 16px; background: none; border: none; border-bottom: 2px solid transparent; margin-bottom: -2px; cursor: pointer; font-size: 13px; font-weight: 500; color: #666; }
.tab-btn:hover { color: #2c3e50; }
.tab-btn.active { color: #3498db; border-bottom-color: #3498db; }

/* Loading */
.loading-state { text-align: center; padding: 40px; color: #666; }
.spinner { width: 40px; height: 40px; border: 3px solid #f3f3f3; border-top: 3px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 15px; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
.empty-state { text-align: center; padding: 40px; color: #666; }

/* Day view */
.day-view { min-height: 200px; }
.closed-banner { text-align: center; padding: 30px; background: #f8f9fa; border-radius: 8px; color: #666; font-size: 16px; font-weight: 500; }
.slot-list { display: flex; flex-direction: column; gap: 8px; }
.slot-card { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border: 1px solid #e9ecef; border-radius: 6px; transition: background 0.2s; }
.slot-card.clickable { cursor: pointer; }
.slot-card.clickable:hover { background: #f8f9fa; }
.slot-card.available { border-left: 4px solid #27ae60; }
.slot-card.booked { border-left: 4px solid #95a5a6; }
.slot-card.blocked { border-left: 4px solid #e74c3c; }
.slot-time { font-weight: 600; font-size: 14px; color: #2c3e50; min-width: 120px; }
.slot-customer { font-size: 12px; color: #2c3e50; font-weight: 500; }
.slot-reason { font-size: 12px; color: #888; margin-left: auto; }
.clickable-booking { cursor: pointer; }
.clickable-booking:hover { background: #eaf4ff; }
.slot-card.confirmed { border-left: 4px solid #27ae60; }
.slot-card.pending { border-left: 4px solid #f39c12; }
.slot-card.cancelled { border-left: 4px solid #e74c3c; opacity: 0.6; }
.slot-card.completed { border-left: 4px solid #3498db; }
.slot-card.no_show { border-left: 4px solid #95a5a6; }

/* Status badges */
.status-badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 500; }
.status-badge.available { background: #d4edda; color: #155724; }
.status-badge.booked { background: #e2e3e5; color: #383d41; }
.status-badge.blocked { background: #f8d7da; color: #721c24; }
.status-badge.confirmed { background: #d4edda; color: #155724; }
.status-badge.pending { background: #fff3cd; color: #856404; }
.status-badge.cancelled { background: #f8d7da; color: #721c24; }
.status-badge.completed { background: #cce5ff; color: #004085; }
.status-badge.no_show { background: #e9ecef; color: #495057; }

/* Week view */
.week-view { overflow-x: auto; }
.week-table th { text-align: center; font-size: 12px; padding: 8px 4px; }
.week-table th.today-col { background: #eaf4ff; }
.week-cell { text-align: center; padding: 4px; font-size: 11px; min-width: 60px; height: 28px; }
.cell-available { background: #d4edda; }
.cell-booked { background: #e2e3e5; }
.cell-blocked { background: #f8d7da; }
.cell-closed { background: #f8f9fa; }
.cell-empty { background: #fff; }
.plans-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
.plans-table { width: 100%; border-collapse: collapse; }
.plans-table th, .plans-table td { padding: 8px; text-align: left; border-bottom: 1px solid #eee; }
.plans-table th { background: #f8f9fa; font-weight: 600; color: #2c3e50; }

/* Month view */
.month-grid { border: 1px solid #e9ecef; border-radius: 8px; overflow: hidden; }
.month-header-row { display: grid; grid-template-columns: repeat(7, 1fr); background: #f8f9fa; }
.month-header-cell { text-align: center; padding: 8px 4px; font-weight: 600; font-size: 12px; color: #2c3e50; }
.month-body { display: grid; grid-template-columns: repeat(7, 1fr); }
.month-cell { padding: 8px; min-height: 70px; border: 1px solid #f0f0f0; display: flex; flex-direction: column; gap: 4px; }
.month-cell.clickable { cursor: pointer; }
.month-cell.clickable:hover { background: #f8f9fa; }
.month-cell.other-month { background: #fafafa; color: #ccc; }
.month-cell.today-cell { background: #eaf4ff; }
.month-day-num { font-weight: 600; font-size: 13px; }
.month-slot-info { font-size: 11px; color: #666; }

/* Section divider */
.section-divider { border-top: 2px solid #e9ecef; margin: 30px 0; }

/* Template section */
.template-section { margin-bottom: 30px; }
.template-section h3 { margin: 0 0 15px; color: #2c3e50; }
.template-day { display: flex; align-items: flex-start; gap: 12px; padding: 8px 0; border-bottom: 1px solid #f0f0f0; flex-wrap: wrap; }
.template-day-label { min-width: 90px; font-weight: 500; font-size: 14px; color: #2c3e50; padding-top: 6px; }
.template-blocks { display: flex; flex-direction: column; gap: 6px; flex: 1; }
.template-block { display: flex; align-items: center; gap: 8px; }
.time-input { padding: 6px 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px; width: 110px; }
.time-input:focus { outline: none; border-color: #3498db; }
.template-to { font-size: 13px; color: #666; }
.closed-label { font-size: 13px; color: #999; padding: 6px 0; }
.add-block-btn { white-space: nowrap; align-self: flex-start; margin-top: 2px; }

/* Settings */
.settings-row { display: flex; gap: 20px; margin-bottom: 15px; flex-wrap: wrap; }
.setting-field { display: flex; flex-direction: column; gap: 4px; }
.setting-field span { font-size: 13px; font-weight: 500; color: #555; }
.setting-input { width: 120px; }
.search-input { padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; }
.search-input:focus { outline: none; border-color: #3498db; }
.create-btn { padding: 10px 20px; background: #27ae60; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; font-weight: 500; }
.create-btn:hover { background: #1e8449; }
.create-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.import-toast { padding: 10px 16px; border-radius: 6px; font-size: 13px; margin-top: 10px; background: #d1fae5; color: #065f46; }

/* Action buttons */
.action-btn { padding: 6px 12px; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; }
.action-btn.archive { background: #ffc107; color: #212529; }
.action-btn.archive:hover { background: #e0a800; }
.action-btn.delete { background: #f8d7da; color: #721c24; }
.action-btn.delete:hover { background: #f5c6cb; }
.edit-mode-btn { background: #3498db; color: white; }
.edit-mode-btn:hover { background: #2980b9; }

/* Modal */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-box { background: white; border-radius: 8px; padding: 24px; max-width: 480px; width: 90%; max-height: 80vh; overflow-y: auto; }
.modal-box h3 { margin: 0 0 12px; color: #2c3e50; }
.modal-box p { color: #666; font-size: 14px; margin-bottom: 16px; }
.modal-actions { display: flex; gap: 10px; margin-top: 16px; }
.copy-resource-list { max-height: 250px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; }
.copy-resource-item { display: flex; align-items: center; gap: 8px; padding: 6px; border-radius: 4px; cursor: pointer; }
.copy-resource-item:hover { background: #f8f9fa; }
.copy-resource-item input { cursor: pointer; }
.block-form { margin-bottom: 8px; }
.block-form .search-input { width: 100%; }

/* ── Tablet ───────────────────────────────────────────────── */
@media (max-width: 1024px) {
  .schedule-nav { flex-direction: column; align-items: stretch; }
  .date-nav { justify-content: center; }
  .view-tabs { justify-content: center; }
}

/* ── Mobile ───────────────────────────────────────────────── */
@media (max-width: 768px) {
  .plans-view { padding: 12px; border-radius: 0; }
  .plans-header { flex-direction: column; align-items: flex-start; }
  .plans-header h2 { font-size: 1.1rem; }
  .header-actions { width: 100%; }
  .header-actions .action-btn { flex: 1; text-align: center; }
  .schedule-nav { flex-direction: column; }
  .current-date { min-width: auto; font-size: 13px; }
  .template-day { flex-direction: column; }
  .template-day-label { min-width: auto; }
  .settings-row { flex-direction: column; }
  .setting-input { width: 100%; }
  .month-cell { min-height: 50px; padding: 4px; }
  .month-day-num { font-size: 11px; }
  .month-slot-info { font-size: 9px; }
  .time-input { width: 90px; font-size: 12px; }
}

/* ── Small phones ─────────────────────────────────────────── */
@media (max-width: 480px) {
  .plans-view { padding: 8px; }
  .plans-header h2 { font-size: 1rem; }
  .slot-card { flex-wrap: wrap; padding: 8px 10px; }
  .slot-time { min-width: auto; font-size: 13px; }
  .month-cell { min-height: 40px; }
}
</style>
