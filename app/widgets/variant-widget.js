function VariantWidget(args) {
    var _this = this;
    _.extend(this, Backbone.Events);

    this.location = '';

    //set instantiation args, must be last
    _.extend(this, args);



}

VariantWidget.prototype = {

    draw: function () {

        var _this = this;
        this._createVariantPanel();

    },

    _createVariantPanel:function(){
        var _this = this;
       this.grid = this._createBrowserGrid();
       this.gridEffect = this._createEffectGrid();

    },
    _createBrowserGrid:function(){
        jQuery( "#"+this.variantTableID+" div").remove();
        var _this = this;

            Ext.require([
                'Ext.grid.*',
                'Ext.data.*',
                'Ext.util.*',
                'Ext.state.*'
            ]);



            Ext.define(this.variantTableID, {
                extend: 'Ext.data.Model',
                fields: [
                    {name: 'id',type: 'string'},
                    {name: 'type',type: 'string'},
                    {name: 'chr',type: 'int'},
                    {name: 'start',type: 'int'},
                    {name: 'end',type: 'int'},
                    {name: 'length',type: 'int'},
                    {name: 'ref',type: 'string'},
                    {name: 'alt',type: 'string'}

                ],
                idProperty: 'id'
            });



            Ext.QuickTips.init();

            // setup the state provider, all state information will be saved to a cookie
            Ext.state.Manager.setProvider(Ext.create('Ext.state.CookieProvider'));




            // create the data store
            _this.vbStore = Ext.create('Ext.data.JsonStore', {
                model: this.variantTableID,
                data:[]
            });

            // create the Grid
            _this.vbGrid = Ext.create('Ext.grid.Panel', {
                store:  _this.vbStore,
                stateful: true,
                collapsible: true,
                multiSelect: true,
                //stateId: 'stateGrid',
                columns: {
                    items:[
                        {
                            text     : 'ID',
                            sortable : false,
                            dataIndex: 'id'

                        },
                        {
                            text     : 'Type',
                            sortable : true,
                            //renderer : createLink,
                            dataIndex: 'type'

                        },
                        {
                            text     : 'Chromosome',
                            sortable : true,
                            dataIndex: 'chr'
                        },
                        {
                            text     : 'Start',
                            sortable : true,
                            dataIndex: 'start',
                        },
                        {
                            text     : 'End',
                            sortable : true,
                            dataIndex: 'end'
                        },
                        {
                            text     : 'Length',
                            sortable : true,
                            dataIndex: 'length'

                        },
                        {
                            text     : 'REF',
                            sortable : true,
                            dataIndex: 'ref'

                        },
                        {
                            text     : 'ALT',
                            sortable : true,
                            dataIndex: 'alt'

                        }
                    ],
                    defaults: {
                        flex: 1
                    }
                },
                height: 350,
                //width: 800,
                autoWidth: true,
                autoScroll:false,
                title: 'Variant Browser',
                renderTo: this.variantTableID,
                viewConfig: {
                    enableTextSelection: true,
                    forceFit: true
                },
                listeners: {
                    itemclick : function() {
                        var data =  _this.vbGrid.getSelectionModel().selected.items[0].data;

                         var position = data.chr + ":" + data.start + ":" + data.ref + ":" + data.alt;
                        _this._updateEffectGrid(position);
                    }
                }
            });

        console.log(_this.location)

        var url = METADATA_HOST+'/'+VERSION+'/segment/'+_this.location+'/variants?exclude=files,effects';
        var data = _this._getAll(url);
        _this.vbGrid.getStore().loadData(data.response.result);
        return _this.vbGrid;
    },

    _updateEffectGrid:function(args){
        var _this = this;
        var position = args;
        var url = 'http://ws-beta.bioinfo.cipf.es/cellbase-staging/rest/latest/hsa/genomic/variant/'+position+'/consequence_type?of=json';
        var data = _this._getAll(url);
        if(data.length > 0){
            this.gridEffect.getStore().loadData(data);
        }else{
            this.gridEffect.getStore().removeAll();
        }

    },

    _createEffectGrid:function(){

        jQuery( "#"+this.variantEffectTableID+" div").remove();
        var _this = this;

        Ext.define(_this.variantEffectTableID, {
            extend: 'Ext.data.Model',
            fields: [
                {name: 'chromosome'},
                {name: 'position'},
                {name: 'snpId'},
                {name: 'consequenceType'},
                {name: 'aminoacidChange'},
                {name: 'geneId'},
                {name: 'transcriptId'},
                {name: 'featureId'},
                {name: 'featureName'},
                {name: 'featureType'},
                {name: 'featureBiotype'}
            ]

        });


        // create the data store
        _this.veStore = Ext.create('Ext.data.JsonStore', {
            model: _this.variantEffectTableID,
            data: [],
        });

        // create the Grid
        _this.veGrid = Ext.create('Ext.grid.Panel', {
            store:  _this.veStore,
            stateful: true,
            collapsible: true,
            multiSelect: true,
            //stateId: 'stateGrid',
            columns:{
                items:[
                    {
                        text     : 'position',
                        //flex     : 1,
                        sortable : false,
                        dataIndex: 'position',
                        xtype: 'templatecolumn',
                        tpl: '{chromosome}:{position}'
                    },
                    {
                        text     : 'snpId',
                        sortable : true,
                        dataIndex: 'snpId'

                    },
                    {
                        text     : 'consequenceType',
                        sortable : true,
                        dataIndex: 'consequenceType'
                    },
                    {
                        text     : 'aminoacidChange',
                        sortable : true,
                        dataIndex: 'aminoacidChange'
                    },
                    {
                        text     : 'geneId',
                        sortable : true,
                        dataIndex: 'geneId'
                    },
                    {
                        text     : 'transcriptId',
                        sortable : true,
                        //renderer : createPubmedLink,
                        dataIndex: 'transcriptId'

                    },
                    {
                        text     : 'featureId',
                        sortable : true,
                        //renderer : createPubmedLink,
                        dataIndex: 'featureId'

                    },
                    {
                        text     : 'featureName',
                        sortable : true,
                        //renderer : createPubmedLink,
                        dataIndex: 'featureName'

                    },
                    {
                        text     : 'featureType',
                        sortable : true,
                        //renderer : createPubmedLink,
                        dataIndex: 'featureType'

                    },
                    {
                        text     : 'featureBiotype',
                        sortable : true,
                        //renderer : createPubmedLink,
                        dataIndex: 'featureBiotype',
                        resizable: false

                    }
                ],
                defaults: {
                    flex: 1
                }
            },
            height: 350,
//                width: 800,
            title: 'VariantEffect',
            renderTo: this.variantEffectTableID,
            viewConfig: {
                enableTextSelection: true
            }
        });

        return _this.veGrid;
    },

    _getAll:function(args){
        var data;
        $.ajax({
            url: args,
            async: false,
            dataType: 'json',
            success: function (response, textStatus, jqXHR) {
                data = response;
            },
            error: function (jqXHR, textStatus, errorThrown) {
                data = '';
            }
        });
        return data;
    }



};
