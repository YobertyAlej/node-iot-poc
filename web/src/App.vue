<template>
  <div id="app">
  </div>
</template>

<style lang="stylus">
html
body
  margin 0
  height 100%
  width 100%

#app
  background red
  height 100%
  

#nav
  padding 30px
  a
    font-weight bold
    color #2c3e50
    &.router-link-exact-active
      color #42b983
</style>
<script>
import Hello from '@/components/HelloWorld.vue'
export default {
  components: {
    Hello
  }
}
</script>
