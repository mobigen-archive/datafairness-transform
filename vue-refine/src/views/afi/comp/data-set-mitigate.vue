<template>
  <div v-if="params !== null">
    <v-card>
      <v-toolbar
        color="blue-grey darken-2"
        dark
        height="40"
        flat
      >{{ defaultData.text }}
      </v-toolbar>
      <v-card-subtitle>
        {{ defaultData.subText }}
        <p class="text-caption">{{ defaultData.desc }}</p>
      </v-card-subtitle>
      <div class="comp_wrap">
        <v-autocomplete
          auto-select-first
          outlined
          :label="afiRowData.algorithmList.label"
          v-model="afiRowData.algorithmList.value"
          :items="afiRowData.algorithmList.list"
          required
          hint="select box를 클릭해 값을 선택해 주세요."
          color="text--secondary"
          item-color="blue-grey darken-2"
        ></v-autocomplete>
      </div>
    </v-card>
  </div>
</template>

<script>
export default {
  name: "data-set-mitigate",
  props: ["compKey", "params"],
  data() {
    return {
      mitigation: null
    };
  },
  computed: {
    defaultData() {
      return this.$store.getters.defaultData[this.compKey];
    },
    afiRowData() {
      return this.$store.getters.afiRowData[this.compKey];
    }
  },
  methods: {},
  created() {
    // 기본값 셋팅
    this.mitigation = this.afiRowData.algorithm;
  }
};
</script>

<style scoped>
.comp_wrap{
  border: none;
}
</style>
