import React from 'react';
import * as am4core from "@amcharts/amcharts4/core";
import * as am4maps from "@amcharts/amcharts4/maps";
import am4geodata_worldLow from "@amcharts/amcharts4-geodata/worldLow";
// import am4themes_animated from "@amcharts/amcharts4/themes/animated";
import { imageZoneLarge, imageZoneMobile, largeLine, mobileLine, imageLargeLabel, imageMobileLabel, sortId, longId, zoneName} from './mapData';
import './App.css';
import io from 'socket.io-client';

const socket = io('http://172.105.161.104:4000');
class Fan extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      isMobile: false,
      width: 0,
      height: 0,
      ids: [],
      imageData: [],
      lineData: [],
    }
    this.updateDimension = this.updateDimensions.bind(this);
    // this.default = {};
  }
  componentDidMount() {
    // this.updateDimensions();
    // const path = window.location.href.split("/");
    let isMobile = window.innerWidth > 700 ? false : true;
    let width =  isMobile ? window.innerWidth : window.innerWidth*0.6;
    let height = isMobile ? 350 : window.innerHeight*0.6;
    let ids = [];
    let imageData = [];
    let lineData = [];
    let defaultData = {};
    let chart = am4core.create("chartdiv", am4maps.MapChart);
    let labelSeries = chart.series.push(new am4maps.MapImageSeries());
    let polygonSeries = chart.series.push(new am4maps.MapPolygonSeries());
    let imageSeries = chart.series.push(new am4maps.MapImageSeries());
    let lineSeries = chart.series.push(new am4maps.MapLineSeries());
    //create map
      chart.seriesContainer.draggable = false;
      chart.seriesContainer.resizable = false;
      chart.maxZoomLevel =1;
      // Set map definition
      chart.geodata = am4geodata_worldLow;

      // Set projection
      chart.projection = new am4maps.projections.Miller();

      // Exclude Antartica
      polygonSeries.exclude = ["AQ"];

      // Make map load polygon (like country names) data from GeoJSON
      polygonSeries.useGeodata = true;
      let polygonTemplate = polygonSeries.mapPolygons.template;
      polygonTemplate.fill = am4core.color("#1B3656");
      polygonTemplate.stroke = am4core.color("#2EB2C4");

     
      let labelTemplate = labelSeries.mapImages.template.createChild(am4core.Label);
      labelTemplate.horizontalCenter = "middle";
      labelTemplate.verticalCenter = "middle";
      labelTemplate.interactionsEnabled = false;
      labelTemplate.nonScaling = true;
      labelTemplate.background.fill = am4core.color("rgba(0, 0, 0, 0.6)");
      labelTemplate.background.fillOpacity = 0.2;

      imageSeries.mapImages.template.propertyFields.longitude = "longitude";
      imageSeries.mapImages.template.propertyFields.latitude = "latitude";
      imageSeries.mapImages.template.propertyFields.id = "id";
      imageSeries.mapImages.template.propertyFields.value = "value";

      lineSeries.mapLines.template.zIndex = 10;
      lineSeries.mapLines.template.strokeWidth = 1.5;
      lineSeries.mapLines.template.stroke = am4core.color("#37EDF9");
      imageSeries.data = imageData;
      lineSeries.data = lineData;

      socket.emit('client-join-room',537);
      socket.on('send-data-number-of-fan-web', res => {
        if(JSON.stringify(defaultData) !== JSON.stringify(res)) {
          imageSeries.data = [];
          lineSeries.data = [];
          ids = [];
          defaultData = res;
          let total = getTotal(res);
          for(let [key, objValue] of Object.entries(res)){
            console.log(zoneName.indexOf(key)); 
            if (zoneName.indexOf(key) !== -1) {
              let item = {
                id: key,
                value:!isMobile ? objValue : getValue(key, res)
              };
              ids.push(item); 
            }
          }
          imageData = getImageData(isMobile, res, total);
          if (total) {
            ids.push({id: "ALL", value: total});
  
          }
          imageSeries.addData(imageData);
          lineData = getLineData(isMobile, res);
          if(lineSeries.data && lineSeries.data.length) {

          } else{
            lineSeries.addData(lineData);
          }
          chart.validateData();
        }

      });
    
      chart.events.on( "ready", updateCustomMarkers );
      chart.events.on( "dataitemsvalidated", updateCustomMarkers );
  // Add line series
    
  //   add events to recalculate map position when the map is moved or zoomed
   
    // this function will take current images on the map and create HTML elements for them
    function updateCustomMarkers( event ) {
          for(let i = 0; i < ids.length; i++){
            let imageI = imageSeries.getImageById(ids[i].id);
            let sortId = getSortId(ids[i].id);
            let labelI = document.getElementById(sortId);
            let text = renderLabelText(ids[i].value);
            let margin = getValueMargin(text.length);
            if(imageI && !labelI){
              let label = document.createElement('div');
              label.id = getSortId(ids[i].id);
              let xy = chart.geoPointToSVG( { longitude: imageI.longitude, latitude: imageI.latitude } ); 
              label.style.top =  (xy.y - (isMobile? 20: 0))  + 'px';
              label.style.left = (xy.x - margin)  + 'px';
              label.textContent = text;
              label.style.color = "white";
              label.style.fontSize = !isMobile ?  "30px" : "20px";
              label.style.fontWeight = 500;
              label.style.zIndex = 10;
              label.style.position = "absolute";
              label.style.background = "rgba(0, 0, 0, 0.6)";
              label.style.padding = "0px 12px 0 12px";
              label.style.borderRadius = "6px";
              chart.svgContainer.htmlElement.appendChild(label);
              imageI.dummyData={externalElement: label};
            } else if (imageI && labelI) {
              let xy = chart.geoPointToSVG( { longitude: imageI.longitude, latitude: imageI.latitude } ); 
              labelI.textContent = renderLabelText(ids[i].value);

              labelI.style.left = (xy.x - margin)  + 'px';
            }
          }
          for(let i =0; i< imageData.length ; i++) {
            let image = imageData[i];
            if(image && image.value) {
              let longId = getLongId(image.title);
              //get style
              let imageI = document.getElementById(longId);
              let circleStyleI = getStyleI(image.value);
              let circleStyleII = getStyleII(image.value);
              let circleStyleIII = getStyleIII(image.value);
              let circleStyleIV = getStyleIV(image.value);
              if(!imageI) {
                let xy = chart.geoPointToSVG( { longitude: image.longitude, latitude: image.latitude } );
                let imageContainer = document.createElement('div');
                imageContainer.id = longId;
                imageContainer.className = "map-marker";
                imageContainer.style.position = 'absolute';
                imageContainer.style.top = (xy.y) + 'px';
                imageContainer.style.left = xy.x + 'px';             
                //create element

                let circleI = document.createElement('div');
                circleI.className = "circle-1";
                circleI.style.position = 'absolute';
                circleI.style.width = circleStyleI.widthI;
                circleI.style.height = circleStyleI.heightI;
                circleI.style.top = circleStyleI.topI;
                circleI.style.left = circleStyleI.leftI;
                circleI.style.background = "rgba(255, 255, 255, 0.2)";
                circleI.style.borderRadius = "50%";
                circleI.style.border = "1px solid #B5F5FC";
                circleI.style.boxShadow = "0px 0px 27.6805px #28E4D9";
                

                let circleII = document.createElement('div');
                circleII.className = "circle-2";
                circleII.style.position = 'absolute';
                circleII.style.width = circleStyleII.widthII;
                circleII.style.height = circleStyleII.heightII;
                circleII.style.top = circleStyleII.topII;
                circleII.style.left = circleStyleII.leftII;
                circleII.style.borderRadius = "50%";
                circleII.style.border = "1px solid #0BFFF0";

                let circleIII = document.createElement('div');
                circleIII.className = "circle-3";
                circleIII.style.position = 'absolute';
                circleIII.style.width = circleStyleIII.widthIII;
                circleIII.style.height = circleStyleIII.heightIII;
                circleIII.style.top = circleStyleIII.topIII;
                circleIII.style.left = circleStyleIII.leftIII;
                circleIII.style.background =  "rgba(255, 255, 255, 0.8)";
                circleIII.style.boxShadow = "0px 0px 27.6805px #28E4D9";
                circleIII.style.borderRadius = "50%";
                
                let circleIV = document.createElement('div');
                circleIV.className = "circle-4";
                circleIV.style.position = 'absolute';
                circleIV.style.width = circleStyleIV.widthIV;
                circleIV.style.height = circleStyleIV.heightIV;
                circleIV.style.top = circleStyleIV.topIV;
                circleIV.style.left = circleStyleIV.leftIV;
                circleIV.style.background =  "rgba(255, 255, 255, 0.8)";
                circleIV.style.boxShadow = "0px 0px 27.6805px #28E4D9";
                circleIV.style.borderRadius = "50%";
                circleIV.style.zIndex = 4;


                imageContainer.appendChild(circleI);
                imageContainer.appendChild(circleII);
                imageContainer.appendChild(circleIII);
                imageContainer.appendChild(circleIV);

                image.dummyData={externalElement: imageContainer};
                chart.svgContainer.htmlElement.appendChild(imageContainer);   
              } else {
                let circle_1 = imageI.getElementsByClassName("circle-1")[0];
                let circle_2 = imageI.getElementsByClassName("circle-2")[0];
                let circle_3 = imageI.getElementsByClassName("circle-3")[0];
                let circle_4 = imageI.getElementsByClassName("circle-4")[0];
                if(circle_1 && circle_2 && circle_3 && circle_4) {
                  circle_1.style.width = circleStyleI.widthI;
                  circle_1.style.height = circleStyleI.heightI;
                  circle_1.style.top = circleStyleI.topI;
                  circle_1.style.left = circleStyleI.leftI;
                  
                  
                  circle_2.style.width = circleStyleII.widthII;
                  circle_2.style.height = circleStyleII.heightII;
                  circle_2.style.top = circleStyleII.topII;
                  circle_2.style.left = circleStyleII.leftII;
  
                  
                  circle_3.style.width = circleStyleIII.widthIII;
                  circle_3.style.height = circleStyleIII.heightIII;
                  circle_3.style.top = circleStyleIII.topIII;
                  circle_3.style.left = circleStyleIII.leftIII;
  
                  
                  circle_4.style.width = circleStyleIV.widthIV;
                  circle_4.style.height = circleStyleIV.heightIV;
                  circle_4.style.top = circleStyleIV.topIV;
                  circle_4.style.left = circleStyleIV.leftIV;
                }
              
              }
            }
          }
    }
  // this function creates and returns a new marker element
    function renderLabelText(number) {
      let total = number > 1000 ? Math.floor(number/1000): number;
      return `${(total>999 && number > 1000) ?Math.floor(total/1000) : total}${(number > 1000 ? (total>999 ? "M": "K"): "")}`;
    }
    function getValue(key, res){
      let value = 0;
      if(key === "Europe"){
          value = res[key] + res["Russia"];
      }else if (key === "China") {
          value = res[key] + res["India"];
      } else {
          value = res[key];
      }
      return value;
    }
    function getTotal(res){
      let total = 0;
      for(let [key, objValue] of Object.entries(res)){
          if (key!== "eventId" && key!== "sessionId") {                    
              total = total + objValue;
          }
      }
      return total;
    }
    function getImageData(isMobile, res, total) {
      let imageData = [];
      if (!isMobile) {
          imageData = imageZoneLarge.map(e => {
              if(e.value){
              e.value = res[e.title];
              return e;
              }
          });
          imageLargeLabel.map(e => {
              if (res[e.id]) {
              imageData.push(e);
              }
          });
        if (total) {
          imageData.push(imageLargeLabel.find(e => e.id === "ALL"));
        }
      } else {
        imageData = imageZoneMobile.map(e => {
          if(e.value){
  
            e.value = (e.title !== "Europe" && e.title !== "China") ? res[e.title] : (e.title === "Europe" ? res[e.title] + res["Russia"] : res[e.title] + res["India"] );
          }
          return e;
        });
        imageMobileLabel.map(e => {
          if (res[e.id]) {
          imageData.push(e);
          }
      });
        if (total) {
          imageData.push(imageMobileLabel.find(e => e.id === "ALL"));
        }
      }
      return imageData;
    }
    function getLineData(isMobile, res){
      let lineData = [];
      let result = [];
      if(!isMobile) {
        for( let [key, objValue] of Object.entries(largeLine)) {
          if(res[key]){
            lineData.push(objValue);
          }
        }
        if(lineData.length){
          result = [
            {
              "multiGeoLine":[
                ...lineData
              ]
            }
          ]
        }
      } else {
        for( let [key, objValue] of Object.entries(mobileLine)) {
          if(res[key]){
            lineData.push(objValue);
          }
        }
        if(lineData.length){
          result = [
            {
              "multiGeoLine":[
                ...lineData
              ]
            }
          ]
        }
      }
      return result;
    }
    function getSortId(id){
      let Id = "";
      Id = sortId[id];
      return Id;
    }
    function getLongId(id){
      let Id = "";
      Id = longId[id];
      return Id;
    }
    function getStyleI(value){

      let widthI = 0;
      let heightI = 0;
      let topI = 0;
      let leftI = 0;
      if(value >= 90) {
        widthI = `${width*0.1}px`;
        heightI = `${height*0.1}px`;
        topI = `${height*(-0.005)}px`;
        leftI = `${width*(-0.01)}px`;  
      } else if (value >=70) {
        widthI = `${width*0.06}px`;
        heightI = `${height*0.06}px`;
        topI = `${height*(0.005)}px`;
        leftI = `${width*(0.01)}px`;
      } else if(value >= 30) {
        widthI = `${width*0.05}px`;
        heightI = `${height*0.05}px`;
        topI = `${height*(0.005)}px`;
        leftI = `${width*(0.015)}px`;
      }else {
        widthI = `${width*0.03}px`;
        heightI = `${height*0.031}px`;
        topI = !isMobile ? `${height*(0.02125)}px` :  `${350*(0.02)}px`;
        leftI = `${width*(0.0245)}px`;
      }
      return {widthI, heightI, topI, leftI};
    }

    function getStyleII(value) {
      let widthII = 0;
      let heightII = 0;
      let topII = 0;
      let leftII = 0;
      if(value >= 90) {
        widthII = `${width*0.09}px`;
        heightII = `${height*0.09}px`;
        // topII = `${window.innerHeight*(-0.0025)}px`;
        leftII = `${width*(-0.005)}px`;
      } else if (value >=70) {
        widthII = `${width*0.05}px`;
        heightII = `${height*0.05}px`;
        topII = `${height*(0.01)}px`;
        leftII = `${width*(0.015)}px`;
      } else if(value >= 30) {
        widthII = `${width*0.04}px`;
        heightII = `${height*0.04}px`;
        topII = `${height*(0.01)}px`;
        leftII = !isMobile ? `${width*(0.0205)}px` : `${width*(0.02)}px` ;
      }else {
        widthII = `${width*0.02}px`;
        heightII = `${height*0.02}px`;
        topII = !isMobile ? `${height*(0.02625)}px` :`${350*(0.025)}px` ;
        leftII = !isMobile ? `${width*(0.02925)}px`: `${width*(0.029)}px`;
      }
      return {widthII, heightII, topII, leftII};
    }

    function getStyleIII(value){
      let widthIII = 0;
      let heightIII = 0;
      let topIII = 0;
      let leftIII = 0;
      if(value >= 90) {
        widthIII = `${width*0.08}px`;
        heightIII = `${height*0.08}px`;
        topIII = !isMobile ?  `${height*(0.005)}px` : `${350*(0.00525)}px` ;
        leftIII = !isMobile ? `${width*(0.00125/2)}px`: `${width*(0.00125)}px`;  
      } else if (value >=70) {
        widthIII = `${width*0.04}px`;
        heightIII = `${height*0.04}px`;
        topIII = `${height*(0.0165)}px`;
        leftIII = `${width*(0.02125)}px`;
      } else if(value >= 30) {
        widthIII = `${width*0.03}px`;
        heightIII = `${height*0.03}px`;
        topIII = `${height*(0.0165)}px`;
        leftIII = `${width*(0.02625)}px`;
      }else {
        widthIII = `${width*0.01}px`;
        heightIII = `${height*0.01}px`;
        topIII = `${height*(0.0325)}px`;
        leftIII = `${width*(0.035)}px`;
      }
      return {widthIII, heightIII, topIII, leftIII};
    }

    function getStyleIV(value) {
      let widthIV = 0;
      let heightIV = 0;
      let topIV = 0;
      let leftIV = 0;
      if(value >= 90) {
        widthIV = `${width*0.07}px`;
        heightIV = `${height*0.07}px`;
        topIV = `${height*(0.01)}px`;
        leftIV = `${width*(0.0055)}px`;
      } else if (value >=70) {
        widthIV = `${width*0.03}px`;
        heightIV = `${height*0.03}px`;
        topIV = `${height*(0.0215)}px`;
        leftIV = `${width*(0.0265)}px`;
      } else if(value >= 30) {
        widthIV = `${width*0.02}px`;
        heightIV = `${height*0.02}px`;
        topIV = `${height*(0.0215)}px`;
        leftIV = `${width*(0.0315)}px`;
      }else {
        widthIV = `${width*0.005}px`;
        heightIV = `${height*0.005}px`;
        topIV = `${height*(0.035)}px`;
        leftIV = `${width*(0.0375)}px`;
      }
      return {widthIV, heightIV, topIV, leftIV};
    }
    function getValueMargin(value) {
      let result = 0;
      if(value >3) {
        result = 6;
      }else if (value > 2) {
        result = 10;
      } 
      return result;
    }
    // window.addEventListener("resize", this.updateDimension);
  }
    
  componentWillUnmount() {
    if (this.chart) {
      this.chart.dispose();
    }
    // window.removeEventListener("resize", this.updateDimension);
  }
  
  updateDimensions() {
    let isMobile = window.innerWidth > 700 ? false : true;
    this.setState({
      isMobile,
      width: isMobile ? window.innerWidth : window.innerWidth*0.6,
      height: isMobile ?  350 : window.innerHeight*0.6
    }, () => {
      this.initChart();
    })
  }  
  initChart() {
    const {isMobile, width, height, ids, imageData, lineData } = this.state;
    let chart = am4core.create("chartdiv", am4maps.MapChart);
    chart.seriesContainer.draggable = false;
    chart.seriesContainer.resizable = false;  
    // Set map definition
    chart.geodata = am4geodata_worldLow;

    // Set projection
    chart.projection = new am4maps.projections.Miller();

    // Create map polygon series
    let polygonSeries = chart.series.push(new am4maps.MapPolygonSeries());

    // Exclude Antartica
    polygonSeries.exclude = ["AQ"];
    // polygonSeries.
    polygonSeries.opacity = 0;

    // Make map load polygon (like country names) data from GeoJSON
    polygonSeries.useGeodata = true;

    // Configure series
    let polygonTemplate = polygonSeries.mapPolygons.template;
    // polygonTemplate.tooltipText = "{name}";
    // polygonTemplate.opacity = 0;
    // polygonTemplate.background = "rgba(55, 237, 249, 0.1)";
    polygonTemplate.fill = am4core.color("#1B3656");
    polygonTemplate.stroke = am4core.color("#2EB2C4");
    // console.log(polygonTemplate);
    // polygonTemplate.fill = chart.colors.getIndex(0).lighten(1);

    // Create hover state and set alternative fill color
    // var hs = polygonTemplate.states.create("hover");
    // hs.properties.fill = am4core.color("rgba(55, 237, 249, 0.1)");

    // Configure label series
    let labelSeries = chart.series.push(new am4maps.MapImageSeries());
    let labelTemplate = labelSeries.mapImages.template.createChild(am4core.Label);
    labelTemplate.horizontalCenter = "middle";
    labelTemplate.verticalCenter = "middle";
    labelTemplate.interactionsEnabled = false;
    labelTemplate.nonScaling = true;
    labelTemplate.background.fill = am4core.color("rgba(0, 0, 0, 0.6)");
    labelTemplate.background.fillOpacity = 0.2;
    // labelTemplate.label.background.cornerRadius(5, 5, 5, 5);

    // Add image series
    let imageSeries = chart.series.push(new am4maps.MapImageSeries());
    imageSeries.mapImages.template.propertyFields.longitude = "longitude";
    imageSeries.mapImages.template.propertyFields.latitude = "latitude";
    imageSeries.mapImages.template.propertyFields.id = "id";
    imageSeries.mapImages.template.propertyFields.value = "value";
    // var imageSeriesTemplate = imageSeries.mapImages.template;
    // var circle = imageSeriesTemplate.createChild(am4core.Circle);
    // circle.radius = 4;
    // circle.zIndex = 20;
    // circle.fill = am4core.color("#B27799");
    // circle.stroke = am4core.color("#FFFFFF");
    // circle.strokeWidth = 2;
    // circle.nonScaling = true;
    // circle.tooltipText = "{title}";
    imageSeries.data = imageData;
  // Add line series
    let lineSeries = chart.series.push(new am4maps.MapLineSeries());
    lineSeries.mapLines.template.zIndex = 10;
    lineSeries.mapLines.template.strokeWidth = isMobile ? 2 : 1.5;
    lineSeries.mapLines.template.stroke = am4core.color("#37EDF9");
    // let ids = !isMobile ? [
    //   {id: "NAZ", value: 1000000},{id: "SAZ", value: 10000},
    //   {id: "EUZ", value: 2000000},{id: "RUZ", value: 10000},
    //   {id: "CNZ", value: 5000000},{id: "AFZ", value: 100000},
    //   {id: "INZ", value: 1000},{id: "OCZ", value: 9999}, {id: "ALL", value: 8040998}] :[
    //     {id: "NAZ", value: 1000000},
    //     {id: "SAZ", value: 10000},
    //     {id: "EUZ", value: 2010000},
    //     {id: "CNZ", value: 5001000},
    //     {id: "AFZ", value: 100000},
    //     {id: "OCZ", value: 9999}, {id: "ALL", value: 8040998}
    //   ];
    lineSeries.data = lineData;
    // lineSeries.mapLines.template.precision = 1000;
    // add events to recalculate map position when the map is moved or zoomed
    chart.events.on( "ready", updateCustomMarkers );
    chart.events.on( "mappositionchanged", updateCustomMarkers );

    // this function will take current images on the map and create HTML elements for them
    function updateCustomMarkers( event ) {
      for(let i = 0; i < ids.length; i++){
        let imageI = imageSeries.getImageById(ids[i].id);
        if(imageI){
          let label = labelSeries.mapImages.create();
          let state = ids[i].value;
          label.latitude = imageI.latitude;
          label.longitude = imageI.longitude;
          label.children.getIndex(0).text = ids[i].id === "ALL" ? `${renderLabelText(state)}` : renderLabelText(state);
          label.children.getIndex(0).fontSize = !isMobile ? (ids[i].id === "ALL" ? 30 : 20) : (ids[i].id === "ALL" ? 20 : 10) ;
          label.children.getIndex(0).fill = ids[i].id === "ALL" ? am4core.color("#FFFFFF") : am4core.color("#37EDF9");
          label.children.getIndex(0).fontWeight =  ids[i].id === "ALL" ? 600 : 500;
          label.children.getIndex(0).padding(0,12,0,12);
          
        }
      }
      // go through all of the images
      imageSeries.mapImages.each(function(image) {
        // check if it has corresponding HTML element
        if (image.value && (!image.dummyData || !image.dummyData.externalElement)) {
          // create onex
          image.dummyData = {
            externalElement: createCustomMarker(image)
          };

        }
        let xy = chart.geoPointToSVG( { longitude: image.longitude, latitude: image.latitude } );
        if( image.dummyData && image.dummyData.externalElement) {
          image.dummyData.externalElement.style.top = xy.y  + 'px';
          image.dummyData.externalElement.style.left = xy.x + 'px';
        }
        // reposition the element accoridng to coordinates
      });
    }

  // this function creates and returns a new marker element
    function createCustomMarker( image ) {
      
      let chart = image.dataItem.component.chart;

      // create holder
      let holder = document.createElement( 'div' );
      holder.className = 'map-marker';
      holder.title = image.dataItem.dataContext.title;
      holder.style.position = 'absolute';
      // create dot
      let dot4 = document.createElement( 'div' );
      let dot3 = document.createElement( 'div' );
      let dot2 = document.createElement( 'div' );
      let dot = document.createElement( 'div' );
      if(image.value >= 5){
        
        dot4.className = 'dot4';
        dot4.style.width = `${width*0.1}px`;
        dot4.style.height = `${height*0.1}px`;
        dot4.style.marginTop = `${height*(-0.005)}px`;
        dot4.style.marginLeft = `${width*(-0.01)}px`;
        holder.appendChild( dot4 );
        // create dot

        dot3.className = 'dot3';
        dot3.style.width = `${width*0.09}px`;
        dot3.style.height = `${height*0.09}px`;
        // dot3.style.marginTop = `${window.innerHeight*(-0.0025)}px`;
        dot3.style.marginLeft = `${width*(-0.005)}px`;
        holder.appendChild( dot3 );
        // create dot

        dot2.className = 'dot2';
        dot2.style.width = `${width*0.08}px`;
        dot2.style.height = `${height*0.08}px`;
        dot2.style.marginTop = !isMobile ?  `${height*(0.005)}px` : `${350*(0.00525)}px` ;
        dot2.style.marginLeft = !isMobile ? `${width*(0.00125/2)}px`: `${width*(0.00125)}px`;
        holder.appendChild( dot2 );
        // create dot

        dot.className = 'dot';
        dot.style.width = `${width*0.07}px`;
        dot.style.height = `${height*0.07}px`;
        dot.style.marginTop = `${height*(0.01)}px`;
        dot.style.marginLeft = `${width*(0.0055)}px`;
        holder.appendChild( dot );
      } else if (image.value >= 4) {
        dot4.className = 'dot4';
        dot4.style.width = `${width*0.06}px`;
        dot4.style.height = `${height*0.06}px`;
        dot4.style.marginTop = `${height*(0.005)}px`;
        dot4.style.marginLeft = `${width*(0.01)}px`;
        holder.appendChild( dot4 );

        dot3.className = 'dot3';
        dot3.style.width = `${width*0.05}px`;
        dot3.style.height = `${height*0.05}px`;
        dot3.style.marginTop = `${height*(0.01)}px`;
        dot3.style.marginLeft = `${width*(0.015)}px`;
        holder.appendChild( dot3 );
        // create dot

        dot2.className = 'dot2';
        dot2.style.width = `${width*0.04}px`;
        dot2.style.height = `${height*0.04}px`;
        dot2.style.marginTop = `${height*(0.0165)}px`;
        dot2.style.marginLeft = `${width*(0.02125)}px`;
        holder.appendChild( dot2 );
        // create dot

        dot.className = 'dot';
        dot.style.width = `${width*0.03}px`;
        dot.style.height = `${height*0.03}px`;
        dot.style.marginTop = `${height*(0.0215)}px`;
        dot.style.marginLeft = `${width*(0.0265)}px`;
        holder.appendChild( dot );
      } else if (image.value >= 2){
        dot4.className = 'dot4';
        dot4.style.width = `${width*0.05}px`;
        dot4.style.height = `${height*0.05}px`;
        dot4.style.marginTop = `${height*(0.005)}px`;
        dot4.style.marginLeft = `${width*(0.015)}px`;
        holder.appendChild( dot4 );

        dot3.className = 'dot3';
        dot3.style.width = `${width*0.04}px`;
        dot3.style.height = `${height*0.04}px`;
        dot3.style.marginTop = `${height*(0.01)}px`;
        dot3.style.marginLeft = !isMobile ? `${width*(0.0205)}px` : `${width*(0.02)}px` ;

        holder.appendChild( dot3 );
        // create dot

        dot2.className = 'dot2';
        dot2.style.width = `${width*0.03}px`;
        dot2.style.height = `${height*0.03}px`;
        dot2.style.marginTop = `${height*(0.0165)}px`;
        dot2.style.marginLeft = `${width*(0.02625)}px`;
        holder.appendChild( dot2 );
        // create dot

        dot.className = 'dot';
        dot.style.width = `${width*0.02}px`;
        dot.style.height = `${height*0.02}px`;
        dot.style.marginTop = `${height*(0.0215)}px`;
        dot.style.marginLeft = `${width*(0.0315)}px`;
        holder.appendChild( dot );
      } else {
        dot4.className = 'dot4';
        dot4.style.width = `${width*0.03}px`;
        dot4.style.height = `${height*0.031}px`;
        dot4.style.marginTop = !isMobile ? `${height*(0.02125)}px` :  `${350*(0.02)}px`;
        dot4.style.marginLeft = `${width*(0.0245)}px`;
        holder.appendChild( dot4 );
        dot3.className = 'dot3';
        dot3.style.width = `${width*0.02}px`;
        dot3.style.height = `${height*0.02}px`;
        dot3.style.marginTop = !isMobile ? `${height*(0.02625)}px` :`${350*(0.025)}px` ;
        dot3.style.marginLeft = !isMobile ? `${width*(0.02925)}px`: `${width*(0.029)}px`;
        holder.appendChild( dot3 );

        dot2.className = 'dot2';
        dot2.style.width = `${width*0.01}px`;
        dot2.style.height = `${height*0.01}px`;
        dot2.style.marginTop = `${height*(0.0325)}px`;
        dot2.style.marginLeft = `${width*(0.035)}px`;
        holder.appendChild( dot2 );
        // create dot
        dot.className = 'dot';
        dot.style.width = `${width*0.005}px`;
        dot.style.height = `${height*0.005}px`;
        dot.style.marginTop = `${height*(0.035)}px`;
        dot.style.marginLeft = `${width*(0.0375)}px`;
        holder.appendChild( dot );
      }
     

      // create pulse
      // var pulse = document.createElement( 'div' );
      // pulse.className = 'pulse';
      // holder.appendChild( pulse );

      // append the marker to the map container
      chart.svgContainer.htmlElement.appendChild( holder );

      return holder;
    }

    function renderLabelText(number) {
      let total = number > 1000 ? Math.floor(number/1000): number;
      return `${(total>999 && number > 1000) ?Math.floor(total/1000) : total}${(number > 1000 ? (total>999 ? "M": "K"): "")}`;
    }

    // function convertNumberToStringFormat (number) {
    //   let values = number.toFixed(2).toString().split('.');
    //   return values[0].replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,") + (values.length === 2 && parseInt(values[1])  ? '.' + values[1] : '');
    // }
  }


  render() {
    const { isMobile } = this.state;
    return (
        <div id="chartdiv" style={{ width: window.innerWidth, height: window.innerHeight}}>
        </div>

    );
  }
}

export default Fan;
