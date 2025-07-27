// src/environments/environment.development.ts
export const environment = {
    production: false,
    apiUrl: 'http://localhost:8000/api',
    faceApiConfig: {
      //modelsPath: '/assets/models'
      //modelsPath: './assets/models'
      //modelsPath: '/assets/models/tiny_face_detector'
      //modelsPath: 'http://localhost:58935/assets/models/tiny_face_detector'
      //modelsPath: 'http://localhost:58935/assets/models'
      //Ruta relativa a los modelos, compatible con Capacitor 
      //modelsPath: './assets/models',
      /** Ruta específica para tinyFaceDetector, si es necesario */
      //tinyFaceDetectorPath: './assets/models/tiny_face_detector'
      modelsPath: 'http://localhost:53310/assets/models'
    }
  };