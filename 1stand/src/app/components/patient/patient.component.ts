import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common'; // Importa CommonModule
import { PatientService } from '../../services/patient.service';
import { Patient } from '../../interfaces/patient.interface';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import * as faceapi from 'face-api.js';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap'; // Si usas NgbModal
import { MedicalHistoryModalComponent } from '../medical-history-modal/medical-history-modal.component'; // Tu nuevo componente modal

@Component({
  selector: 'app-patient',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './patient.component.html',
  styleUrls: ['./patient.component.css']
})
export class PatientComponent implements OnInit {
  patients: Patient[] = [];
  patientForm: FormGroup;
  isEditing = false;
  currentPatientId?: number;
  loading = false; // Para mostrar un spinner o estado de carga

  isProcessing: boolean = false; //xd

  capturedImage: string = '';
  faceDetected: boolean = false;
  detectionStatus: string = '';

  constructor(
    private patientService: PatientService,
    private fb: FormBuilder,
    private modalService: NgbModal // Inyectar NgbModal si la usas

  ) {
    this.patientForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(255)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
      ci: ['', [Validators.required, Validators.maxLength(20)]],
      phone: ['', [Validators.required, Validators.maxLength(20)]],
      address: ['', [Validators.required, Validators.maxLength(255)]],
      birth_date: ['', [Validators.required]],
      medical_history: [''],
      face_image: [''] // Nuevo campo para la imagen facial
    });
  }

  //
  //ngOnInit(): void {
  //  this.loadPatients();
  //}
  //

  async ngOnInit() {
    await this.loadFaceApiModels();
    this.loadPatients();
  }

  private async loadFaceApiModels() {
    try {
      const modelPath = 'assets/models';
      console.log('Cargando modelos desde:', modelPath);
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(`${modelPath}/tiny_face_detector`),
        faceapi.nets.faceLandmark68Net.loadFromUri(`${modelPath}/face_landmark_68`),
        faceapi.nets.faceRecognitionNet.loadFromUri(`${modelPath}/face_recognition`)
      ]);
      console.log('Modelos cargados exitosamente');
    } catch (error) {
      console.error('Error cargando modelos de Face API:', error);
      this.detectionStatus = 'Error al cargar los modelos de reconocimiento facial.';

    }
  }

  async captureImage() {
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

  private async detectFace() {
    if (!this.capturedImage) return;

    this.isProcessing = true; // <--- comenzamos a procesar
    this.detectionStatus = ''; // opcional: limpia el mensaje anterior

    const img = new Image();
    img.src = this.capturedImage;

    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
    });

    try {
      const detections = await faceapi.detectAllFaces(
        img,
        new faceapi.TinyFaceDetectorOptions()
      ).withFaceLandmarks();

      if (detections.length > 0) {
        this.faceDetected = true;
        this.detectionStatus = 'Rostro detectado exitosamente';
        this.patientForm.patchValue({ face_image: this.capturedImage });
      } else {
        this.faceDetected = false;
        this.detectionStatus = 'No se detectó ningún rostro';
      }
    } catch (error) {
      console.error('Error en la detección facial:', error);
      this.detectionStatus = 'Error en la detección facial';
    } finally {
      this.isProcessing = false; // <--- termina el procesamiento
    }
  }

  loadPatients(): void {
    this.patientService.getPatients().subscribe(patients => {
      this.patients = patients;
      this.loading = false;
    });
  }
  /*
  onSubmit() {
    if (this.patientForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.patientForm.controls).forEach(key => {
        const control = this.patientForm.get(key);
        control?.markAsTouched();
      });
      return;
    }
    */

    async onSubmit() {
      if (this.patientForm.valid && this.faceDetected && this.capturedImage) {
        const patientData = this.patientForm.value;
        
        if (this.isEditing && this.currentPatientId) {
          // Actualizar paciente existente
          this.patientService.updatePatient(this.currentPatientId, patientData, this.capturedImage)
            .subscribe({
              next: (response) => {
                console.log('Paciente actualizado con éxito');
                this.loadPatients(); // Recargar la lista
                this.resetForm();
              },
              error: (error) => console.error('Error actualizando paciente:', error)
            });
        } else {
          // Crear nuevo paciente
          this.patientService.createPatient(patientData, this.capturedImage)
            .subscribe({
              next: (response) => {
                console.log('Paciente creado con éxito');
                this.loadPatients(); // Recargar la lista
                this.resetForm(); // Esto limpiará el formulario y la imagen
              },
              error: (error) => console.error('Error creando paciente:', error)
            });
        }
      }
    }

    /*
    onSubmit() {
      if (this.patientForm.invalid || !this.faceDetected) {
        // Validar que se haya detectado un rostro
        if (!this.faceDetected) {
          this.detectionStatus = 'Por favor, capture una foto válida del rostro';
        }
        return;
      }
  
    this.loading = true;
    const patientData = {
      ...this.patientForm.value,
      birth_date: this.patientForm.get('birth_date')?.value
    };
  
    if (this.isEditing && this.currentPatientId) {
      this.patientService.updatePatient(this.currentPatientId, patientData)
        .subscribe({
          next: () => {
            this.loadPatients();
            this.resetForm();
            this.loading = false;
          },
          error: (error) => {
            console.error('Error updating patient:', error);
            if (error.status === 422) {
              const validationErrors = error.error.errors;
              Object.keys(validationErrors).forEach(key => {
                const control = this.patientForm.get(key);
                if (control) {
                  control.setErrors({ serverError: validationErrors[key][0] });
                }
              });
            }
            this.loading = false;
          }
        });
    } else {
      this.patientService.createPatient(patientData)
        .subscribe({
          next: () => {
            this.loadPatients();
            this.resetForm();
            this.loading = false;
          },
          error: (error) => {
            console.error('Error creating patient:', error);
            if (error.status === 422) {
              const validationErrors = error.error.errors;
              Object.keys(validationErrors).forEach(key => {
                const control = this.patientForm.get(key);
                if (control) {
                  control.setErrors({ serverError: validationErrors[key][0] });
                }
              });
            }
            this.loading = false;
          }
        });
    }
  }
  */

  editPatient(patient: Patient): void {
    this.isEditing = true;
    this.currentPatientId = patient.id;
    //this.patientForm.patchValue(patient);
    //para sobre llevar error date de edicion de paciente
    // Transforma la fecha al formato yyyy-MM-dd
    /**/
    const birthDate = patient.birth_date
      ? new Date(patient.birth_date).toISOString().split('T')[0]
      : '';

    // Incluir el patient_id al editar
    /*
    this.patientForm.patchValue({
      //patient_id: patient.id,
      name: patient.name,
      email: patient.email,
      phone: patient.phone,
      address: patient.address,
      birth_date: birthDate,
      medical_history: patient.medical_history
    });
    */
   
   // Asigna los valores al formulario, ajustando la fecha
    this.patientForm.patchValue({
      ...patient,
      birth_date: birthDate
    });
    // Deshabilitar la edición del patient_id
    //this.patientForm.get('patient_id')?.disable();

    /*
    // Asigna los valores al formulario, ajustando la fecha
    this.patientForm.patchValue({
      patient_id: patient.patient_id,  // Agregamos este campo
      ...patient,
      birth_date: birthDate
    });
    */
    // Mostrar la imagen actual si existe
    if (patient.face_image) {
      this.capturedImage = `http://localhost:8000/storage/${patient.face_image}`;
      this.faceDetected = true; // Opcional: puedes asumir que ya fue validada antes
      this.detectionStatus = 'Foto previamente registrada';
    } else {
      this.capturedImage = '';
      this.faceDetected = false;
      this.detectionStatus = '';
    }

  }

  deletePatient(id: number): void {
    if (confirm('¿Está seguro de que desea eliminar este paciente?')) {
      this.patientService.deletePatient(id).subscribe(() => {
        this.loadPatients();
      });
    }
  }

  resetForm(): void {
    this.patientForm.reset();
    this.isEditing = false;
    this.currentPatientId = undefined;
    this.capturedImage = ''; // Limpiar la imagen capturada
    this.faceDetected = false; // Resetear el estado de detección facial
    this.detectionStatus = ''; // Limpiar el mensaje de estado
    //this.patientForm.get('patient_id')?.enable(); // Habilitar el campo patient_id
    this.loading = false;
  }


  openMedicalHistoryModal(): void {
    if (!this.currentPatientId && !this.isEditing) {
      // Si intentas abrir el historial de un paciente nuevo que aún no ha sido guardado
      alert('Primero debe registrar al paciente para gestionar su historial clínico.');
      return;
    }
  
    // Si usas NgbModal
    const modalRef = this.modalService.open(MedicalHistoryModalComponent, { size: 'xl' }); // Puedes ajustar el tamaño
    modalRef.componentInstance.patientId = this.currentPatientId; // Pasar el ID del paciente al modal
    modalRef.componentInstance.patientData = this.patientForm.value; // Puedes pasar también los datos actuales del formulario
  
    modalRef.result.then((result) => {
      // Aquí puedes manejar lo que sucede cuando el modal se cierra (ej. guardar el historial)
      if (result === 'save') {
        console.log('Historial guardado desde el modal');
        // Puedes recargar el paciente o hacer otra acción si es necesario
      }
    }, (reason) => {
      console.log(`Modal dismissed: ${reason}`);
    });
  }

}