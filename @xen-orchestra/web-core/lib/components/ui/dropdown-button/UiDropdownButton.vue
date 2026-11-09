<!-- v9 -->
<template>
  <button :class="className" :disabled="isDisabled" class="ui-dropdown-button" type="button">
    <VtsIcon :name="icon" size="current" />
    <span class="label">
      <slot />
    </span>
    <VtsIcon name="fa:angle-down" size="current" />
  </button>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import { useDisabled } from '@core/composables/disabled.composable.ts'
import type { IconName } from '@core/icons'
import { toVariants } from '@core/utils/to-variants.util.ts'
import { computed } from 'vue'

export type DropdownButtonVariant = 'primary' | 'secondary'
export type DropdownButtonSize = 'small' | 'medium'

const { variant, size, disabled, selected, icon } = defineProps<{
  variant: DropdownButtonVariant
  size: DropdownButtonSize
  disabled?: boolean
  selected?: boolean
  icon?: IconName
}>()

defineSlots<{
  default(): any
}>()

const isDisabled = useDisabled(() => disabled)

const fontClasses = {
  small: 'typo-action-button-small',
  medium: 'typo-action-button',
}

const className = computed(() => [fontClasses[size], toVariants({ variant, size, selected })])
</script>

<style lang="postcss" scoped>
.ui-dropdown-button {
  display: inline-flex;
  align-items: center;
  gap: 0.8rem;
  position: relative;
  cursor: pointer;
  border: 0.1rem solid transparent;
  color: var(--color-brand-txt-base);

  &:focus-visible {
    outline: none;

    &::before {
      content: '';
      position: absolute;
      border: 0.2rem solid var(--color-brand-txt-base);
      border-radius: 0.4rem;
    }
  }

  &:disabled {
    cursor: not-allowed;
  }

  /* SIZE */

  &.size--small {
    padding: 0.8rem 1.2rem;
  }

  &.size--medium {
    padding: 1.2rem 1.6rem;
  }

  /* VARIANT */

  &.variant--primary {
    border-color: var(--color-brand-item-base);
    border-radius: 9rem;
    background-color: var(--color-neutral-background-primary);

    &:hover {
      border-color: var(--color-brand-item-hover);
      color: var(--color-brand-txt-hover);
    }

    &:active {
      border-color: var(--color-brand-item-active);
      color: var(--color-brand-txt-active);
    }

    &.selected {
      border-color: var(--color-brand-item-base);
      box-shadow: inset 0 0 0 0.1rem var(--color-brand-item-base);
      color: var(--color-brand-txt-base);
    }

    &:focus-visible::before {
      inset: -0.6rem;
    }

    &:disabled {
      border-color: var(--color-neutral-txt-secondary);
      box-shadow: none;
      background-color: var(--color-neutral-background-disabled);
      color: var(--color-neutral-txt-secondary);
    }
  }

  &.variant--secondary {
    border-radius: 0.4rem;
    background-color: transparent;

    &:hover {
      background-color: var(--color-brand-background-hover);
      color: var(--color-brand-txt-hover);
    }

    &:active {
      background-color: var(--color-brand-background-active);
      color: var(--color-brand-txt-active);
    }

    &.selected {
      background-color: var(--color-brand-background-selected);
      color: var(--color-brand-txt-base);
    }

    &:focus-visible::before {
      inset: -0.5rem;
    }

    &:disabled {
      background-color: transparent;
      color: var(--color-neutral-txt-secondary);
    }
  }
}
</style>
