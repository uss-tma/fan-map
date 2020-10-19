import React from 'react';
import * as am4core from "@amcharts/amcharts4/core";
import * as am4maps from "@amcharts/amcharts4/maps";
import am4geodata_worldLow from "@amcharts/amcharts4-geodata/worldLow";
// import am4themes_animated from "@amcharts/amcharts4/themes/animated";
import { imageZoneLarge, imageZoneMobile, largeLine, mobileLine} from './mapData';
import './App.css';
import Fan from './Fan';
class App extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      isMobile: false,
      width: 0
    };
    this.updateDimension = this.updateDimensions.bind(this);
  }
    componentDidMount() {
      let isMobile = window.innerWidth > 700 ? false : true;
      this.setState({
        isMobile,
        width: window.innerWidth*0.6
      });
    //   this.updateDimensions();
    //   window.addEventListener("resize", this.updateDimension);
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
      isMobile
    }, () => {
      this.initChart();
    })
  }  
  initChart() {
    const {isMobile, width } = this.state;
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
    // polygonSeries.opacity = 0;

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
    imageSeries.data = isMobile ? imageZoneMobile : imageZoneLarge;
  // Add line series
    let lineSeries = chart.series.push(new am4maps.MapLineSeries());
    lineSeries.mapLines.template.zIndex = 10;
    lineSeries.mapLines.template.strokeWidth = isMobile ? 2 : 1.5;
    lineSeries.mapLines.template.stroke = am4core.color("#37EDF9");
    let ids = !isMobile ? [
      {id: "NAZ", value: 1000000},{id: "SAZ", value: 10000},
      {id: "EUZ", value: 2000000},{id: "RUZ", value: 10000},
      {id: "CNZ", value: 5000000},{id: "AFZ", value: 100000},
      {id: "INZ", value: 1000},{id: "OCZ", value: 9999}, {id: "ALL", value: 8040998}] :[
        {id: "NAZ", value: 1000000},
        {id: "SAZ", value: 10000},
        {id: "EUZ", value: 2010000},
        {id: "CNZ", value: 5001000},
        {id: "AFZ", value: 100000},
        {id: "OCZ", value: 9999}, {id: "ALL", value: 8040998}
      ];
    lineSeries.data = isMobile ? mobileLine : largeLine;
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
      if(image.value >= 5000000){
        
        dot4.className = 'dot4';
        dot4.style.width = `${width*0.1}px`;
        dot4.style.height = `${(!isMobile ? window.innerHeight : 350)*0.1}px`;
        dot4.style.marginTop = `${(!isMobile ? window.innerHeight : 350)*(-0.005)}px`;
        dot4.style.marginLeft = `${width*(-0.01)}px`;
        holder.appendChild( dot4 );
        // create dot

        dot3.className = 'dot3';
        dot3.style.width = `${width*0.09}px`;
        dot3.style.height = `${(!isMobile ? window.innerHeight : 350)*0.09}px`;
        // dot3.style.marginTop = `${window.innerHeight*(-0.0025)}px`;
        dot3.style.marginLeft = `${width*(-0.005)}px`;
        holder.appendChild( dot3 );
        // create dot

        dot2.className = 'dot2';
        dot2.style.width = `${width*0.08}px`;
        dot2.style.height = `${(!isMobile ? window.innerHeight : 350)*0.08}px`;
        dot2.style.marginTop = !isMobile ?  `${window.innerHeight*(0.005)}px` : `${350*(0.00525)}px` ;
        dot2.style.marginLeft = !isMobile ? `${width*(0.00125/2)}px`: `${width*(0.00125)}px`;
        holder.appendChild( dot2 );
        // create dot

        dot.className = 'dot';
        dot.style.width = `${width*0.07}px`;
        dot.style.height = `${(!isMobile ? window.innerHeight : 350)*0.07}px`;
        dot.style.marginTop = `${(!isMobile ? window.innerHeight : 350)*(0.01)}px`;
        dot.style.marginLeft = `${width*(0.0055)}px`;
        holder.appendChild( dot );
      } else if (image.value >= 1000000) {
        dot4.className = 'dot4';
        dot4.style.width = `${width*0.06}px`;
        dot4.style.height = `${(!isMobile ? window.innerHeight : 350)*0.06}px`;
        dot4.style.marginTop = `${(!isMobile ? window.innerHeight : 350)*(0.005)}px`;
        dot4.style.marginLeft = `${width*(0.01)}px`;
        holder.appendChild( dot4 );

        dot3.className = 'dot3';
        dot3.style.width = `${width*0.05}px`;
        dot3.style.height = `${(!isMobile ? window.innerHeight : 350)*0.05}px`;
        dot3.style.marginTop = `${(!isMobile ? window.innerHeight : 350)*(0.01)}px`;
        dot3.style.marginLeft = `${width*(0.015)}px`;
        holder.appendChild( dot3 );
        // create dot

        dot2.className = 'dot2';
        dot2.style.width = `${width*0.04}px`;
        dot2.style.height = `${(!isMobile ? window.innerHeight : 350)*0.04}px`;
        dot2.style.marginTop = `${(!isMobile ? window.innerHeight : 350)*(0.0165)}px`;
        dot2.style.marginLeft = `${width*(0.02125)}px`;
        holder.appendChild( dot2 );
        // create dot

        dot.className = 'dot';
        dot.style.width = `${width*0.03}px`;
        dot.style.height = `${(!isMobile ? window.innerHeight : 350)*0.03}px`;
        dot.style.marginTop = `${(!isMobile ? window.innerHeight : 350)*(0.0215)}px`;
        dot.style.marginLeft = `${width*(0.0265)}px`;
        holder.appendChild( dot );
      } else if (image.value >= 100000){
        dot4.className = 'dot4';
        dot4.style.width = `${width*0.05}px`;
        dot4.style.height = `${(!isMobile ? window.innerHeight : 350)*0.05}px`;
        dot4.style.marginTop = `${(!isMobile ? window.innerHeight : 350)*(0.005)}px`;
        dot4.style.marginLeft = `${width*(0.015)}px`;
        holder.appendChild( dot4 );

        dot3.className = 'dot3';
        dot3.style.width = `${width*0.04}px`;
        dot3.style.height = `${(!isMobile ? window.innerHeight : 350)*0.04}px`;
        dot3.style.marginTop = `${(!isMobile ? window.innerHeight : 350)*(0.01)}px`;
        dot3.style.marginLeft = !isMobile ? `${width*(0.0205)}px` : `${width*(0.02)}px` ;

        holder.appendChild( dot3 );
        // create dot

        dot2.className = 'dot2';
        dot2.style.width = `${width*0.03}px`;
        dot2.style.height = `${(!isMobile ? window.innerHeight : 350)*0.03}px`;
        dot2.style.marginTop = `${(!isMobile ? window.innerHeight : 350)*(0.0165)}px`;
        dot2.style.marginLeft = `${width*(0.02625)}px`;
        holder.appendChild( dot2 );
        // create dot

        dot.className = 'dot';
        dot.style.width = `${width*0.02}px`;
        dot.style.height = `${(!isMobile ? window.innerHeight : 350)*0.02}px`;
        dot.style.marginTop = `${(!isMobile ? window.innerHeight : 350)*(0.0215)}px`;
        dot.style.marginLeft = `${width*(0.0315)}px`;
        holder.appendChild( dot );
      } else {
        dot4.className = 'dot4';
        dot4.style.width = `${width*0.03}px`;
        dot4.style.height = `${(!isMobile ? window.innerHeight : 350)*0.031}px`;
        dot4.style.marginTop = !isMobile ? `${window.innerHeight*(0.02125)}px` :  `${350*(0.02)}px`;
        dot4.style.marginLeft = `${width*(0.0245)}px`;
        holder.appendChild( dot4 );
        dot3.className = 'dot3';
        dot3.style.width = `${width*0.02}px`;
        dot3.style.height = `${(!isMobile ? window.innerHeight : 350)*0.02}px`;
        dot3.style.marginTop = !isMobile ? `${window.innerHeight*(0.02625)}px` :`${350*(0.025)}px` ;
        dot3.style.marginLeft = !isMobile ? `${width*(0.02925)}px`: `${width*(0.029)}px`;
        holder.appendChild( dot3 );

        dot2.className = 'dot2';
        dot2.style.width = `${width*0.01}px`;
        dot2.style.height = `${(!isMobile ? window.innerHeight : 350)*0.01}px`;
        dot2.style.marginTop = `${(!isMobile ? window.innerHeight : 350)*(0.0325)}px`;
        dot2.style.marginLeft = `${width*(0.035)}px`;
        holder.appendChild( dot2 );
        // create dot
        dot.className = 'dot';
        dot.style.width = `${width*0.005}px`;
        dot.style.height = `${(!isMobile ? window.innerHeight : 350)*0.005}px`;
        dot.style.marginTop = `${(!isMobile ? window.innerHeight : 350)*(0.035)}px`;
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
      let total = Math.floor(number/1000);
      return `${total>999 ?Math.floor(total/1000) : total}${total>999 ? "M": "K"}`;
    }

    // function convertNumberToStringFormat (number) {
    //   let values = number.toFixed(2).toString().split('.');
    //   return values[0].replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,") + (values.length === 2 && parseInt(values[1])  ? '.' + values[1] : '');
    // }
  }


  render() {
    const { isMobile } = this.state;
    return (
        <div style={{display: 'flex', flexDirection: 'row'}}>
          {!isMobile && <div style={{ width: window.innerWidth*0.4, height: window.innerHeight}}>
            
          </div>}
          <div id="chartdiv" style={{ width: !isMobile ? window.innerWidth*0.6 : window.innerWidth, height: window.innerHeight}}>
              <Fan/>
          </div>
        </div>
    );
  }
}

export default App;
