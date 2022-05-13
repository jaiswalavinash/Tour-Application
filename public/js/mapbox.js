/* eslint-disable */

export const displayMap = (locations)=>{
  mapboxgl.accessToken =
  'pk.eyJ1IjoiYXZpLWo5NyIsImEiOiJjbDJ3NXppMWkwOXJsM3BxbGk0bmtqY2hjIn0.Wr1dbQaGXhC0BqhRv4ATWg';
var map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v11',
  scrollZoom:false,
  interactive:false,
  center: [-74.5, 40],
  zoom: 10,
});
}



