import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common'; // Agrega esto
import { Doctor } from '../../interfaces/doctor.interface';
import { DoctorService } from '../../services/doctor.service';

@Component({
  selector: 'app-doctor',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './doctor.component.html',
  styleUrls: ['./doctor.component.css']
})
export class DoctorComponent implements OnInit {
  doctors: Doctor[] = [];
  doctorForm: FormGroup;
  isEditing = false;
  currentDoctorId?: number;

  constructor(
    private doctorService: DoctorService,
    private fb: FormBuilder
  ) {
    this.doctorForm = this.fb.group({
      name: ['', Validators.required],
      specialty: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      available: [true]
    });
  }

  ngOnInit(): void {
    this.loadDoctors();
  }

  loadDoctors(): void {
    this.doctorService.getDoctors().subscribe({
      next: (data) => this.doctors = data,
      error: (error) => console.error('Error cargando médicos:', error)
    });
  }

  onSubmit(): void {
    if (this.doctorForm.valid) {
      if (this.isEditing && this.currentDoctorId) {
        this.doctorService.updateDoctor(this.currentDoctorId, this.doctorForm.value).subscribe({
          next: () => {
            this.loadDoctors();
            this.resetForm();
          },
          error: (error) => console.error('Error actualizando médico:', error)
        });
      } else {
        this.doctorService.createDoctor(this.doctorForm.value).subscribe({
          next: () => {
            this.loadDoctors();
            this.resetForm();
          },
          error: (error) => console.error('Error creando médico:', error)
        });
      }
    }
  }

  editDoctor(doctor: Doctor): void {
    this.isEditing = true;
    this.currentDoctorId = doctor.id;
    this.doctorForm.patchValue(doctor);
  }

  deleteDoctor(id: number): void {
    if (confirm('¿Estás seguro de que deseas eliminar este médico?')) {
      this.doctorService.deleteDoctor(id).subscribe({
        next: () => this.loadDoctors(),
        error: (error) => console.error('Error eliminando médico:', error)
      });
    }
  }

  resetForm(): void {
    this.isEditing = false;
    this.currentDoctorId = undefined;
    this.doctorForm.reset({ available: true });
  }
}