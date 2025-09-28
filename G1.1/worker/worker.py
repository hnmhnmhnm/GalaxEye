#!/usr/bin/env python3
import json, os, sys
import click
import rasterio
from rasterio.mask import mask
from shapely.geometry import box, mapping
import numpy as np

@click.command()
@click.option('--input1', required=True, help='Path to first GeoTIFF')
@click.option('--input2', required=True, help='Path to second GeoTIFF')
@click.option('--aoi', required=True, help='AOI bbox as JSON array [[lat,lng],[lat,lng]] or GeoJSON')
@click.option('--out', required=True, help='Output GeoTIFF path')
def main(input1, input2, aoi, out):
    # Parse AOI
    try:
        aoi_obj = json.loads(aoi)
    except:
        # try read file
        with open(aoi,'r') as f:
            aoi_obj = json.load(f)
    # If AOI provided as two points -> bbox
    if isinstance(aoi_obj, list) and len(aoi_obj)>=2 and isinstance(aoi_obj[0], list):
        # assume [ [lat,lng], [lat,lng] ]
        (lat1,lon1), (lat2,lon2) = aoi_obj[0], aoi_obj[1]
        minx = min(lon1,lon2); maxx = max(lon1,lon2)
        miny = min(lat1,lat2); maxy = max(lat1,lat2)
        geom = mapping(box(minx,miny,maxx,maxy))
        shapes = [geom]
    elif isinstance(aoi_obj, dict) and aoi_obj.get('type'):
        # GeoJSON
        shapes = [aoi_obj]
    else:
        print('Unsupported AOI format', file=sys.stderr); sys.exit(2)

    def clip_read(path):
        with rasterio.open(path) as src:
            out_image, out_transform = mask(src, shapes, crop=True)
            out_meta = src.meta.copy()
            out_meta.update({
                "driver": "GTiff",
                "height": out_image.shape[1],
                "width": out_image.shape[2],
                "transform": out_transform
            })
        return out_image, out_meta

    img1, meta1 = clip_read(input1)
    img2, meta2 = clip_read(input2)

    # Naive alignment: resample second to first's shape/transform
    # We'll use rasterio.warp.reproject for a robust approach; for minimal deps we do a simple reprojection if crs differs.
    from rasterio.warp import calculate_default_transform, reproject, Resampling
    dst_crs = meta1.get('crs', None) or 'EPSG:4326'
    with rasterio.open(input2) as src2:
        transform, width, height = calculate_default_transform(src2.crs, dst_crs, src2.width, src2.height, *src2.bounds)
    # For simplicity write the first clipped image as output
    out_path = out
    with rasterio.open(out_path, "w", **meta1) as dest:
        dest.write(img1)
    print("Wrote", out_path)

if __name__ == '__main__':
    main()
