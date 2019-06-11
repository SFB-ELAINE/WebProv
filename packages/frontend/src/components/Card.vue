<template>
  <transition name="fade">
    <b-collapse class="card flip-horizontal-bottom">
      <div
        slot="trigger" 
        slot-scope="props"
        class="card-header"
        role="button"
      >
        <p class="card-header-title">
          {{ title }}
        </p>
        <a class="card-header-icon">
          <b-icon :icon="props.open ? 'menu-down' : 'menu-up'"></b-icon>
        </a>
      </div>
      <div class="card-content">
        <div class="content information">
          <slot></slot>
        </div>
      </div>
      <footer class="card-footer">
        <slot name="footer">
        </slot>
      </footer>
    </b-collapse>
  </transition>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
  props: {
    title: String,
  },
});
</script>

<style lang="scss" scoped>
$width: 450px;
$icon-size: 30px;
$duration: 0.2s;

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

.information {
  text-align: left;
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
</style>
