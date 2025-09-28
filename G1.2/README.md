# Geospatial App - Full Stack (React + Node + Python)

This repository contains a starter implementation of a full-stack geospatial web application that allows uploading two GeoTIFFs, previewing them, drawing an AOI, and processing (clip + align) via a Python worker.

## Contents
- `frontend/` — React app (Leaflet map, upload UI)
- `backend/` — Node.js (Express) API for uploads and orchestration
- `worker/` — Python worker (rasterio) that clips and aligns rasters
- `docker-compose.yml` — Bring up frontend, backend, and worker


## Quickstart (local without Docker)
1. Download two GeoTIFFs into a `data/` folder at the repo root.
2. Backend:
   ```bash
   cd backend
   npm install
   npm start
   ```
3. Worker (for manual testing)
   ```bash
   cd worker
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   python worker.py --input1 ../data/img1.tif --input2 ../data/img2.tif --aoi aoi.geojson --out out.tif
   ```
4. Frontend:
   ```bash
   cd frontend
   npm install
   npm start
   ```


This starter project is intentionally minimal — modify and extend for production use.
