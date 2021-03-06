/*
 * European Variation Archive (EVA) - Open-access database of all types of genetic
 * variation data from all species
 *
 * Copyright 2014, 2015 EMBL - European Bioinformatics Institute
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var variant = {};
var variantID = '';

function EvaVariantView(args) {
    _.extend(this, Backbone.Events);
    this.id = Utils.genId("EVAVariantView");
    _.extend(this, args);
    this.rendered = false;
    this.render();

}
EvaVariantView.prototype = {
    render: function () {
        var _this = this;

        this.targetDiv = (this.target instanceof HTMLElement) ? this.target : document.querySelector('#' + this.target);
        if (!this.targetDiv) {
            console.log('EVAv-VariantView: target ' + this.target + ' not found');
            return;
        }

        variantID = this.position;
        _this.studiesList = [];
        _this.speciesList = getSpeciesList();

        EvaManager.get({
            category: 'meta/studies',
            resource: 'list',
            params: {species: this.species},
            async: false,
            success: function (response) {
                try {
                    var _tempStudies = response.response[0].result;
                    _.each(_.keys(_tempStudies), function (key) {

                        if(_.indexOf(DISABLE_STUDY_LINK, this[key].studyId) > -1){
                            this[key].link = false;
                        }else{
                            this[key].link = true;
                        }
                        _this.studiesList.push(this[key])

                    },_tempStudies);

                } catch (e) {
                    console.log(e);
                }
            }
        });

        var params = {species: this.species};
        if(this.annotationVersion){
            var _annotVersion = this.annotationVersion.split("_");
            _.extend(params, {'annot-vep-version':_annotVersion[0]},{'annot-vep-cache-version':_annotVersion[1]});
        }

        EvaManager.get({
            category: 'variants',
            resource: 'info',
            query: variantID,
            params: params,
            async: false,
            success: function (response) {
                try {
                    variant = response.response[0].result;
                    _this.variant = variant;
                } catch (e) {
                    console.log(e);
                }
                _this.draw();
            }
        });


        //sending tracking data to Google Analytics
        ga('send', 'event', { eventCategory: 'Views', eventAction: 'Variant', eventLabel:'species='+this.species+'variant='+this.position});
    },
    createVariantFilesPanel: function (data) {
        var _this = this;
        var variantFilesPanel = new EvaVariantFilesPanel({
            target: data,
            height: '',
            handlers: {
                "load:finish": function (e) {
//                    _this.grid.setLoading(false);
                }
            },
            statsTpl: new Ext.XTemplate(
                '<table class="ocb-stats-table" style="width:300px;">' +
                    '<tr>' +
                    '<td class="header">Minor Allele Frequency:</td>' +
                    '<td><tpl if="maf == -1 || maf == 0">NA <tpl else>{maf:number( "0.000" )} </tpl></td>' +
                    '</tr>',
                '<tr>' +
                    '<td class="header">MAF Allele:</td>' +
                    '<td><tpl if="mafAllele">{mafAllele} <tpl else>NA</tpl></td>' +
                    '</tr>',
                '<tr>' +
                    '<tr>' +
                    '<td class="header">Mendelian Errors:</td>' +
                    '<td><tpl if="mendelianErrors == -1">NA <tpl else>{mendelianErrors}</tpl></td>' +
                    '</tr>',
                '<tr>' +
                    '<td class="header">Missing Alleles:</td>' +
                    '<td><tpl if="missingAlleles == -1">NA <tpl else>{missingAlleles}</tpl></td>' +
                    '</tr>',
                '<tr>' +
                    '<td class="header">Missing Genotypes:</td>' +
                    '<td><tpl if="missingGenotypes == -1">NA <tpl else>{missingGenotypes}</tpl></td>' +
                    '</tr>',
                '</table>'
            )
        });


        if (variant[0].sourceEntries) {
            variantFilesPanel.load(variant[0].sourceEntries, {species: this.species},  _this.studiesList);
        }
        variantFilesPanel.draw();

        return variantFilesPanel;
    },

    draw: function (data, content) {
        var _this = this;
        if(_.isEmpty(variant)){
            var noDataEl = document.querySelector("#summary-grid");
            var noDataElDiv = document.createElement("div");
            noDataElDiv.innerHTML = '<span>No Data Available</span>';
            noDataEl.appendChild(noDataElDiv);
            return;
        }
        var variantViewDiv = document.querySelector("#variantView");
        $(variantViewDiv).addClass('show-div');
        var summaryContent = _this._renderSummaryData(variant);
        var summaryEl = document.querySelector("#summary-grid");
        var summaryElDiv = document.createElement("div");
        summaryElDiv.innerHTML = summaryContent;
        summaryEl.appendChild(summaryElDiv);

        if(!_.isUndefined(_this._renderConsequenceTypeData(_this.variant))){
            var consqTypeContent = _this._renderConsequenceTypeData(_this.variant);
            var consqTypeEl = document.querySelector("#consequence-types-grid");
            var consqTypeElDiv = document.createElement("div");
            consqTypeElDiv.innerHTML = consqTypeContent;
            consqTypeEl.appendChild(consqTypeElDiv);
        }

        var studyEl = document.querySelector("#studies-grid");
        var studyElDiv = document.createElement("div");
        studyElDiv.setAttribute('class', 'eva variant-widget-panel ocb-variant-stats-panel');
        studyEl.appendChild(studyElDiv);
        _this.createVariantFilesPanel(studyElDiv);

        var popStatsEl = document.querySelector("#population-stats-grid-view");
        var popStatsElDiv = document.createElement("div");
        popStatsElDiv.setAttribute('class', 'eva variant-widget-panel ocb-variant-stats-panel');
        popStatsEl.appendChild(popStatsElDiv);
        var variantData = {sourceEntries: _this.variant[0].sourceEntries, species: _this.species};
        _this._createPopulationStatsPanel(popStatsElDiv, variantData);

    },
    _renderSummaryData: function (data) {
        var _summaryTable = '<h4 class="variant-view-h4"> Summary</h4><div class="row"><div class="col-md-8"><table class="table hover">'
        var variantInfoTitle = document.querySelector("#variantInfo").textContent = data[0].chromosome + ':' + data[0].start + ':' + data[0].reference + ':' + data[0].alternate + ' Info';
        var speciesName;
        if (!_.isEmpty(this.speciesList)) {
            speciesName = _.findWhere(this.speciesList, {taxonomyCode: this.species.split("_")[0]}).taxonomyEvaName;
            _summaryTable += '<tr><td class="header">Organism / Assembly</td><td id="variant-view-organism">' + speciesName.substr(0, 1).toUpperCase() + speciesName.substr(1) + ' / ' + _.findWhere(this.speciesList, {taxonomyCode: this.species.split("_")[0]}).assemblyName + '</td></tr>'
        } else {
            _summaryTable += '<tr><td class="header">Organism / Assembly</td><td id="variant-view-organism">' + this.species + '</td></tr>'
        }

        if (data[0].id) {
            _summaryTable += '<tr><td class="header">ID</td><td id="variant-view-id">' + data[0].id + '</td></tr>'
        }
        var reference = '-';
        var alternate = '-';

        if (data[0].reference) {
            reference = _.escape(data[0].reference);
        }
        if (data[0].alternate) {
            alternate = _.escape(data[0].alternate);
        }

        _summaryTable += '<tr><td class="header">Type</td><td id="variant-view-type">' + data[0].type + '</td></tr>' +
            '<tr><td class="header">Chromosome:Start-End</td><td id="variant-view-chr">' + data[0].chromosome + ':' + data[0].start + '-' + data[0].end + '</td></tr>' +
            '<tr><td class="header">Ref</td><td id="variant-view-ref">' + reference + '</td></tr>' +
            '<tr><td class="header">Alt</td><td id="variant-view-ale">' + alternate + '</td></tr>' +
            '</table>'

        _summaryTable += '</div></div>'

        return _summaryTable;

    },
    _renderConsequenceTypeData: function (data) {
        if(_.isUndefined(data[0].annotation)){
          return;
        }
        var annotation = data[0].annotation.consequenceTypes;
        if (!annotation) {
            return '<h4 class="variant-view-h4"> Consequence Type</h4><div style="margin-left:15px;">No Data Available</div>';
        }
        annotation = annotation.sort(this._sortBy('ensemblGeneId', this._sortBy('ensemblTranscriptId')));
        var _consequenceTypeTable = '<h4 class="variant-view-h4"> Consequence Type</h4><div class="row"><div><table class="table hover">'
        _consequenceTypeTable += '<thead><tr><th>Ensembl Gene ID</th><th>Ensembl Transcript ID</th><th>Accession</th><th>Name</th></tr></thead><tbody>'
        _.each(_.keys(annotation), function (key) {
            var annotationDetails = this[key];
            var soTerms = this[key].soTerms;
            _.each(_.keys(soTerms), function (key) {
                var link = '<a href="http://www.sequenceontology.org/miso/current_svn/term/' + this[key].soAccession + '" target="_blank">' + this[key].soAccession + '</a>';
                var so_term_detail = consequenceTypeDetails[soTerms[0].soName];
                var color = '';
                var impact = '';
                var svg = '';
                if (!_.isUndefined(so_term_detail)) {
                    color = so_term_detail.color;
                    impact = so_term_detail.impact;
                    svg = '<svg width="20" height="10"><rect x="0" y="3" width="15" height="10" fill="' + color + '"><title>' + impact + '</title></rect></svg>'
                }

                var ensemblGeneId = '-';
                if (annotationDetails.ensemblGeneId) {
//                     ensemblGeneId = '<a href="http://www.ensembl.org/Homo_sapiens/Gene/Summary?g='+annotationDetails.ensemblGeneId+'" target="_blank">'+annotationDetails.ensemblGeneId+'</a>';
                    ensemblGeneId = annotationDetails.ensemblGeneId;
                }
                var ensemblTranscriptId = '-';
                if (annotationDetails.ensemblTranscriptId) {
//                    ensemblTranscriptId = '<a href="http://www.ensembl.org/Homo_sapiens/transview?transcript='+annotationDetails.ensemblTranscriptId+'" target="_blank">'+annotationDetails.ensemblTranscriptId+'</a>';
                    ensemblTranscriptId = annotationDetails.ensemblTranscriptId;
                }
                _consequenceTypeTable += '<tr><td class="variant-view-ensemblGeneId">' + ensemblGeneId + '</td><td class="variant-view-ensemblTranscriptId">' + ensemblTranscriptId + '</td><td class="variant-view-link">' + link + '</td><td class="variant-view-soname">' + this[key].soName + '&nbsp;' + svg + '</td></tr>'
            }, soTerms);

        }, annotation);
        _consequenceTypeTable += '</tbody></table></div></div>'

        return _consequenceTypeTable;

    },
    _renderConservedRegionData: function (data) {
        var conservedRegionScores = data[0].annotation.conservedRegionScores;
        if (!conservedRegionScores) {
            return '';
        }
        var _conservedRegionTable = '<div class="row"><div class="col-md-8"><table class="table hover">'
        _conservedRegionTable += '<tr><th>Source</th><th>Score</th></tr>'
        _.each(_.keys(conservedRegionScores), function (key) {
            console.log(this[key])
            _conservedRegionTable += '<tr><td>' + this[key].source + '</td><td>' + this[key].score + '</td></tr>'

        }, conservedRegionScores);
        _conservedRegionTable += '</table></div></div>'

        return _conservedRegionTable;
    },
    _createPopulationStatsPanel: function (target, data) {
        var _this = this;
        this.defaultToolConfig = {
            headerConfig: {
                baseCls: 'eva-header-2'
            }
        };
        var variantPopulationStatsPanel = new EvaVariantPopulationStatsPanel({
            target: target,
            headerConfig: this.defaultToolConfig.headerConfig,
            handlers: {
                "load:finish": function (e) {
                }
            },
            height: 800

        });

        variantPopulationStatsPanel.load(data.sourceEntries, {species: data.species},  _this.studiesList);
        variantPopulationStatsPanel.draw();

        return variantPopulationStatsPanel;
    },
    _sortBy : function(name, minor){
        return function (o, p) {
            var a, b;
            if (typeof o === 'object' && typeof p === 'object' && o && p) {
                a = o[name];
                b = p[name];
                if (a === b) {
                    return typeof minor === 'function' ? minor(o, p) : o;
                }
                if (typeof a === typeof b) {
                    return a < b ? -1 : 1;
                }
                return typeof a < typeof b ? -1 : 1;
            } else {
                throw {
                    name: 'Error',
                    message: 'Expected an object when sorting by ' + name
                };
            }
        }
    }
}
