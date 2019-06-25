<template>
  <transition name="fade">
    <div class="helper card flip-horizontal-bottom">
      <slot name="header">
        <div
          v-if="title"
          class="card-header"
        >
          <p class="card-header-title">
            {{ title }}
          </p>
          <a class="card-header-icon">
            <b-icon
              v-if="closeable"
              icon="close"
              size="is-small"
              @click.native="$emit('close')"
            ></b-icon>
          </a>
        </div>
      </slot>
      <div class="card-content">
        <div class="content information">
          <slot></slot>
        </div>
      </div>
      <footer class="card-footer">
        <slot name="footer">
        </slot>
      </footer>
    </div>
  </transition>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
  props: {
    title: String,
    noCollapse: Boolean,
    closeable: Boolean,
  },
});
</script>

<style lang="scss" scoped>
$width: 450px;
$icon-size: 30px;
$duration: 0.2s;
$header-height: 48px;

.flip-horizontal-bottom {
  transform-origin: top;
  animation: card-show $duration cubic-bezier(0.175, 0.885, 0.32, 1.27499);
}

.fade-enter-active, .fade-leave-active {
  transition: opacity $duration;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}

.card {
  display: flex;
  flex-direction: column;
}

.information {
  text-align: left;
}

.card-content {
  overflow-y: auto;
  padding: 0; // override the default
}

.content {
  margin: 1.5rem;
}

@keyframes card-show {
  0% { 
    opacity: 0; 
    transform: perspective($width) translate(0, -$icon-size) rotateX(90deg); 
  }
  100% { 
    opacity: 1; 
    transform: perspective($width) translate(0, 0) rotateX(0deg); 
  }
}

.helper ::v-deep .collapse-content {
  height: calc(100% - 48px);  
}
</style>
