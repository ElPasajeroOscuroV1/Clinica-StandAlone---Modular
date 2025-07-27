import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import * as faceapi from 'face-api.js';
import { environment } from '../../../environments/environment.development'; // Import environment variable

@Component({
  selector: 'app-facial-capture',
  templateUrl: './facial-capture.component.html',
  styleUrls: ['./facial-capture.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class FacialCaptureComponent implements OnInit {
  public capturedImage: string = '';
  public detectionStatus: string = 'Iniciando...'; // Estado inicial para el usuario
  public isLoadingModels: boolean = true; // Para controlar el estado de carga de modelos

  constructor() {}

  async ngOnInit() {
    // Inicia la carga de modelos apenas se inicializa el componente
    await this.loadFaceApiModels();
  }
  /**
   * Carga los modelos de Face-API.js desde la ruta definida en el entorno.
   * Utiliza Promise.all para cargar en paralelo y mejora el manejo de errores.
   */
  /* VERSION 1
  private async loadFaceApiModels() {
    try {
      await faceapi.nets.tinyFaceDetector.loadFromUri('/assets/models');
      await faceapi.nets.faceLandmark68Net.loadFromUri('/assets/models');
      await faceapi.nets.faceRecognitionNet.loadFromUri('/assets/models');
    } catch (error) {
      console.error('Error cargando modelos:', error);
    }
  }
  */
  /* VERSION 2 */
  private async loadFaceApiModels() {
    try {
      this.isLoadingModels = true;
      this.detectionStatus = 'Cargando modelos de IA...';

      /* v2 */
      //const modelsPath = `${window.location.origin}${environment.faceApiConfig.modelsPath}`;
      /*
      const modelsPath = `${environment.faceApiConfig.modelsPath}/tinyFaceDetector`; 
      console.log('Cargando modelos de Face-API desde:', modelsPath);
      */
      //console.log('Cargando modelos de Face-API desde:', environment.faceApiConfig.modelsPath);

      const baseModelPath = environment.faceApiConfig.modelsPath;
      console.log('Cargando modelos de Face-API desde:', baseModelPath);

      //const modelPath = environment.faceApiConfig.modelsPath; // ./assets/models
      //console.log('Cargando modelos de Face-API desde:', modelPath);

      // Asegúrate de que la ruta base termine sin slash
      //const modelPath = baseModelPath.endsWith('/') ? baseModelPath.slice(0, -1) : baseModelPath;
      

      // Carga todos los modelos necesarios en paralelo
      await Promise.all([
        // Añade aquí otros modelos que necesites, por ejemplo:
        //faceapi.nets.ageGenderNet.loadFromUri(environment.faceApiConfig.modelsPath),
        //faceapi.nets.faceExpressionNet.loadFromUri(environment.faceApiConfig.modelsPath)

        /* v1
        //faceapi.nets.tinyFaceDetector.loadFromUri(environment.faceApiConfig.modelsPath),
        // Cambia tinyFaceDetector por ssdMobilenetv1
        faceapi.nets.ssdMobilenetv1.loadFromUri(environment.faceApiConfig.modelsPath),
        faceapi.nets.faceLandmark68Net.loadFromUri(environment.faceApiConfig.modelsPath),
        faceapi.nets.faceRecognitionNet.loadFromUri(environment.faceApiConfig.modelsPath)
        */
        /* v2 
        //const modelsPath = environment.faceApiConfig.modelsPath;
        faceapi.nets.tinyFaceDetector.loadFromUri(modelsPath),
        //faceapi.nets.faceLandmark68Net.loadFromUri(modelsPath),
        //faceapi.nets.faceRecognitionNet.loadFromUri(modelsPath)
        faceapi.nets.faceLandmark68Net.loadFromUri(`${environment.faceApiConfig.modelsPath}/face_landmark_68`),
        faceapi.nets.faceRecognitionNet.loadFromUri(`${environment.faceApiConfig.modelsPath}/face_recognition`)
        */
        /* v3 
        faceapi.nets.tinyFaceDetector.loadFromUri(environment.faceApiConfig.modelsPath),
        faceapi.nets.faceLandmark68Net.loadFromUri(environment.faceApiConfig.modelsPath),
        faceapi.nets.faceRecognitionNet.loadFromUri(environment.faceApiConfig.modelsPath),
        */
        /* v4 
        faceapi.nets.tinyFaceDetector.loadFromUri(`${modelPath}`),
        faceapi.nets.faceLandmark68Net.loadFromUri(`${modelPath}`),
        faceapi.nets.faceRecognitionNet.loadFromUri(`${modelPath}`)
        */
        // v5
        //faceapi.nets.tinyFaceDetector.loadFromUri(`${modelPath}/tiny_face_detector`),
        //faceapi.nets.faceLandmark68Net.loadFromUri(`${modelPath}/face_landmark_68`),
        //faceapi.nets.faceRecognitionNet.loadFromUri(`${modelPath}/face_recognition`)
        //
        faceapi.nets.tinyFaceDetector.loadFromUri(`${baseModelPath}/tiny_face_detector`),
        faceapi.nets.faceLandmark68Net.loadFromUri(`${baseModelPath}/face_landmark_68`),
        faceapi.nets.faceRecognitionNet.loadFromUri(`${baseModelPath}/face_recognition`)
      ]);

      this.isLoadingModels = false;
      this.detectionStatus = 'Modelos de IA cargados. Listo para tomar foto.';
      console.log('Modelos de Face-API cargados exitosamente.');

    } catch (error) {
      console.error('Error cargando modelos de Face-API:', error);
      this.detectionStatus = 'Error al cargar modelos de IA. Revisa la consola.';
      this.isLoadingModels = false; // Asegura que el estado se actualice incluso con error
    }
  }

  /**
   * Captura una imagen utilizando la API de la cámara de Capacitor.
   * Verifica si los modelos están cargados antes de permitir la captura.
   */
  /* VERSION 1
  public async captureImage() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera
      });

      this.capturedImage = image.dataUrl || '';
      if (this.capturedImage) {
        await this.detectFace();
      }
    } catch (error) {
      console.error('Error capturando imagen:', error);
    }
  }
  */
  /* VERSION 2 */
  public async captureImage() {
    if (this.isLoadingModels) {
      this.detectionStatus = 'Por favor, espera a que los modelos de IA terminen de cargar...';
      return; // No permite capturar si los modelos no están listos
    }

    try {
      this.detectionStatus = 'Abriendo cámara...';
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl, // Ideal para mostrar y procesar en el frontend
        source: CameraSource.Camera // Usa la cámara frontal o trasera
      });

      this.capturedImage = image.dataUrl || '';
      if (this.capturedImage) {
        this.detectionStatus = 'Imagen capturada. Analizando rostro...';
        await this.detectFace();
      } else {
        this.detectionStatus = 'Captura de imagen cancelada.';
      }
    } catch (error) {
      console.error('Error al capturar imagen:', error);
      this.detectionStatus = 'Error al capturar imagen.';
    }
  }

  /**
   * Detecta rostros en la imagen capturada.
   * Asegura que la imagen esté completamente cargada antes de la detección.
   */
  /* VERSION 1
  private async detectFace() {
    if (!this.capturedImage) return;

    const img = new Image();
    img.src = this.capturedImage;

    try {
      const detections = await faceapi.detectAllFaces(
        img,
        new faceapi.TinyFaceDetectorOptions()
      ).withFaceLandmarks();

      if (detections.length > 0) {
        this.detectionStatus = 'Rostro detectado exitosamente';
        // Aquí puedes agregar la lógica para enviar la imagen al backend
      } else {
        this.detectionStatus = 'No se detectó ningún rostro';
      }
    } catch (error) {
      console.error('Error en la detección facial:', error);
      this.detectionStatus = 'Error en la detección facial';
    }
  }
  */
  /* VERSION 2 */
  private async detectFace() {
    if (!this.capturedImage) {
      this.detectionStatus = 'No hay imagen para detección.';
      return;
    }

    const img = new Image();
    img.src = this.capturedImage;

    // Espera a que la imagen se cargue completamente
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = (e) => {
        console.error('Error al cargar la imagen para detección:', e);
        this.detectionStatus = 'Error al procesar la imagen capturada.';
        reject('Error al cargar la imagen'); // Rechaza la promesa en caso de error
      };
    });

    // Pequeña verificación adicional por si la imagen no se cargó correctamente (aunque onload debería atrapar la mayoría)
    if (!img.complete || img.naturalWidth === 0) {
      this.detectionStatus = 'La imagen no se cargó correctamente para la detección. Intenta de nuevo.';
      return;
    }

    try {
      // Realiza la detección facial
      const detections = await faceapi.detectAllFaces(
        img,
        new faceapi.TinyFaceDetectorOptions() // Usa las opciones específicas para tinyFaceDetector
        // Cambia TinyFaceDetectorOptions por SsdMobilenetv1Options
        //new faceapi.SsdMobilenetv1Options()

      ).withFaceLandmarks(); // Para obtener los puntos clave del rostro

      if (detections.length > 0) {
        this.detectionStatus = `¡Rostro(s) detectado(s) exitosamente! (${detections.length} encontrado(s)).`;
        // Aquí iría la lógica para enviar la imagen al backend, por ejemplo:
        // this.sendImageToBackend(this.capturedImage, detections);
        console.log('Detecciones de rostro:', detections);
      } else {
        this.detectionStatus = 'No se detectó ningún rostro. Por favor, asegúrate de que tu rostro esté visible y bien iluminado.';
      }
    } catch (error) {
      console.error('Error durante la detección facial con Face-API:', error);
      this.detectionStatus = 'Error en la detección facial. Consulta la consola para más detalles.';
    }
  }

  // Puedes añadir un método para limpiar la imagen y el estado si el usuario quiere reintentar
  public resetCapture() {
    this.capturedImage = '';
    this.detectionStatus = 'Listo para tomar otra foto.';
  }
}