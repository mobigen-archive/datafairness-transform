<template>
  <div>
    <v-btn
      color="blue-grey lighten-1"
      class="white--text"
      small
      bottom
      @click="btnClick"
      >추가</v-btn
    >
  </div>
</template>

<script>
import RuleMixin from "@/mixins/RuleMixin.js";
import modalComponent from "@/common/modal/modals/modalComp/add-rule-modal.vue";

export default {
  name: "rowBtn",

  mixins: [RuleMixin],
  props: ["eventType", "iconName", "ruleKey", "selectList", "ruleSample"],

  created() {
    this.EventBus.$once("add", this.addRow);
  },

  methods: {
    btnClick() {
      if (this.eventType === "add") {
        this.addRow();
      } else if (this.eventType === "delete") {
        this.$emit("deleteRow", { key: this.eventType });
      }
    },
    addRow() {
      // 데이터 추가
      // 추가 popup을 표시한다.

      const ruleParams = this.createRuleParamPopup({
        mode: this.$store.getters.CONSTANTS.popupType.CREATE
      });
      this.openRulePopup(ruleParams, modalComponent);
    }
  }
};
</script>
