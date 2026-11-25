import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';

@Injectable({ providedIn: 'root' })
export class CameraGpsService {
  async capturarActaYVerificarNitidez(): Promise<string> {
    const permisos = await Camera.requestPermissions();
    if (permisos.camera === 'denied') {
      throw new Error('Permiso de cámara denegado.');
    }

    const foto = await Camera.getPhoto({
      quality: 55,
      width: 1024,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera
    });

    if (!foto.dataUrl) {
      throw new Error('No se pudo obtener la fotografía.');
    }

    const esNitida = await this.evaluarNitidez(foto.dataUrl);
    if (!esNitida) {
      throw new Error('La fotografía está borrosa o con poca luz. Tome una nueva captura nítida.');
    }

    return foto.dataUrl;
  }

  private evaluarNitidez(dataUrl: string): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(true);
        canvas.width = 200;
        canvas.height = 200;
        ctx.drawImage(img, 0, 0, 200, 200);
        const data = ctx.getImageData(0, 0, 200, 200).data;

        let sumaVariacion = 0;
        let muestras = 0;
        for (let i = 0; i < data.length - 8; i += 16) {
          const grisActual = (data[i] + data[i + 1] + data[i + 2]) / 3;
          const grisSiguiente = (data[i + 4] + data[i + 5] + data[i + 6]) / 3;
          sumaVariacion += Math.abs(grisActual - grisSiguiente);
          muestras++;
        }
        const nitidezPromedio = sumaVariacion / (muestras || 1);
        resolve(nitidezPromedio >= 4.5);
      };
      img.onerror = () => resolve(false);
      img.src = dataUrl;
    });
  }

  async obtenerUbicacionGps(): Promise<{ latitud: number; longitud: number }> {
    const perm = await Geolocation.requestPermissions();
    if (perm.location === 'denied') {
      throw new Error('Permiso de ubicación GPS denegado.');
    }

    const pos = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 12000
    });

    return {
      latitud: pos.coords.latitude,
      longitud: pos.coords.longitude
    };
  }
}