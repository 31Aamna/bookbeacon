export default function LocationLegend() {
  return <div className="map-legend" aria-label="Map legend"><span><i className="map-legend__dot map-legend__dot--normal" />Available shelf</span><span><i className="map-legend__dot map-legend__dot--selected" />Selected shelf</span><span><i className="map-legend__dot map-legend__dot--destination" />Destination</span><span><i className="map-legend__dot map-legend__dot--amenity" />Library service</span></div>;
}
