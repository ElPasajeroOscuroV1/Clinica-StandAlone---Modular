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
    duracion: 0,
    precio_original: 0,
    descuento_porcentaje: 0,
    descuento_monto: 0,
    tiene_descuento: false,
    motivo_descuento: ''
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
      console.log('Datos a enviar:', this.treatmentForm); // Debug
      this.treatmentService.create(this.treatmentForm).subscribe({
        next: () => {
          alert('Tratamiento creado con éxito');
          this.resetForm();
          this.loadTreatments();
        },
        error: (err) => {
          console.error('Error creando tratamiento:', err);
          console.error('Detalles del error:', err.error); // Debug detallado
        }
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
        duracion: 0,
        precio_original: 0,
        descuento_porcentaje: 0,
        descuento_monto: 0,
        tiene_descuento: false,
        motivo_descuento: ''
      };
      this.editMode = false;
      this.selectedId = undefined;
    }

    // Calcular precio con descuento en tiempo real (frontend)
    getPrecioConDescuento(): number {
      const precio = this.treatmentForm.precio || 0;
      let precioConDescuento = precio;

      // Aplicar descuento por porcentaje
      if (this.treatmentForm.descuento_porcentaje && this.treatmentForm.descuento_porcentaje > 0) {
        precioConDescuento = precioConDescuento * (1 - (this.treatmentForm.descuento_porcentaje / 100));
      }

      // Aplicar descuento por monto fijo
      if (this.treatmentForm.descuento_monto && this.treatmentForm.descuento_monto > 0) {
        precioConDescuento = Math.max(0, precioConDescuento - this.treatmentForm.descuento_monto);
      }

      return Math.round(precioConDescuento * 100) / 100; // Redondear a 2 decimales
    }

    // Calcular ahorro
  getAhorro(): number {
    return Math.round((this.treatmentForm.precio - this.getPrecioConDescuento()) * 100) / 100;
  }

  // Getters for template
  get treatmentsWithDiscount(): number {
    return this.treatments.filter(t => t.tiene_descuento).length;
  }

  get hasTreatmentsWithDiscount(): boolean {
    return this.treatments.some(t => t.tiene_descuento);
  }
}
