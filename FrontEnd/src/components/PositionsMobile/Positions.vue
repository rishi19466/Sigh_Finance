<template src="./template.html"></template>

<script>
import EventBus, { EventNames, } from '@/eventBuses/default';
import Spinner from '@/components/Spinner/Spinner.vue';
import {VegaKeys,} from '@/utils/localStorage.js';
import gql from 'graphql-tag';

export default {
  name: 'positions-mobile',

  components: {
    Spinner,
  },

  props: {
    parentHeight: Number,
    open: {
      type: Boolean,
    },
  },

  data() {
    return {
      positions: [],
      markets : [],
      subs_positions: new Map(),
      positions_array: [],
      partiesId: VegaKeys.currentActiveKey,
      totalRealizedPNL_VUSD: 0,
      totalUnrealizedPNL_VUSD: 0,
      totalRealizedPNL_BTC: 0,
      totalUnrealizedPNL_BTC: 0,
      dropdownSelections: [],
      dropdownMarkets: this.$store.getters.markets,
    };
  },

  // computed: {
  //   positions() {
  //     return this.mapActiveOrders(this.$store.getters.positions);
  //   },
  // },

  apollo: {
    $subscribe: {
      positions: {
        query: gql`subscription name($partyId: String!) {
                    positions (partyId: $partyId) {
                        market {
                          id
                          name
                        }
                        openVolume
                        realisedPNL
                        unrealisedPNL
                        averageEntryPrice
                        margins{
                          maintenanceLevel
                          searchLevel
                          initialLevel
                          collateralReleaseLevel
                        }
                      }
                    }`,

        variables() {  return {partyId: this.partiesId,};  },

        result({data,loading,}) {
          if (loading) {
            // console.log('loading');
          }
          let _positions = data.positions;
          // // console.log(_positions);
          this.subcribeToPositions(_positions);
        },
      },
    },
  },

  mounted() {
    this.userwalletConnected = () => this.setPubKey();
    this.userWalletDisconnectedListener = () => (this.positions = []);
    EventBus.$on(EventNames.userWalletConnected, this.userwalletConnected);  //GET POSITIONS
    EventBus.$on(EventNames.userWalletDisconnected, this.userWalletDisconnectedListener); //GO EMPTY AGAIN
    EventBus.$on(EventNames.pubKeyChanged,this.userwalletConnected);  //to handle change in pubKey    
  },

  methods: {

    setPubKey() {
      // // console.log(VegaKeys.currentActiveKey);
      this.positions_array = [];
      this.positions = [];
      // console.log(this.dropdownMarkets);
      this.dropdownMarkets = [];
      let markets = this.$store.getters.markets;
      for (let i=0;i<markets.length;i++) {    //used for populating dropdown
        let cur = {};
        cur.id = markets[i].id;
        cur.name = markets[i].data.name;
        this.dropdownMarkets.push(cur);
      }
      // this.dropdownMarkets = 
      // console.log(this.dropdownMarkets);

      this.markets = this.$store.getters.mappedMarketsbyName;
      this.$store.commit('totalRealizedPNL_VUSD',0);
      this.$store.commit('totalUnrealizedPNL_VUSD',0);  
      this.$store.commit('totalRealizedPNL_BTC',0);
      this.$store.commit('totalUnrealizedPNL_BTC',0);          
      this.partiesId = VegaKeys.currentActiveKey;
      // // console.log(this.partiesId);
    },

    subcribeToPositions(positions) {
      // if (!this.subs_positions.has(positions.market.id)) {
      let obj = [];
      obj.averageEntryPrice = (Number(positions.averageEntryPrice)/100000).toFixed(5);
      obj.openVolume = Number(positions.openVolume);
      obj.realisedPNL = (Number(positions.realisedPNL)/100000).toFixed(5);
      obj.unrealisedPNL = (Number(positions.unrealisedPNL)/100000).toFixed(5);
      obj.maintenanceLevel = (Number(positions.margins[0].maintenanceLevel)/100000).toFixed(5);
      obj.searchLevel = (Number(positions.margins[0].searchLevel)/100000).toFixed(5);
      obj.collateralReleaseLevel = (Number(positions.margins[0].collateralReleaseLevel)/100000).toFixed(5);
      obj.initialLevel = (Number(positions.margins[0].initialLevel)/100000).toFixed(5);
      obj.market_name  = positions.market.name;
      obj.marketID = positions.market.id;
      this.subs_positions.set(String(positions.market.id),obj);
      // // console.log(this.subs_positions);
      this.positions_array = Array.from(this.subs_positions, ([name,value,]) => ({name,value,}) );
      this.totalRealizedPNL_VUSD = 0;
      this.totalUnrealizedPNL_VUSD = 0;
      this.totalRealizedPNL_BTC = 0;
      this.totalUnrealizedPNL_BTC = 0;

      for (let i=0; i<this.positions_array.length ; i++ ) {
        // // console.log(this.positions_array);
        // // console.log(this.$store.getters.mappedMarketsbyName);
        if (this.$store.getters.mappedMarketsbyName.has(this.positions_array[i].value.market_name)) {
          // // console.log(this.markets);
          // // console.log(this.positions_array[i].value.market_name);
          let cur = this.$store.getters.mappedMarketsbyName.get(this.positions_array[i].value.market_name);
          // // console.log(cur);
          if (cur.quoteName == 'VUSD') {
            this.totalRealizedPNL_VUSD = Number(this.totalRealizedPNL_VUSD) + Number(this.positions_array[i].value.realisedPNL);
            this.totalUnrealizedPNL_VUSD = Number(this.totalUnrealizedPNL_VUSD) + Number(this.positions_array[i].value.unrealisedPNL);
            this.$store.commit('totalRealizedPNL_VUSD',this.totalRealizedPNL_VUSD);
            this.$store.commit('totalUnrealizedPNL_VUSD',this.totalUnrealizedPNL_VUSD);
          }
          if (cur.quoteName == 'BTC') {
            this.totalRealizedPNL_BTC = Number(this.totalRealizedPNL_BTC) + Number(this.positions_array[i].value.realisedPNL);
            this.totalUnrealizedPNL_BTC = Number(this.totalUnrealizedPNL_BTC) + Number(this.positions_array[i].value.unrealisedPNL);
            this.$store.commit('totalRealizedPNL_BTC',this.totalRealizedPNL_BTC);
            this.$store.commit('totalUnrealizedPNL_BTC',this.totalUnrealizedPNL_BTC);
          }
        }
      }
    },

    toggleOpen() {
      this.$emit('toggle-open');
    },

    userWalletDisconnectedListener() {
      this.positions_array = [];
      this.positions = [];
      this.$store.commit('totalRealizedPNL',0);
      this.$store.commit('totalUnrealizedPNL',0);      
    },

    async closeAllPositions() {   
      let curr_array = this.positions_array;
      // console.log(curr_array);
      for (let i=0;i<curr_array.length;i++) {
        if (curr_array[i].value.openVolume != 0) {
            let resp = await this.closePosition(curr_array[i].value);
        }
      }
    },

    //Closes all Positions, Cancels All Orders
    async closeAllPositionsAndCancelAllOrders() {
      let curr_array = this.positions_array;
      // console.log(curr_array);

      //For loop to close all Positions
      for (let i=0;i<curr_array.length;i++) {
        if (curr_array[i].value.openVolume != 0) {
            let resp = await this.closePositionAndCancelOrders(curr_array[i].value);
        }
      }
      this.$showSuccessMsg({message: 'All Positions have been closed' ,});                      
      this.$showSuccessMsg({message: 'All Active Orders have been cancelled' ,});           
    },

    //CALLS .closePosition and .cancelAllOrders to close position and cancel All Orders
    async closePositionAndCancelOrders(position) {  
      let closePosition = await this.closePosition(position);
      this.$showSuccessMsg({message: 'The Position for the market \'' + position.market_name + '\' has been closed' ,});                

      let activeOrders = this.$store.getters.activeOrders;
      // console.log(activeOrders);
      let cancelAllOrders = await this.cancelAllOrders(position);
    },

    //Cancels all Active Orders for the selected Position's Market
    async cancelAllOrders(position) {
      let activeOrders = this.$store.getters.activeOrders;
      // console.log(activeOrders);

      for (let i=0;i<activeOrders.length;i++) {
        if (position.marketID == activeOrders[i].marketID) {
          // console.log(activeOrders[i]);
          let cancelOrder = await this.cancelOrder(activeOrders[i]);
        }
      }
      this.$showSuccessMsg({message: 'All active Orders for the market \'' + position.market_name + '\' have been cancelled' ,});                
    },

    //Closes the Position
    async closePosition(position) {       //CLOSES POSITION FOR THE POSITION OBJECT PASSED
      // console.log(';IN CLOSEPOSITION + ' + position.openVolume + '   ' + Number(position.openVolume) );
    },

    //Cancels the passed Order
    async cancelOrder(order) {          //CANCELS THE PASSED ORDER 
      // console.log(order); 
      this.$store.commit('addLoaderTask', 1, false);
      // console.log('in cancel order (Positions Component)');
    }


  },

  destroyed() {
    EventBus.$off(EventNames.userWalletConnected, this.userwalletConnected);
    EventBus.$off(EventNames.userWalletDisconnected, this.userWalletDisconnectedListener);
    EventBus.$on(EventNames.pubKeyChanged,this.userwalletConnected);  //to handle change in pubKey        
  },
};
</script>

<style lang="scss" src="./style.scss" scoped></style>

