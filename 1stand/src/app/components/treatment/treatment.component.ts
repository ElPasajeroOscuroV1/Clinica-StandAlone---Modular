import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Treatment, TreatmentService } from '../../services/treatment.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-treatment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './treatment.component.html',
  styleUrls: ['./treatment.component.css']
})
export class TreatmentComponent implements OnInit {
  treatments: any[] = [];
  loading = false;
  // Modelo para crear/editar
  treatmentForm: Treatment = {
    nombre: '',
    descripcion: '',
    precio: 0,
    duracion: 0
  };
  editMode = false; // true si estamos editando
  selectedId?: number;

  constructor(private treatmentService: TreatmentService) {}

  ngOnInit(): void {
    this.loadTreatments();
  }

  loadTreatments() {
    this.loading = true;
    this.treatmentService.getAll().subscribe({
      next: (res) => this.treatments = res,
      error: (err) => console.error('Error cargando tratamientos:', err),
      complete: () => this.loading = false
    });
  }

  saveTreatment() {
    if (this.editMode && this.selectedId) {
      // Actualizar
      this.treatmentService.update(this.selectedId, this.treatmentForm).subscribe({
        next: () => {
          alert('Tratamiento actualizado con éxito');
          this.resetForm();
          this.loadTreatments();
        },
        error: (err) => console.error('Error actualizando tratamiento:', err)
      });
    } else {
      // Crear
      this.treatmentService.create(this.treatmentForm).subscribe({
        next: () => {
          alert('Tratamiento creado con éxito');
          this.resetForm();
          this.loadTreatments();
        },
        error: (err) => console.error('Error creando tratamiento:', err)
      });
    }
  }

  editTreatment(treatment: Treatment) {
    this.editMode = true;
    this.selectedId = treatment.id;
    this.treatmentForm = { ...treatment }; // copiar datos al form
  }

  deleteTreatment(id: number) {
    if (confirm('¿Seguro que deseas eliminar este tratamiento?')) {
      this.treatmentService.delete(id).subscribe({
        next: () => {
          alert('Tratamiento eliminado');
          this.loadTreatments();
          },
          error: (err) => console.error('Error eliminando tratamiento:', err)
        });
      }
    }

    resetForm() {
      this.treatmentForm = {
        nombre: '',
        descripcion: '',
        precio: 0,
        duracion: 0
      };
      this.editMode = false;
      this.selectedId = undefined;
    }
}
