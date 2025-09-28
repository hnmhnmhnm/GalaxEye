import React, {useState, useRef} from 'react';
import { MapContainer, TileLayer, FeatureGroup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';

function AOIDraw({onChange}) {
  // Minimal: allow user to click two points to create bbox AOI
  useMapEvents({
    click(e){
      onChange(prev => {
        const pts = prev ? prev.concat([[e.latlng.lat,e.latlng.lng]]) : [[e.latlng.lat,e.latlng.lng]];
        if(pts.length>2) pts.shift();
        return pts;
      });
    }
  });
  return null;
}

export default function App(){
  const [files,setFiles] = useState({a:null,b:null});
  const [aoi, setAoi] = useState(null);
  const [status, setStatus] = useState('');
  const fileInputA = useRef(), fileInputB = useRef();

  const upload = async () => {
    if(!files.a || !files.b) return alert('Select both files');
    const form = new FormData();
    form.append('a', files.a);
    form.append('b', files.b);
    setStatus('Uploading...');
    const res = await axios.post('http://localhost:4000/upload', form, { headers:{'Content-Type':'multipart/form-data'}});
    setStatus('Uploaded to: '+res.data.files.a+' , '+res.data.files.b);
  };

  const process = async () => {
    if(!aoi) return alert('Draw AOI by clicking two points on the map to make bbox');
    setStatus('Processing...');
    const body = { aoi_bbox: aoi, file_a: files.a?.name, file_b: files.b?.name };
    const res = await axios.post('http://localhost:4000/process', body);
    setStatus('Processing finished. Result: '+res.data.output);
  };

  return (
    <div className="app">
      <div className="top">
        <strong>Geospatial App</strong>
      </div>
      <div className="main">
        <div className="map">
          <MapContainer center={[20,78]} zoom={5} style={{height:'100%'}}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <FeatureGroup>
              <AOIDraw onChange={(pts)=>setAoi(pts)} />
            </FeatureGroup>
          </MapContainer>
        </div>
        <div className="side">
          <h3>Upload GeoTIFFs</h3>
          <input ref={fileInputA} type="file" accept=".tif,.tiff" onChange={e=>setFiles(f=>({...f,a:e.target.files[0]}))} />
          <br/>
          <input ref={fileInputB} type="file" accept=".tif,.tiff" onChange={e=>setFiles(f=>({...f,b:e.target.files[0]}))} />
          <br/><br/>
          <button onClick={upload}>Upload</button>
          <button onClick={process} style={{marginLeft:8}}>Process AOI</button>
          <p>Status: {status}</p>
          <p>AOI points: {aoi ? JSON.stringify(aoi) : 'Click two points on map to define bbox'}</p>
        </div>
      </div>
    </div>
  );
}
