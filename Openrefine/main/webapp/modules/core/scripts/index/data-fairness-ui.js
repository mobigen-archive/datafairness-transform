const Grid = tui.Grid;
const Pagination = tui.Pagination;
const Chart = tui.chart;

const DQI_SERVER_URL = "http://"+location.hostname+":9090/dqi/";
const AFI_SERVER_URL = "http://"+location.hostname+":9090/afi/";

var ui = {};

/* ************************************
 * Grid Pagination Info
 * ************************************/
var PAGE_INFO = {
	PAGE_VAL : 1,
	ITEM_PER_PAGE : 15,
	START : 0
}
var UI_CHART_INFO = {
	selectedPName : '',
	selectedPId : '',
	headerIndex : {},
}

var MAX_HEADER_SELECED = 10;

/* ************************************
 * tui.grid header column checkbox creator
 * ************************************/
var CustomColumnHeader = function(props) {
    const columnInfo = props.columnInfo;
    const el = document.createElement('div');
    el.className ='custom_table_header';
    
    const chkElWrapper = document.createElement('div');
    const chkEl = document.createElement('input');
    if (DOM_ID.indexOf('profiling') > -1) {
    	chkEl.type = 'checkbox';
        chkEl.name = `${columnInfo.header}`;
    } else {
    	chkEl.type = 'radio';
        chkEl.name = 'project-radio';
        chkEl.value = `${columnInfo.header}`;
    }
    chkEl.className = 'custom_table_header_check';
    chkElWrapper.appendChild(chkEl);
    el.appendChild(chkElWrapper);
    
    const txtEl = document.createElement('span');
    txtEl.className = 'custom_table_header_span';
    txtEl.textContent = `${columnInfo.header}`;
    el.appendChild(txtEl);
    
    this.el = el;

    this.render(props);
}
CustomColumnHeader.prototype.getElement = function() {
	return this.el;
}
CustomColumnHeader.prototype.render = function(props) {
	this.el.value = props.value;
}

/* ************************************
 * data-quality-ui.js start
 * ************************************/
Refine.SetDataQualityUI = function(elmt) {
	// same file used two section.
	var self = this;
	
	const actionAreaId = $(elmt).attr('DOM_ID');
	elmt.html(DOM.loadHTML("core", "scripts/index/"+actionAreaId+".html"));

	this._elmt = elmt;
	this._elmts = DOM.bind(elmt);
	
	DOM_ID = $(this._elmt).attr('DOM_ID').indexOf('profiling') > -1 ? 'data-profiling-body' : 'data-quality-body'
	ui = DOM.bind($("#"+DOM_ID));

	// initialzed
	this._getProjectList();
	this._btnSetting();
};

Refine.SetDataQualityUI.prototype._getDOM_ID = function() {
	DOM_ID = $(this._elmt).attr('DOM_ID').indexOf('profiling') > -1 ? 'data-profiling-body' : 'data-quality-body';	
}
Refine.SetDataQualityUI.prototype._hasOwnProperty = function(self, elmtsId) {
	return self._elmts.hasOwnProperty(elmtsId);
	
}
/* ************************************
 * Grid Creator
 * ************************************/
Refine.SetDataQualityUI.prototype._createGrid = function() {
	const columns = this._createColumns(false);
	const headerColumns = this._createColumns(true);
	
	this._getDOM_ID();
	const container = $('#' + DOM_ID + ' .project_table');
	
	this.GridInstance = new Grid({
		  el: container[0], // Container element
//		  rowHeaders: ['rowNum'],
		  columns: columns,
		  data: [],
		  header : {
			  columns: headerColumns,
			  height : 100
		  },
		  columnOptions : {
			  minWidth : 120
		  }
		});
	var theme = {
		selection: {
			background: '#4daaf9',
			border: '#004082'
		},
		scrollbar: {
			background: '#f5f5f5',
		    thumb: '#d9d9d9',
		    active: '#c1c1c1'
    	},
    	row: {
    		even: {
    			background: '#f2f2f2'
    		},
		    hover: {
		    	background: '#ccc'
		    }
    	},
    	cell: {
    		normal: {
    			background: '#fbfbfb',
    			border: '#e0e0e0',
    			showVerticalBorder: true
		    },
		    header: {
		    	background: '#eee',
		    	border: '#ccc',
		    	showVerticalBorder: true
		    },
		    rowHeader: {
		    	border: '#ccc',
		    	showVerticalBorder: true
		    },
		    editable: {
		    	background: '#fbfbfb'
		    },
		    selectedHeader: {
		    	background: '#d8d8d8'
		    },
		    focused: {
		    	border: '#418ed4'
		    },
		    disabled: {
		    	text: '#b0b0b0'
		    }
    	}
	}
	Grid.applyTheme('default', theme)
}
/* ************************************
 * Create Pagination
 * ************************************/
Refine.SetDataQualityUI.prototype._createPagination = function(totalCount) {
	this._getDOM_ID();
	const dom = $('#' + DOM_ID + ' .data-quality-pagination');
	
	dom.show();
	
	// pagination
	this.pageInstance = new Pagination(dom[0], {
        totalItems: totalCount,
        itemsPerPage: PAGE_INFO.ITEM_PER_PAGE,
        visiblePages: 10,
        page: PAGE_INFO.PAGE_VAL,
    });
    this.pageInstance.on('afterMove', function(eventData) {
    	PAGE_INFO.PAGE_VAL = eventData.page
    	PAGE_INFO.START = PAGE_INFO.ITEM_PER_PAGE * (eventData.page-1)
    	this._getProjectData();
    }, this);
}

/* ************************************
 * get Project Info Fron Backend
 * ************************************/
Refine.SetDataQualityUI.prototype._getProjectList = function() {
	const self = this;
	$.getJSON(
			"command/core/get-all-project-metadata",
			null,
			function(data) {
				self._renderProjects(data);
			},
			"json"
	);
}

/* ************************************
 * set Projct List to SelectBox 
 * ************************************/
Refine.SetDataQualityUI.prototype._renderProjects = function(data) {
	var selectbox = this._elmts.project_selectbox.empty();
	const projectIds = Object.keys(data.projects);
	// project 목록이 없는 경우, selectbtn을 disabled 하고 return한다.
	var optionHtml = '';
	if (projectIds.length == 0) {
		optionHtml = '<option>No projects</option>'; 
		this._elmts.project_select_btn.prop('disabled', true);
		return;
	} else {
		let tableName = null;
		let reg = /[`~!@#$%^&*()|+\-=?;:'",.<>\{\}\[\]\\\/ ]/gim;
		projectIds.forEach((pId) => {
			const p = data.projects[pId];

			// table Name 셋팅
			if (Object.prototype.hasOwnProperty.call(p, 'query') > -1
			&& p.query !== null) {
				tableName = p.query.trim().split('FROM').pop();
				tableName = tableName.replace(reg, "");
			}

			optionHtml+= '<option value="'+pId+'" projectName="'+p.name+'" tableName="'+tableName+'">';
			optionHtml+= p.name;
			optionHtml+= '</option>'
		})
	}
	selectbox.append(optionHtml);
}

/* ************************************
 * Setting Btn Events
 * - Project Select Btn
 * - Data Statistics Btn
 * - Select All Checkbox
 * ************************************/
Refine.SetDataQualityUI.prototype._btnSetting = function() {
	this._getDOM_ID();
	
	// text 처리
	this._elmts.project_select_lebel.text($.i18n('core-index-data/project-label')+":");
	this._elmts.project_select_btn.text($.i18n('core-index-data/select'));
	
	if (DOM_ID.indexOf('profiling') > -1) {
		// use these btns st data profiling page.
		this._elmts.get_sta_btn.text($.i18n('core-index-data/basic-data-statistics'));
		this._elmts.view_qe_btn.text($.i18n('core-index-dialog-qe/quantitative_evaluation'));
		this._elmts.select_all_label.text($.i18n('core-index-data/select-all-label'));
	} else {
		// use these btns st data assessment page.
		this._elmts.get_evaluation_index.text($.i18n('core-index-data/evaluation-index'));
		this._elmts.open_web_data_quality.text($.i18n('core-index-data/data-quality'));
		this._elmts.open_web_fairness.text($.i18n('core-index-data/fairness'));
	}
	
	// btn click 이벤트
	this._elmts.project_select_btn.on('click', {_self : this}, function(e) {
		// focus out
		$(e.target).blur();
		
		DialogSystem.showBusy($.i18n('core-index-dialog/loading-step1'));
		
		const _self = e.data._self;
		
		_self.columnModel = null;
		
		// reset
		// grid pagination reset
		PAGE_INFO.PAGE_VAL= 1;
		PAGE_INFO.START = 0;
		
		_self._elmts.project_table.empty();
		
		if (_self._hasOwnProperty(_self, 'check_all')) {
			_self._elmts.check_all.attr('checked', false)
		}
		_self._getDOM_ID();
		$('#'+DOM_ID+' .data-quality-pagination').hide();
		
		_self.GridInstance = null;
		_self.staticGridInstance2 = null;

		let selected = _self._elmts.project_selectbox.find(':selected');
		UI_CHART_INFO.selectedPName = selected.attr('projectname')
		UI_CHART_INFO.tableName = selected.attr('tableName')
		UI_CHART_INFO.selectedPId = _self._elmts.project_selectbox.val();

		if (_self._elmts.sec_btns !== undefined) {
			if (UI_CHART_INFO.tableName !== null && UI_CHART_INFO.tableName !== undefined && UI_CHART_INFO.tableName !== '') {
				// 버튼 표시
				_self._elmts.sec_btns.show();
			} else {
				// 버튼 가림
				_self._elmts.sec_btns.hide();
			}
		}
		setTimeout(()=>{
			_self._getModelInfo();
			_self._getProjectData();
		}, 10)
	})
	
	if (this._hasOwnProperty(this, 'select_all_label')) {
		// label 클릭 = checkbox 체크 이벤트
		this._elmts.select_all_label.on('click', {_self : this}, (e) => {
			const _self = e.data._self;
			_self._elmts.check_all.click()
		})
	}
	
	if (this._hasOwnProperty(this, 'check_all')) {
		// 전체 선택 체크박스 체크시, 모든 header를 check 한다.
		this._elmts.check_all.on('change', {_self : this}, (e) => {
			const _self = e.data._self;
			
			_self._getDOM_ID();
			
			// 프로젝트 선택 전일경우 alert을 띄운다.
			if (UI_CHART_INFO.selectedPName == undefined || UI_CHART_INFO.selectedPName == '') {
				alert($.i18n('core-index-data/no-selected-project'))
				$(e.target).removeProp('checked');
				return;
			}
			
			const selectAllChecked = $(e.target).is(':checked');
			var checkBtns = $('#'+DOM_ID+' .custom_table_header_check');
			
			if (checkBtns.length > MAX_HEADER_SELECED) {
				const checked = $('#'+DOM_ID+' .custom_table_header_check:checked');
				const maxHeaderVal = MAX_HEADER_SELECED - checked.length;
				
				checkBtns.each((i, cb)=>{
					if (selectAllChecked) {
						if (i < maxHeaderVal) {
							$(cb).attr('checked', selectAllChecked)
						}
					} else {
						$(cb).attr('checked', selectAllChecked)	
					}
				})			
			} else {
				checkBtns.each((i, cb)=>{
					$(cb).attr('checked', selectAllChecked)	
				})
			}
		});
	}
	
	if (this._hasOwnProperty(this, 'get_sta_btn')) {
		// 데이터 통계 팝업 버튼 클릭
		this._elmts.get_sta_btn.on('click', {_self : this}, (e) => {
			// focus out - prevent dbl click
			$(e.target).blur();
			
			const _self = e.data._self;
			_self._getDOM_ID();

			const checked = $('#'+DOM_ID+' .custom_table_header_check:checked');
			var headerOriginalNames = [];
			var headerOriginalIndexes = [];
			checked.each((i, _c) => {
				headerOriginalNames.push(_c.name)
				headerOriginalIndexes.push(UI_CHART_INFO.headerIndex[_c.name])
			})
			
			// 선택된 프로젝트가 없음 > 진행불가능
			if (UI_CHART_INFO.selectedPName == undefined || UI_CHART_INFO.selectedPName == '') {
				alert($.i18n('core-index-data/no-selected-project'))
			} else if (headerOriginalNames.length == 0) {
				alert($.i18n('core-index-data/no-selected-headers'))
			} else {
				// 정량평가 팝업 표시
				new BasicStatisticsDialogUI({
					names : headerOriginalNames,
					indexes : headerOriginalIndexes 
				});
			}
		});
	}

//	if (this._hasOwnProperty(this, 'view_qe_btn')) {
//		this._elmts.view_qe_btn.on('click', {_self : this}, (e) => {
//			// focus out - prevent dbl click 
//			$(e.target).blur();
//			
//			const _self = e.data._self;
//			self._getDOM_ID();
//		
//			const checked = $('#'+DOM_ID+' .custom_table_header_check:checked');
//			var headerOriginalNames = [];
//			var headerOriginalIndexes = [];
//			checked.each((i, _c) => {
//				headerOriginalNames.push(_c.name)
//				headerOriginalIndexes.push(UI_CHART_INFO.headerIndex[_c.name])
//			})
//			
//			// 선택된 프로젝트가 없음 > 진행불가능
//			if (UI_CHART_INFO.selectedPName == undefined || UI_CHART_INFO.selectedPName == '') {
//				alert($.i18n('core-index-data/no-selected-project'))
//			} else if (headerOriginalNames.length == 0) {
//				alert($.i18n('core-index-data/no-selected-headers'))
//			} else {
//				// 정량평가 팝업 표시
//				new QEDialogUI({
//					names : headerOriginalNames,
//					indexes : headerOriginalIndexes 
//				});
//			}
//		})
//	}

	if (this._hasOwnProperty(this, 'get_evaluation_index')) {
		// 평가 지표 버튼 클릭
		this._elmts.get_evaluation_index.on('click', {_self : this}, (e) => {
			// focus out - prevent dbl click
			$(e.target).blur();
			
			const _self = e.data._self;
			_self._getDOM_ID();
			
			const checked = $('#'+DOM_ID+' .custom_table_header_check:checked')[0];
			
			// 선택된 프로젝트가 없음 > 진행불가능
			if (UI_CHART_INFO.selectedPName == undefined || UI_CHART_INFO.selectedPName == '') {
				alert($.i18n('core-index-data/no-selected-project'))
			} else if (checked == undefined) {
				alert($.i18n('core-index-data/no-selected-headers'))
			} else {
				const index = UI_CHART_INFO.headerIndex[checked.value];
				const name = checked.value;
				
				// 선택된 header가 있음 > 그 header로 진행
				new EIDialogUI(index, name)
				
			}
		});

		this._elmts.open_web_data_quality.on('click', {_self : this}, (e) => {
			// focus out - prevent dbl click
			$(e.target).blur();

			const _self = e.data._self;
			_self._getDOM_ID();

			const checked = $('#'+DOM_ID+' .custom_table_header_check:checked')[0];

			// 선택된 프로젝트가 없음 > 진행불가능
			if (UI_CHART_INFO.selectedPName == undefined || UI_CHART_INFO.selectedPName == '') {
				alert($.i18n('core-index-data/no-selected-project'))
			} else {
				window.open(DQI_SERVER_URL+UI_CHART_INFO.tableName,
					"RULE",
					"menubar=0, toolbar=0, location=false, status=0, top=100px, left=100px, height=800px, width=1000px")
			}
		});
		this._elmts.open_web_fairness.on('click', {_self : this}, (e) => {
			// focus out - prevent dbl click
			$(e.target).blur();

			const _self = e.data._self;
			_self._getDOM_ID();

			const checked = $('#'+DOM_ID+' .custom_table_header_check:checked')[0];

			// 선택된 프로젝트가 없음 > 진행불가능
			if (UI_CHART_INFO.selectedPName == undefined || UI_CHART_INFO.selectedPName == '') {
				alert($.i18n('core-index-data/no-selected-project'))
			} else {
				window.open(AFI_SERVER_URL+UI_CHART_INFO.tableName,
					"RULE",
					"menubar=0, toolbar=0, location=false, status=0, top=100px, left=100px, height=800px, width=1000px")
			}
		});
	}
}
function _refreshRows() {
	$('#project_select_btn').click();
}


/* ************************************
 * Convert Data from Backend to tui.Grid
 * ************************************/
Refine.SetDataQualityUI.prototype._makeDataObj = function(rows) {
	const _header = this.columnModel.columns;
	
	function createArr(cells) {
		var obj = {}
		
		for (var i = 0, size = _header.length; i < size; i++) {
			const h = _header[i];
			
			var _t = cells[h.cellIndex];
			
			if (_t == null || _t == undefined) {
				_t = {}
				_t.v = '';
				cells[h.cellIndex] = _t;
			}
			
			obj[h.name] = cells[h.cellIndex].v;
		}
		return obj;
	}
	
	var arr = [];
	rows.forEach((r) => {
		arr.push(createArr(r.cells));
	})
	return arr;
}

/* ************************************
 * get Model info From Backend
 * ************************************/
Refine.SetDataQualityUI.prototype._getModelInfo = function() {
	var _self = this;
	
	$.ajaxSetup({ async: false });
    $.getJSON(
    		"command/core/get-models?" + $.param({ project: UI_CHART_INFO.selectedPId }), null,
    		function(data) {
    			_self.columnModel = data.columnModel;
    		},
    	'json'
    );
    $.ajaxSetup({ async: true});
}

/* ************************************
 * get Project Rows From Backend
 * ************************************/
Refine.SetDataQualityUI.prototype._getProjectData = function() {
	var _self = this;
	$.post(
			"command/core/get-rows?" + $.param({ project: UI_CHART_INFO.selectedPId, start: PAGE_INFO.START, limit: PAGE_INFO.ITEM_PER_PAGE }),
			{engine: {}},	// no history option
			function(data) {
				DialogSystem.dismissAll();
				
				if(data.code === "error") {
					alert('error')
				} else {
					_self._setGridData(data);
				}
			},
			"json"
	);
}
Refine.SetDataQualityUI.prototype._setGridData = function(data) {
	var rows = data.rows;
	
	if (rows.length > 0) {
		// show panel
		this._elmts.project_table.show();
	} else {
		// hide panel
		this._elmts.project_table.hide();
	}
	
	if (this.GridInstance == undefined) {
		this._createGrid();
		this._createPagination(data.total)
	}

	const newData = this._makeDataObj(rows);
	this.GridInstance.resetData(newData); // Call API of instance's public method

	if (this._hasOwnProperty(this, 'get_sta_btn')) {
		this._elmts.get_sta_btn.attr('disabled', false);
	}
	
	function headerClicked(target, _self) {
		_self._getDOM_ID();
		
		const checked = $('#'+DOM_ID+' .custom_table_header_check:checked');
		if (checked.length > MAX_HEADER_SELECED) {
			return false;
		} else {
			$(target).find('.custom_table_header_check').click();
			return true;
		}
	}
	this._getDOM_ID();
	
	$('#'+DOM_ID+' th').off('click');
	$('#'+DOM_ID+' th span').off('click');
	//after grid data loaded, set Header Click EVENT
	$('#'+DOM_ID+' th').on('click', {_self:this}, (e)=>{
		const result = headerClicked(e.target, e.data._self);
		if (!result) {
			e.preventDefault();
		}
	})
	$('#'+DOM_ID+' th span').on('click', {_self:this}, (e)=>{
		$(e.target.parentNode.parentNode).click();
	})
}

Refine.SetDataQualityUI.prototype._createColumns = function(isHeaderColumn) {
	var columnArr = [];
	
	if (this.columnModel != undefined) {
		this.columnModel.columns.forEach((c, i) => {
			UI_CHART_INFO.headerIndex[c.name] = c.cellIndex
			
			var obj = {};
			if (isHeaderColumn) {
				// renderer 추가
				obj['header'] = c.name; 
				obj['name'] = c.name;
				obj['renderer'] = CustomColumnHeader;
			} else {
				obj['header'] = c.name; 
				obj['name'] = c.name;
				obj['align'] = 'right'
			}
			columnArr.push(obj);
		}, {_self : this});
	}
	return columnArr;
}

Refine.SetDataQualityUI.prototype.resize = function() {
};

/**
 * SetDataQualityUI used two section.
 * 1. Data profiling. 
 * 2. Data Quality. 
 */
Refine.actionAreas.push({
	id : "data-profiling-ui",
	label : $.i18n('core-index-data/data-profiling-asses'),
	uiClass : Refine.SetDataQualityUI
});

Refine.actionAreas.push({
	id : "data-quality-ui",
	label : $.i18n('core-index-data/evaluation-index-title'),
	uiClass : Refine.SetDataQualityUI
});
