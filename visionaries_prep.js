/////////////////////////////////////////
// LOAD AND PREP DATA
/////////////////////////////////////////

function loadJSON($scope, $http, $location) {
	
	var jsonurl = (localVer) ? data_local : data_url;
// 	var jsonurl = data_local;

	$http.get(jsonurl).
	success(function(data, status, headers, config) {
		console.log('ok');
		console.log(data);
		
		prepData($scope, data, $location);

	}).
	error(function(data, status, headers, config) {
		// log error
		console.log('error');
		alert("Problem loading json");
	});
}


function prepData($scope, data, $location) {
	records = data.records;
	images = data.images;
	keywords = data.keywords;
		
	records.sort(function(a,b){
		return (a.Year > b.Year || a.Year<1) ? 1 : (a.Year < b.Year || b.Year<1) ? -1 : 0;
	});
	
	images.sort(function(a,b){
		return (a.fl < b.fl) ? -1 : (a.fl > b.fl) ? 1 : 0;
	});
	
	
	// 225,211,185,2343, 204,189,166,975, 239,239,239,302, 182,166,145,155, 161,145,127,17, 68,59,52,3
	
	/////////////////////////
	
	for (var i=records[0].Year; i<records[records.length-1].Year+1; i++) years_assoc[i] = {year:i, ImgTotal:0, Img:[], records:[], selected:0};
		
	/////////////////////////
	
	for (var i=0; i<records.length; i++) {
		for (var n=0; n<objKeys.length; n++) records[i][objKeys[n]] = eval(records[i][objKeys[n]]);
				
		records[i]["Titles"] = [{"text":JSON.stringify(records[i].Title),"link":""}];
		
		records[i]["title_length"] = 0.8 - (JSON.stringify(records[i].Title).length / 400 * 0.65);
		
		records[i]["materials"] = {t:0, i:0, o:0, m:0};
		
		records[i].showmax = 50;
		
		// Convert palette to object
		if (records[i].palette.length>0) records[i].palette = fixColours(records[i].palette);
		
		// Create 2 word title
		records[i].showtitle = makeTitle(records[i]);
				
		// Create keywords
		records[i].keywords = makeKeywords(records[i]);
		
		// get list of topics_keys from tags
		for (var n=0; n<records[i].tags.length; n++) topics_keys[records[i].tags[n].type] = records[i].tags[n].type;
		
		// Flag if record contains notes
		for (var n=0; n<notes_keys.length; n++) if (records[i][notes_keys[n]]) records[i].hasnotes = true;
		
		records_assoc["_"+records[i].priref] = records[i];
		records_assoc["_"+records[i].priref].vis = false;
		records_assoc["_"+records[i].priref].metavis = true;
		
		years_assoc[records[i].Year].ImgTotal += records[i].ImgTotal;// Total count for the year
		years_assoc[records[i].Year].Img.push(records[i].ImgTotal);// Image count of each record in the year
		years_assoc[records[i].Year].records.push(records[i].priref);// Records for the year
		
		recFilters["_"+records[i].priref] = {t:false, i:false, o:false, m:false, c:{}};
		
		// Prep image objects
		if (!img_assoc.hasOwnProperty("_"+records[i].priref)) img_assoc["_"+records[i].priref] = [];
		if (!img_vis.hasOwnProperty("_"+records[i].priref)) img_vis["_"+records[i].priref] = [];
		img_feat["_"+records[i].priref] = 0;
	}
		
	/////////////////////////
	
	for (var i=0; i<images.length; i++) {
		// Convert palette to object
		images[i].palette = fixColours(images[i].palette);
		
		// add a vis attribute
		images[i].vis = true;
		
		// Update material count for parent record
		for (var n=0; n<images[i].material.length; n++) records_assoc["_"+images[i].priref].materials[images[i].material.substr(n, 1)]++;
		
		var priref = "_"+images[i].priref;
		img_assoc[priref].push( images[i] );
				
		img_vis[priref].push(images[i]);
		
		img_fl[images[i].fl] = images[i];
	}
	
	/////////////////////////
	
	for (var i=0; i<records.length; i++) {
		var rec = records[i];
		rec.fl = 0;
		
		items.push(rec);
		
		var priref = "_"+rec.priref;
		
		items = items.concat(img_assoc[priref]);
		
		if (img_assoc[priref] && img_assoc[priref].length>0) {
					
			var n = Math.floor( Math.random() * img_assoc[priref].length );
			
			recordbg[priref] = {img:n, pos:Math.round(25+Math.random()*30)};
		}
	}
	
	/////////////////////////
	
	for (var y in years_assoc) {
		years.push(years_assoc[y]);
		yr_vis.push(years_assoc[y]);
	}
	
	for (var i=0; i<years.length; i++) {
		if (years[i].records.length<1) continue;
		
		var priref = "_"+years[i].records[ Math.floor( Math.random() * years[i].records.length ) ];
		
		if (!img_assoc[priref] || img_assoc[priref].length<1) continue;
		
		var img = img_assoc[priref][ Math.floor( Math.random() * img_assoc[priref].length ) ];
		
		featurebg["_"+years[i].year] = "http://digital.sl.nsw.gov.au/delivery/DeliveryManagerServlet?dps_func=stream&dps_pid="+img.fl;
	}
		
	/////////////////////////
	
	console.log('records');
	console.log(records);
	console.log(records_assoc);
	console.log('images');
	console.log(images);
	console.log(img_assoc);
	console.log(img_fl);
	console.log(img_feat);
	console.log('record bg');
	console.log(recordbg);
	console.log('feature bg');
	console.log(featurebg);
	console.log('items');
	console.log(items);
	console.log('years');
	console.log(years);
	console.log(years_assoc);
	console.log('keywords');
	console.log(keywords);
		
	/////////////////////////
	
			
	//$scope.items = items;
	$scope.records = records;
	$scope.records_assoc = records_assoc;
	$scope.images = images;
	$scope.img_assoc = img_assoc;
	$scope.img_fl = img_fl;
	$scope.img_vis = img_vis;
	$scope.img_feat = img_feat;
	$scope.recordbg = recordbg;
	$scope.featurebg = featurebg;
	$scope.years = years;
	$scope.yr_vis = yr_vis;
	$scope.recFilters = recFilters;
	$scope.topics_keys = topics_keys;
	$scope.keywords = keywords;
	
	console.log($scope.topics_keys);
	
	//////////////////////////
	
	
	$scope.$on('$locationChangeSuccess', function(){
		console.log('state change');
	    $scope.applyFilters();
	});
	
	
	/////////////////////////
	
	$scope.applyFilters();
	
	/////////////////////////
	// User supplied array of images
	
	if ($scope.imgset.length > 0) {
		$scope.showHero($scope.imgset);
	}
		
}

function fixColours(palette_str) {
	
	var arr = palette_str.split(",");
	var pal = [];
	var total = 0;
	for (var n=0; n<arr.length; n+=4) {
		// r, g, b, c   (c == count)
		pal.push( {r:arr[n], g:arr[n+1], b:arr[n+2], c:parseInt(arr[n+3])} );
		// get total & use to generate percentage for each swatch
		total += parseInt(arr[n+3]);
	}
	pal.sort(function(a,b){
		return (a.c < b.c) ? 1 : (a.c > b.c) ? -1 : 0;// Sort by count
		//return ( rgbToHsl(a.r, a.g, a.b) < rgbToHsl(b.r, b.g, b.b) ) ? 1 : ( rgbToHsl(a.r, a.g, a.b) > rgbToHsl(b.r, b.g, b.b) ) ? -1 : 0;
	});
	for (var n=0; n<pal.length; n++) {
		// p == percentage for each swatch
		pal[n].p = pal[n].c / total;
	}
		
	return pal;
}

function makeGlobalPalette($scope) {
	
	globalPalette = [];
	
	// First determine globalpalette set from all records
	//for (var i=0; i<records.length; i++) {
		
		//var rp = records[i].palette.slice(0);
	
	for (var y=0; y<yr_vis.length; y++) {
				
		for (var i=0; i<yr_vis[y].records.length; i++) {
			
			var priref = yr_vis[y].records[i];
			var rp = records_assoc['_'+priref].palette.slice(0);
	
			if (rp.length>0) {
				for (var c=0; c<rp.length; c++) {
					
					var p = 999;
					var n = 0;
					for (var s=0; s<globalPalette.length; s++) {
						if (prox(rp[c],globalPalette[s])<p) {
							p = prox(rp[c],globalPalette[s]);
							n = s;
						}
					}
					if (p>40) {// No match. Add colour to global palette.
						
						/* This is weird....
						rp is sliced from a record palette (see above).
						rp is a copy but its children objects are still referencing 
						the objects in the record palette !!!????
						
						So, we have to push a slice rp.slice(c,1) not a direct ref because
						rp[c] will reference and modify the original element in the record.
						
						Unfortunately, the rp.slice(c,1) slicing slows things massively :(
							
						Solution: Manually reproduce the element { r:rp[c].r, g:rp[c].g, b:rp[c].b, c:0, p:0 }
						Conveniently, it also allows us to reset c and p.
						*/
						
						var h = (rp[c].r>200 && rp[c].b>200 && rp[c].g>200) ? 1.1 : (rp[c].r<55 && rp[c].b<55 && rp[c].g<55) ? -0.1 : (rgbToHsl(rp[c].r, rp[c].g, rp[c].b).h + 0.835) % 1;
						
						globalPalette.push( { r:rp[c].r, g:rp[c].g, b:rp[c].b, c:0, p:0, h:h } );
					}
				}
			}
		
		}
	}
	
	// Next compare each globalpalette swatch to all record palettes
	for (var y=0; y<yr_vis.length; y++) {
				
		for (var i=0; i<yr_vis[y].records.length; i++) {
			
			var priref = yr_vis[y].records[i];
			var rec = records_assoc['_'+priref];
			var match_rec = {};
			
			for (var c=0; c<rec.palette.length; c++) {
				var sw_a = rec.palette[c];
				
				for (var k in globalPalette) {
					var sw_b = globalPalette[k];
					
					if (prox(sw_a, sw_b) < 100) {
						match_rec[k] = true;
					}
				}
			}
			
			for (var m in match_rec) globalPalette[m].c++;
		}
	}
	
	// get total
	var t = 0;
	for (var i=0; i<globalPalette.length; i++) t += globalPalette[i].c;
	
	// set percentage
	for (var i=0; i<globalPalette.length; i++) globalPalette[i].p = globalPalette[i].c / t;
	
	// sort by percentage
/*
	globalPalette.sort(function(a,b){
		return (a.p < b.p) ? 1 : (a.p > b.p) ? -1 : 0;
	});
*/
	
	// sort by hue
	globalPalette.sort(function(a,b){
		return (a.h < b.h) ? 1 : (a.h > b.h) ? -1 : 0;
	});
	
	console.log(globalPalette);
	
	// update scope
	$scope.globalPalette = globalPalette;
}

function prox(a,b) {
	return Math.abs(a.r-b.r) + Math.abs(a.g-b.g) + Math.abs(a.b-b.b);
}

function makeKeywords(rec) {
	
	var stopword = ["and","are","been","but","call","calld","dlmsq","etc","for","from","his","the","their","this","was","were","who","with"];
	var stopkey = {};
	for (var i=0; i<stopwords.length; i++) stopkey[stopwords[i]] = 1;
	
	var clean = rec.Title.replace(/[^a-z ]+/gi, '').toLowerCase();
	var arr = clean.split(" ");
	
	var kw = {};
	
	for (var i=0; i<arr.length; i++) {
		if (keywords[arr[i]]) kw[arr[i]] = 1;
	}
	
	arr = [];
	for (w in kw) arr.push({text:w});
	
	arr.sort(function(a,b){
		return (a.text.toLowerCase()>b.text.toLowerCase()) ? 1 : (a.text.toLowerCase()<b.text.toLowerCase()) ? -1 : 0;
	});
	
	return arr;
}


function makeTitle(rec) {
	
	var txt = rec.Title;
		
	var clean = rec.Title.replace(/[^a-z ]+/gi, '').toLowerCase();
	var t = clean.split(" ");
	
	var k = {};
	
	for (var i=0; i<t.length; i++) {
		// trim preceeding and trailing non-alpha characters
		if (t[i].substr(0, 1).match(/[^0-9a-z]/i)) t[i] = t[i].substr(1);
		if (t[i].substr(t[i].length-1, 1).match(/[^0-9a-z]/i)) t[i] = t[i].substr(0,t[i].length-1);
		
		if (stopkeys[t[i]] || t[i].length<3) continue;
		
		k["_"+t[i].toLowerCase()] = t[i].toLowerCase();
	}
	
	var arr = [];
	for (w in k) arr.push(k[w]);
	
	if (arr.length<1) return false;
	
	var nt = [];
	var n = Math.floor( Math.random() * (arr.length*0.75-1) );
	nt.push(arr[n]);
	
	if (arr.length>1) nt.push( arr[ Math.floor( Math.random() * (arr.length-1-n) ) + n + 1 ] );
	
	return nt;
}


// `rgbToHsl`
// Converts an RGB color value to HSL.
// *Assumes:* r, g, and b are contained in [0, 255]
// *Returns:* { h, s, l } in [0,1]
function rgbToHsl(r, g, b) {

    r = (r%255)/255;
    g = (g%255)/255;
    b = (b%255)/255;

    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;

    if(max == min) {
        h = s = 0; // achromatic
    }
    else {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }

        h /= 6;
    }

    return { h: h, s: s, l: l };
}

