<template>
  <div class="custom-card-content none-border py-0">
    <p v-html="getHtmlDesc(defaultData[compKey].desc)"></p>
    <div class="px-0 pb-0">
      <html-textarea v-model="afiRowData[compKey]"></html-textarea>
    </div>
  </div>
</template>

<script>
import Vue from "vue";
Vue.component("html-textarea", {
  template: '<pre contenteditable="true" @input="updateHTML"></pre>',
  props: ["value"],
  mounted: function() {
    this.$el.innerHTML = this.value;
  },
  methods: {
    updateHTML: function(e) {
      let d = e.target.innerHTML;
      this.$emit("input", d);
    }
  }
});
export default {
  name: "data-set-html",
  props: ["pageKey", "rd", "compKey", "defaultData", "afiRowData"],
  data() {
    return {
      htmlData: null
    };
  },
  created() {
    this.htmlData = this.afiRowData[this.compKey];
  },
  watch: {},
  methods: {}
};
</script>

<style scoped>
*[contenteditable] {
  border: 1px solid lightgray;
  width: 100%;
  display: inline-block;
  min-height: 80px;
  white-space: break-spaces;
}
pre{
  padding: 10px;
}
</style>
