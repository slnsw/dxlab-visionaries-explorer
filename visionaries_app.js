// record json http://oai-archival.sl.nsw.gov.au/oaix_primo/wwwopac.ashx?database=archive&output=json&search=priref=110047834
// cat record http://archival.sl.nsw.gov.au/Details/archive/110047834
// image http://digital.sl.nsw.gov.au/delivery/DeliveryManagerServlet?dps_func=stream&dps_pid=FL1441280
// thumb http://digital.sl.nsw.gov.au/delivery/DeliveryManagerServlet?dps_func=thumbnail&dps_pid=FL1441280 
// name link http://archival.sl.nsw.gov.au/search/detail?fieldname=Field_ContentPerson&value=Australia.%20Army&database=archive

/////////////////////////////////////////
// GLOBALS
/////////////////////////////////////////
var localVer = false;

var data_local = "all_new.json";
var data_url = "all_new.json";//"https://script.google.com/macros/s/AKfycbwAPZjFAB1k3GsWpY3W4F_qsQtL5kfuv5SSk8-hcazANXb2J1ls/exec?sheet=all";

var records = [];
var records_assoc = {};
var images = [];
var img_assoc = {};
var img_fl = {};
var img_vis = {};
var img_feat = {};
var years = [];
var yr_vis = [];
var yr_match = {};
var years_assoc = {};
var keywords = {};

var items = [];
var albumpos = 0;
var yr = 0;
var imgcount = 0;
var page_count = 1;
var page_qty = 10;
var sortBy = "Year";
var sortOrder = 1;
var materialFilters = {text:false, images:false, objects:false, maps:false};
var materialTitles = {text:"Text", images:"Images", objects:"Objects", maps:"Maps"};
var subjectFilters = [];
var globalPalette = [];
var globalPalette_assoc = {};
var colourFilters = {};

var recFilters = {};
var recCount = 0;


var searchHeaders = [ "Title", "Creator", "Year", "PhysicalDescription", "AdministrativeBiographicalNote", "Source", "PublishedInformation", "SignaturesInscriptions", "GeneralNote" ];
var objKeys = ["Names","Person","Subject","Topics"];
var meta_keys = [/* {key:"CallNumber",label:"Call Number"}, */ {key:"Creator",label:"Creator"}, {key:"PhysicalDescription",label:"Physical Description"}, {key:"AdministrativeBiographicalNote",label:"Administrative / Biographical Note"}, {key:"Source",label:"Source"}, {key:"PublishedInformation",label:"Published Information"}, {key:"SignaturesInscriptions",label:"Signatures Inscriptions"}, {key:"GeneralNote",label:"General Note"}, {key:"Exhibitedin",label:"Exhibited In"}];
var notes_keys = ["Creator","PhysicalDescription","AdministrativeBiographicalNote","Source","PublishedInformation","SignaturesInscriptions","GeneralNote"];
var topics_keys = {keywords:"keywords"};

var stopwords = ["","0","1","2","3","4","5","6","7","8","9","01","02","03","04","05","06","07","08","09","10","02a","02b","1860s","7030part","7039part","a_us","after","a","an","and","are","as","at","been","before","being","best","between","but","by","by_st","ca","call","calld","comprising","concerning","containing","dlmsq","during","etc","featuring","for","from","his","ie","in","including","is","near","of","on","pp","pp.","relating","taken","the","their","this","to","was","were","who","with"];
var stopkeys = {};
for (var i=0; i<stopwords.length; i++) stopkeys[stopwords[i]] = 1;

var heroimages = {};
var featurebg = {};
var recordbg = {};
var zoomlevel = 100;

/////////////////////////////////////////
// APP
/////////////////////////////////////////

var app = angular.module('mainApp', ['ngStorage','infinite-scroll','angular-inview']);


/////////////////////////////////////////
// APP CONTROLLER
/////////////////////////////////////////

app.controller('mainController', function($scope, $http, $localStorage, $location, $timeout) {
	
	$scope.storage = $localStorage;
	$scope.resetStorage = function() {
		$localStorage.$reset();
	}
	$scope.showset = false;
	$scope.imgset = [];
	
	$scope.showmax = page_count * page_qty;
	$scope.showOverlay = false;
	$scope.featureImg = '';
	$scope.materialFilters = materialFilters;
	$scope.colourFilters = colourFilters;
	$scope.recFilters = recFilters;
	$scope.sortBy = sortBy;
	$scope.searchWord = {text:""};
	$scope.dateRange = [1759,1995];
	$scope.globalFiltered = false;
	$scope.globalCounts = {records:0, items:0};
	$scope.heroimages = heroimages;
	$scope.zoomlevel = zoomlevel;
	$scope.meta_keys = meta_keys;
	$scope.topics_keys = topics_keys;
	$scope.titleblock = true;
	$scope.instructions = true;
	$scope.scrollyear = 1800;
	$scope.viewer = null;
	$scope.nobuild = false;
	$scope.howto = false;
	
	loadJSON($scope, $http, $location);
	
	
	/////////////////////////////////////////
	
	
	/////////////////////////////////////////
	// GLOBAL-LEVEL SORT & FILTER
	/////////////////////////////////////////
	
	$scope.showMore = function() {
		page_count++;
		$scope.showmax = page_count * page_qty;
		//console.log($scope.showmax);
	}
	
	$scope.sortIt = function(o) {
			
		sortOrder = (o != sortBy) ? 1 : -1*sortOrder;
		sortBy = o;
		$scope.sortBy = sortBy;
		
		$scope.applyFilters();
	}
	
	$scope.filterType = function(t) {
		console.log("Filter type "+t);
		$scope.materialFilters[t] = !$scope.materialFilters[t];
		
		console.log($scope.materialFilters);
		
		//$scope.applyFilters();
		
		$scope.setParams();
	}
	
	$scope.filterSubject = function(t,w) {
		console.log("Filter subject: "+t+" - "+w);
		
		var flag = false;
		
		for (var i=subjectFilters.length-1; i>-1; i--) {
			if (subjectFilters[i].type==t & subjectFilters[i].text==w) {
				subjectFilters.splice(i, 1);
				flag = true;
			}
		}
		
		if (!flag) subjectFilters.push({type:t, text:w});
		
		$scope.subjectFilters = subjectFilters;
		
		console.log($scope.subjectFilters);
		console.log(subjectFilters);
		
		if ($scope.viewer) $scope.viewRecord($scope.viewer.priref, true);
		else $scope.setParams();
	}
	
	$scope.focusYear = function(yr) {
		if (!yr || yr_vis.length<1 || (yr_vis.length==1 && yr_vis[0].year==yr)) {
			// reset
			$scope.dateRange = [1759,1995];
		} else {
			// focus on single year
			$scope.dateRange = [yr,yr];
		}
		
		//$scope.applyFilters();
		
		$scope.setParams();
	}
	
	$scope.globalCol = function(sw) {
		console.log(sw);
				
		if (colourFilters[sw.r+","+sw.g+","+sw.b]) delete colourFilters[sw.r+","+sw.g+","+sw.b];
		else colourFilters[sw.r+","+sw.g+","+sw.b] = sw;
		
		//$scope.applyFilters();
		
		$scope.setParams();
	}
	
	$scope.resetFilters = function() {
		// reset
		materialFilters = $scope.materialFilters = [];
		subjectFilters = $scope.subjectFilters = [];
		$scope.dateRange = [1759,1995];
		colourFilters = $scope.colourFilters = {};
		$scope.searchWord.text = "";
		
		$scope.setParams();
	}
	
	
	
	//////////////////////////////////////////////////
	
	
	$scope.setParams = function() {
		console.log("set params");
		
		// Reset params
		$location.url($location.path());
		
		// Push daterange to url, trigger applyFilters
		$location.search('dateRange',$scope.dateRange[0]+'-'+$scope.dateRange[1]);
		
		// Push material to url, trigger applyFilters
		var arr = [];
		for (var m in $scope.materialFilters) if ($scope.materialFilters[m]) arr.push(m);
		$location.search('material',arr);
		
		// Push colourFilters to url
		arr = [];
		for (var c in colourFilters) arr.push(c);
		$location.search('colour',arr);
		
		// Push subject/keyword filters to url
		var obj = {};
		for (var i=0; i<subjectFilters.length; i++) {
			obj[subjectFilters[i].type] = (!obj[subjectFilters[i].type]) ? [] : obj[subjectFilters[i].type];
			obj[subjectFilters[i].type].push(subjectFilters[i].text);
		}
		for (var t in obj) $location.search(t, obj[t]);
		
		// Push search word
		$location.search('search',$scope.searchWord.text);
		
		// Push focused record 
		$location.search('view',($scope.viewer ? $scope.viewer.priref : ''));
		
		
		// No need to call applyFilters() as it will be called by '$locationChangeSuccess' - triggered by changing url
	}
	
	
	$scope.getParams = function() {
		// Get params from url
		console.log("get params");
		
		// date range
		if ($location.search().dateRange) {
			if ($location.search().dateRange.split('-') != $scope.dateRange) {
				$scope.dateRange = $location.search().dateRange.split('-');
			}
		}
		
		// material type
		$scope.materialFilters = {};
		if ($location.search().material) {
			console.log($location.search().material);
			// Returns single value as string, multi values as array. So, convert single to array.
			var m = (typeof $location.search().material == "string") ? [$location.search().material] : $location.search().material;
			for (var i=0; i<m.length; i++) {
				$scope.materialFilters[m[i]] = true;
			}
		}
		
		// colours
		if ($location.search().colour) {
			console.log($location.search().colour);
			// Returns single value as string, multi values as array. So, convert single to array.
			var c = (typeof $location.search().colour == "string") ? [$location.search().colour] : $location.search().colour;
			for (var i=0; i<c.length; i++) {
				var sw = c[i].split(',');
/* 				$scope. */colourFilters[c[i]] = {r:sw[0], g:sw[1], b:sw[2]};
			}
		}
		
		// keywords/subject filters
		subjectFilters = [];
		for (var k in topics_keys) {
			console.log(k);
			
			if ($location.search()[k]) {
				console.log($location.search()[k]);
				
				// Returns single value as string, multi values as array. So, convert single to array.
				var t = (typeof $location.search()[k] == "string") ? [$location.search()[k]] : $location.search()[k];
				
				for (var i=0; i<t.length; i++) {
					subjectFilters.push({type:k, text:t[i]});
				}
			}
		}
		$scope.subjectFilters = subjectFilters;
		console.log(subjectFilters);
		
		// search word
		$scope.searchWord.text = "";
		if ($location.search().search) $scope.searchWord.text = $location.search().search;
		
		// focused record
		$scope.viewer = null;
		if ($location.search().view) $scope.viewer = $scope.records_assoc["_"+$location.search().view];
		
		// custom set
		if ($location.search().img) {
			console.log($location.search().img);
			// Returns single value as string, multi values as array. So, convert single to array.
			var img = (typeof $location.search().img == "string") ? [$location.search().img] : $location.search().img;
			
			for (var i=0; i<img.length; i++) {
				if (img[i] in img_fl) $scope.imgset.push( img_fl[img[i]] );
			}
			
			$scope.setParams();
		} 
	}
	
	
	//////////////////////////////////////////////////
	
	
	$scope.applyFilters = function() {
		console.log('-- APPLY FILTERS --');
		
		if (document.getElementById("search")) document.getElementById("search").blur();
		
		// Get params from url
		$scope.getParams();
		
		if ($scope.nobuild) {
			$scope.nobuild = false;
			return true;
		}
				
		page_count = 1;
		$scope.showmax = page_count * page_qty;
		
		yr_vis = [];
		yr_match = {};
		recCount = 0;
		
		var gf = {};
		
		// Load up years within date range
		if ($scope.dateRange[0]==1759 && $scope.dateRange[1]==1995) {
			//yr_vis = years.slice(0);// includes empty years
			
			for (var y=0; y<years.length; y++) if (years[y].records.length>0) {
				yr_vis.push(years[y]);
				yr_match[years[y].year] = years[y].ImgTotal;
			}
			
			recCount = records.length;
		} else {
			for (var y=0; y<years.length; y++) if (years[y].year>=$scope.dateRange[0] && years[y].year<=$scope.dateRange[1] && years[y].records.length>0) {
				yr_vis.push(years[y]);
				yr_match[years[y].year] = years[y].ImgTotal;
				recCount += years[y].records.length;
			}
		}
		
				
		// Filter by search word
		if ($scope.searchWord.text) {
			console.log("Text filter");
			gf.search = true;
			
			var arr_yrs = [];
			yr_match = {};
			recCount = 0;
			
			for (var y=0; y<yr_vis.length; y++) {
				
				var yr = {year:yr_vis[y].year, ImgTotal:0, Img:[], records:[], selected:0};
				
				for (var i=0; i<yr_vis[y].records.length; i++) {
					
					var priref = yr_vis[y].records[i];
					var rec = records_assoc['_'+priref];
					
					var txt = "";
					for (var h=0; h<searchHeaders.length; h++) txt += rec[searchHeaders[h]]+" ";// Search all possible text fields for any match
					var sw = new RegExp($scope.searchWord.text, "gi");
					if (txt.search(sw) !== -1) {
						// Add record to year
						yr.ImgTotal += rec.ImgTotal;
						yr.records.push(priref);
						recCount++;
						
						yr_match[yr.year] = (yr_match[yr.year]) ? yr_match[yr.year] + rec.ImgTotal : rec.ImgTotal;
					}
				}
				
				// If year has records add to arr_yrs
				if (yr.records.length>0) arr_yrs.push(yr);
			}
						
			yr_vis = arr_yrs;
		}
		
		// Filter by keyword
		if (subjectFilters.length > 0) {
			console.log("Keyword filter");
			gf.tags = true;
			
			var arr_yrs = [];
			yr_match = {};
			recCount = 0;
			
			for (var y=0; y<yr_vis.length; y++) {
						
				var yr = {year:yr_vis[y].year, ImgTotal:0, Img:[], records:[], selected:0};
				
				for (var i=0; i<yr_vis[y].records.length; i++) {
					
					var priref = yr_vis[y].records[i];
					var rec = records_assoc['_'+priref];
					
					var k_match = {};
					
					for (var s=0; s<subjectFilters.length; s++) {
						
						var t = subjectFilters[s].type;
						var w = subjectFilters[s].text;
						
						var k = (t=="keywords") ? "keywords" : "tags";
					
						if (rec[k]) {
							for (var n=0; n<rec[k].length; n++) {
							
								if (rec[k][n].text == w) {
									k_match["_"+priref] = (!k_match["_"+priref]) ? 1 : k_match["_"+priref]+1;
								}
							}
						}
					}
					
					for (var pr in k_match) {
						
						if (k_match[pr] >= subjectFilters.length) {
						
							var rec = records_assoc[pr];
								
							// Add record to year
							yr.ImgTotal += rec.ImgTotal;
							yr.records.push(priref);
							recCount++;
							
							yr_match[yr.year] = (yr_match[yr.year]) ? yr_match[yr.year] + rec.ImgTotal : rec.ImgTotal;

						}
					}
					
				}
				
				// If year has records add to arr_yrs
				if (yr.records.length>0) arr_yrs.push(yr);
			}
						
			yr_vis = arr_yrs;
		}
		
		// Filter records by material type
		if ($scope.materialFilters.text || $scope.materialFilters.images || $scope.materialFilters.maps || $scope.materialFilters.objects) {
			console.log("Material filter");
			console.log($scope.materialFilters);
			gf.type = true;
			
			var arr_yrs = [];
			yr_match = {};
			recCount = 0;
				
			// Material type for records
			var p = [];
			//for (var f in $scope.materialFilters) if ($scope.materialFilters[f]) p.push(f);
			//var mt = new RegExp(p.join("|"), "gi");
			for (var f in $scope.materialFilters) if ($scope.materialFilters[f]) p.push("(?=.*"+f+")");
			var mt = new RegExp(p.join(""), "gi");
			console.log(mt);
			
			// Material type for images
			var p = [];
			//for (var f in $scope.materialFilters) if ($scope.materialFilters[f]) p.push(f.toLowerCase().substr(0, 1));
			//var imt = new RegExp(p.join("|"), "gi");
			for (var f in $scope.materialFilters) if ($scope.materialFilters[f]) p.push("(?=.*"+f.toLowerCase().substr(0, 1)+")");
			var imt = new RegExp(p.join(""), "gi");
			
			
			for (var y=0; y<yr_vis.length; y++) {
				
				var yr = {year:yr_vis[y].year, ImgTotal:0, Img:[], records:[], selected:0};
				
				for (var i=0; i<yr_vis[y].records.length; i++) {
					
					var priref = yr_vis[y].records[i];
					var rec = records_assoc['_'+priref];
										
					if (rec.Material.search(mt) != -1) {// Record contains items of matching material
						// Add record to year
						yr.ImgTotal += rec.ImgTotal;
						yr.records.push(priref);
						recCount++;
						
						// Count number of matching images
						var c = 0;
						for (var n=0; n<img_assoc['_'+priref].length; n++) if (img_assoc['_'+priref][n].material.search(imt) != -1) c++;
						yr_match[yr.year] = (yr_match[yr.year]) ? yr_match[yr.year] + c : c;
					}
				}
				
				// If year has records add to arr_yrs
				if (yr.records.length>0) arr_yrs.push(yr);
			}
			
			yr_vis = arr_yrs;
		}
		
		// Filter records by colour
		if (!$scope.isEmpty(colourFilters)) {
			console.log("Colour filter");
			gf.colour = true;
			
			var arr_yrs = [];
			yr_match = {};
			recCount = 0;
			var cf_total = 0;
			for (var k in colourFilters) cf_total++;
			
			for (var y=0; y<yr_vis.length; y++) {
				
				var yr = {year:yr_vis[y].year, ImgTotal:0, Img:[], records:[], selected:0};
				
				for (var i=0; i<yr_vis[y].records.length; i++) {
					
					var priref = yr_vis[y].records[i];
					var rec = records_assoc['_'+priref];
					var rec_match = 0;
					
					for (var c=0; c<rec.palette.length; c++) {
						var sw = rec.palette[c];
						
						for (var k in colourFilters) {
							if (prox(sw, colourFilters[k]) < 35) {
								rec_match++;
								//c = rec.palette.length;
								break;
							}
						}
					}
					
					if (rec_match >= cf_total) {
						// Add record to year
						yr.ImgTotal += rec.ImgTotal;
						yr.records.push(priref);
						recCount++;
						
						// Count number of matching images...
						// Disabled this and stuck with total number of images within record
						// As per other record level matching.

					}
				}
				
				// If year has records add to arr_yrs
				if (yr.records.length>0) {
					arr_yrs.push(yr);
					yr_match[yr.year] = yr.ImgTotal;
				}
			}
						
			yr_vis = arr_yrs;
		}
		
		
		
		// Update scope
		$scope.globalFiltered = (Object.keys(gf).length>0) ? gf : null;
		$scope.yr_vis = yr_vis;
		$scope.yr_match = yr_match;
		$scope.recCount = recCount;
		
		// Update global counts
		$scope.updateCount();
		
		console.log(yr_vis);
		console.log(yr_match);
		
		makeGlobalPalette($scope);
		
	}
	
	
	$scope.updateCount = function() {
		
		var count = {records:0, items:0, t:0, i:0, m:0, o:0};
		
		for (var y=0; y<yr_vis.length; y++) {
			
			count.records += yr_vis[y].records.length;
						
			for (var i=0; i<yr_vis[y].records.length; i++) {
				var priref = yr_vis[y].records[i];
				
				count.items += img_vis['_'+priref].length;
				
				for (var n=0; n<img_vis['_'+priref].length; n++) {
					
					var mat = img_vis['_'+priref][n].material;
					
					for (var m=0; m<mat.length; m++) count[ mat.substr(m, 1) ]++;
				}
			}
			
		}
		
		for (var k in count) if (count[k]>999) count[k] = (Math.round(count[k] / 100)/10)+"k";
		
		$scope.globalCounts = count;
	}
	
	
	$scope.checkRange = function() {
		console.log('check range');
		
		if (!$scope.dateRange.length) $scope.dateRange = [1759,1995];
		if ($scope.dateRange[0]<1759) $scope.dateRange[0] = 1759;
		if ($scope.dateRange[1]>1995 || $scope.dateRange[1]<1759) $scope.dateRange[1] = 1995;
		if ($scope.dateRange[0]>$scope.dateRange[1]) {
			var temp = $scope.dateRange[0];
			$scope.dateRange[0] = $scope.dateRange[1];
			$scope.dateRange[1] = temp;
		}
		
		$scope.setParams();
	}
	
	
	$scope.clearSearch = function() {
		$scope.searchWord.text = "";
		
		$scope.setParams();
	}
	
	
	$scope.keyCount = function(obj) {
		console.log(Object.keys(obj).length);
		
		return Object.keys(obj).length;
	}
	
	
	/////////////////////////////////////////
	// RECORD-LEVEL DISPLAY, SORT & FILTER
	/////////////////////////////////////////
	
	$scope.getBG = function(n) {
		return 'rgb('+Math.round(255-n*255)+','+Math.round(255-n*255)+','+Math.round(255-n*255)+')';
	}
	
	$scope.imgSrc = function(fl) {
		return (localVer) ? 'file:///Users/gravitron/Documents/ANU/Visionaries/images/'+fl+'.jpg' : 'http://digital.sl.nsw.gov.au/delivery/DeliveryManagerServlet?dps_func=thumbnail&dps_pid='+fl;
	}
	
	$scope.showImg = function(fl,event) {
		return 'http://digital.sl.nsw.gov.au/delivery/DeliveryManagerServlet?dps_func=stream&dps_pid='+fl;
	}
	
	$scope.hideImg = function() {
		$scope.showOverlay = !$scope.showOverlay;
	}
	
	$scope.imgLoaded = function(priref,n) {
		if (img_vis['_'+priref][n].feature) {
			console.log("loaded "+priref+" "+n);
			img_vis['_'+priref][n].cached = true;
		}
	}
	
	// Save / Remove fave
	$scope.addImg = function(priref, fl, remove) {
		console.log(priref+" "+remove);
		
		if (!$scope.storage.userset) $scope.storage.userset = [];
		
		t = -1;
		var us = $scope.storage.userset;
		
		for (var i=0; i<us.length; i++) {
			if (us[i].priref==priref && us[i].fl==fl) {
				console.log('match');
				t = i;
				i = us.length;
			}
		}
		
		if (t>-1 && remove) {
			$scope.storage.userset.splice(t, 1);// Remove
			if ($scope.show_overlay) $scope.showHero($scope.heroSet, $scope.heroImg.n);
		} else if (t<0 && !remove) $scope.storage.userset.push({priref:priref, fl:fl});// Add
		
		console.log($scope.storage.userset);
		
		if ($scope.viewer) {
			$scope.favespeek = true;
			
			$timeout(function(){ $scope.favespeek = false; }, 3000);
		}
	}
	
	
	$scope.zoomImg = function(m) {
		var hf = document.getElementById("hero_frame");
		var himg = document.getElementById("hero_img");
		var hrect = hf.getBoundingClientRect();
		var imgrect = himg.getBoundingClientRect();
		var hscr = 0.5;
		var vscr = 0.5;
		
		if (zoomlevel!=100) {
			var hscr = (hf.scrollLeft) ? hf.scrollLeft / (imgrect.width-hrect.width) : 0;
			var vscr = (hf.scrollTop) ? hf.scrollTop / (imgrect.height-hrect.height) : 0;
		}
		
		himg.style.opacity = 0;
		
		if (!m) {
			$scope.viewer.zoomed =! $scope.viewer.zoomed;
			m = 1;
		}
		
		if ($scope.viewer.zoomed) {
			if (zoomlevel+m*50>=100 && zoomlevel+m*50<=400) zoomlevel += m*50;
			//himg.style.width = himg.style.height = zoomlevel+"%";
		} else {
			//himg.style.width = himg.style.height = "";
			zoomlevel = 100;
		}
		
		//himg.style.width = himg.style.height = zoomlevel+"%";
		$scope.zoomlevel = zoomlevel;
		
		// Wait a mo before getting dimensions of zoomed element.
		// Reposition zoomed element in centre.
		$timeout(function(){
			imgrect = himg.getBoundingClientRect();// Get bounds of zoomed image
			hf.scrollLeft = (imgrect.width-hrect.width) * hscr;
			hf.scrollTop = (imgrect.height-hrect.height) * vscr;
			himg.style.opacity = 1;
		}, 5);
	}
	
	
	$scope.viewRecord = function(pr, rebuild) {
		$scope.show_overlay = false;
		
		if (!$scope.viewer || pr!=$scope.viewer.priref) {
			$scope.viewer = $scope.records_assoc["_"+pr];
		} else {
			$scope.viewer = null;
		}
		
		$scope.nobuild = (rebuild) ? false : true;
		$scope.setParams();
	}
	
	$scope.showHero = function(arr, n) {
		console.log("show hero");
		console.log(arr);
		
		if (!arr) return false;
		
		if (!n) n = 0;
		
		if (n > arr.length-1) n = 0;
		else if (n < 0) n = arr.length-1;
		
		$scope.heroSet = arr;
		$scope.heroImg = arr[n];
		$scope.heroImg.n = n;
		
		$scope.show_overlay = true;
	}
	
	$scope.shareSet = function() {
		
		var us = $scope.storage.userset;
		var arr = [];
		
		for (var i=0; i<us.length; i++) {
			arr.push( us[i].fl );
		}
		
		$scope.shareurl = window.location.href+'&img='+arr.join('&img=');
		$scope.sharemail = window.location.href+'%26img='+arr.join('%26img=');
		
		$scope.show_shares = true;
		
		console.log(arr);
	}
	
	$scope.shareVia = function(service) {
		var collectionURL = encodeURIComponent($scope.shareurl);
	
		if (service=="twitter") window.open('https://twitter.com/intent/tweet?original_referer=&text=I created a custom image set using the SLNSW Visionaries Explorer. Check it out '+
			'&tw_p=tweetbutton&url='+collectionURL , '_share', 'width=600, height=500');
		else if (service=="google") window.open('https://plus.google.com/share?url='+collectionURL, '_share', 'width=500, height=500');
		else if (service=="facebook") {
			window.open('https://www.facebook.com/sharer/sharer.php?s=100'+
				'&p[title]=SLNSW Visionaries Explorer'+
				'&p[summary]=I created a custom image set using the SLNSW Visionaries Explorer. Check it out '+
				'&p[url]='+collectionURL+
				'_share', 'width=750, height=450');
		} else if (service=="email") document.location.href = "mailto:?subject=SLNSW Visionaries Explorer&body=I created a custom image set using the SLNSW Visionaries Explorer. Check it out here: "+collectionURL;
	}
	
	$scope.showFeature = function(pr, n, d) {
		console.log(pr);
		console.log(n);
		console.log(d);
		
		if (!pr) return false;
		
		var a = $scope.img_vis['_'+pr];
		
		if (d) n = $scope.img_feat['_'+pr] + d;
		
		if (n>=a.length) n = 0;
		else if (n<0) n = a.length-1;
		
		$scope.img_feat['_'+pr] = n;
	}
	
	$scope.thumbScroll = function(pr, d) {
		var s = document.getElementById("thumbs_"+pr).scrollTop + d * 157;
		console.log(s);
		document.getElementById("thumbs_"+pr).scrollTop = s;
	}
	
	
	
	$scope.toggleSet = function() {
		$scope.showset = !$scope.showset;
	}
	
	$scope.changeBG = function(priref) {
		var n = $scope.recordbg['_'+priref].img;
		
		n = (n+1) % img_assoc['_'+priref].length;
		
		$scope.recordbg['_'+priref] = {img:n, pos:Math.round(25+Math.random()*30)};
	}
	
	$scope.morePics = function(priref) {
		if (records_assoc['_'+priref].showmax < img_vis['_'+priref].length) {
			records_assoc['_'+priref].showmax += 50;
			if (records_assoc['_'+priref].showmax > img_vis['_'+priref].length) records_assoc['_'+priref].showmax = img_vis['_'+priref].length;
			console.log(priref+': '+records_assoc['_'+priref].showmax);
		}
	}
	
	$scope.filterRec = function(priref, material, viewer) {
		if (viewer) $scope.viewRecord(priref);
		
		var rec = recFilters['_'+priref];
		
		console.log(priref+', '+material);
		console.log(recFilters['_'+priref]);
		
		rec[material] = !rec[material];
		
		if (!records_assoc['_'+priref].vis) records_assoc['_'+priref].vis = true;
		
		if (rec.t && rec.i && rec.m && rec.o) {
			// All materials active, reset
			rec.t = false;
			rec.i = false;
			rec.m = false;
			rec.o = false;
		}
		
		$scope.applyRecFilters(priref);
	}
	
	$scope.localCol = function(priref, sw) {
		console.log(priref+', '+sw);
		console.log(recFilters['_'+priref]);
		
		if (!records_assoc['_'+priref].vis) records_assoc['_'+priref].vis = true;
		
		if (recFilters['_'+priref].c[sw.r+","+sw.g+","+sw.b]) delete recFilters['_'+priref].c[sw.r+","+sw.g+","+sw.b];
		else recFilters['_'+priref].c[sw.r+","+sw.g+","+sw.b] = sw;
		
		$scope.applyRecFilters(priref);
	}
	
	$scope.applyRecFilters = function(priref) {
		
		/*//////////////////////////////////////////////////
		
		Issue with using a .vis attribute with ng-repeat limitTo: ...
		limitTo counts TOTAL number of elements, NOT the number of qualified .vis elements.
		So, 500 elements, members 490-500 are .vis qualified, they'll only be visible when limitTo count > 490.
		
		Alternative is to have angular watch a visible elements object - contains ONLY vis elements.
		Form it outside of $scope, then update it in one go. 
		Single update also seems to improve performance when dealing with large number of elements.
		
		//////////////////////////////////////////////////*/
		
		var rec = recFilters['_'+priref];
		var imgs = img_assoc['_'+priref].slice(0);
		var visimg = [];
		
		if (!rec.t && !rec.i && !rec.m && !rec.o && angular.equals(rec.c, {})) {
			// No active filters. Reset
			for (var i=0; i<imgs.length; i++) imgs[i].vis = true;
			visimg = imgs;
			rec.filtered = false;
			rec.materialfilter = false;
			rec.colourfilter = false;
			records_assoc['_'+priref].showmax = 50;
		} else {
			// Apply active filters
			
			rec.filtered = true;
						
			for (var i=0; i<imgs.length; i++) {
				
				if (!rec.t && !rec.i && !rec.m && !rec.o) {
					var flag = true;
					rec.materialfilter = false;
				} else {
					// Check for material match
					var flag = false;
					rec.materialfilter = true;
					
					for (var m=0; m<imgs[i].material.length; m++) {
						if (rec[imgs[i].material.substr(m, 1)]) {
							flag = true;
							m = imgs[i].material.length;
						}
					}
				}
				
				// Check if colour filters exist
				if (!angular.equals(rec.c, {}) && flag) {// Not empty & material match
					// Yep. Now check colours
					rec.colourfilter = true;
					flag = false;
					// Image must match all colour filters, so keep count of matches
					var colcount = 0;
					for (var r in rec.c) colcount++;
					
					for (var r in rec.c) {
						var sw_a = rec.c[r];
						
						for (var m=0; m<imgs[i].palette.length; m++) {
							var sw_b = imgs[i].palette[m];
							
							if ( prox(sw_a,sw_b) < 50 ) {
								// Colour match
								colcount--;
								m = imgs[i].palette.length;// cancel loop
							}
						}
					}
					
					if (colcount < 1) flag = true;// Matches all active colour filters
				} else rec.colourfilter = false;
				
				imgs[i].vis = flag;
				if (flag) visimg.push(imgs[i]);
			}
			
			if (visimg.length < 50) records_assoc['_'+priref].showmax = visimg.length;
			else records_assoc['_'+priref].showmax = 50;
		}
		
		img_vis['_'+priref] = visimg;
		img_assoc['_'+priref] = imgs;
		
		$scope.morePics(priref);
	}
	
	$scope.resetRecFilters = function(priref) {
		console.log("Reset filters");
		
		var imgs = img_assoc['_'+priref].slice(0);
		
		recFilters['_'+priref] = {t:false, i:false, o:false, m:false, c:{}, filtered:false, materialfilter:false, colourfilter:false};
		
		for (var i=0; i<imgs.length; i++) imgs[i].vis = true;
		records_assoc['_'+priref].showmax = 50;
		
		img_vis['_'+priref] = imgs;
		img_assoc['_'+priref] = imgs;
		
		console.log(recFilters['_'+priref]);
	}
	
	
	$scope.lineInView = function(yr, inview, inviewInfo) {
		if (inview) $scope.scrollyear = yr;
	}
	
	$scope.isEmpty = function(obj) {
	    for(var prop in obj) {
	        if(obj.hasOwnProperty(prop))
	            return false;
	    }
	
	    return JSON.stringify(obj) === JSON.stringify({});
	}
	
});





app.directive('imageonload', function() {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            element.bind('load', function() {
                scope.$apply(attrs.imageonload);
            });
            element.bind('error', function(){
	            // failed to load
	            console.log('Load failed');
	        });
        }
    };
});
