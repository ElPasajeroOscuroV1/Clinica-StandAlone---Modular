import { Injectable } from '@angular/core';
import * as faceapi from 'face-api.js';
import { from, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FaceDetectionService {
  private modelLoaded = false;

  async loadModels() {
    if (!this.modelLoaded) {
      await faceapi.nets.ssdMobilenetv1.loadFromUri('/assets/models');
      await faceapi.nets.faceLandmark68Net.loadFromUri('/assets/models');
      await faceapi.nets.faceRecognitionNet.loadFromUri('/assets/models');
      this.modelLoaded = true;
    }
  }

  async detectFace(imageElement: HTMLImageElement) {
    await this.loadModels();
    const detection = await faceapi.detectSingleFace(imageElement)
      .withFaceLandmarks()
      .withFaceDescriptor();
    return detection;
  }
}